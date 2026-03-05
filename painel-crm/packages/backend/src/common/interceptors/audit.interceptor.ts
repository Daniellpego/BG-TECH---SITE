import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

/**
 * AuditInterceptor — logs every mutating request (POST, PUT, PATCH, DELETE)
 * with tenant, user, path, method, status, and duration.
 *
 * In production this should write to a persistent audit table or external
 * SIEM. For now it uses NestJS Logger in structured JSON format.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;

    // Only log mutating operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const start = Date.now();
    const user = (req as any).user;
    const tenantId = (req as any).tenantId;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const res = context.switchToHttp().getResponse();
          this.logger.log(
            JSON.stringify({
              event: 'audit',
              method,
              path: req.originalUrl,
              status: res.statusCode,
              tenantId: tenantId || 'anonymous',
              userId: user?.id || 'anonymous',
              userEmail: user?.email || 'anonymous',
              durationMs: duration,
              ip: req.ip,
              userAgent: req.headers['user-agent']?.substring(0, 120),
              timestamp: new Date().toISOString(),
            }),
          );
        },
        error: (err) => {
          const duration = Date.now() - start;
          this.logger.warn(
            JSON.stringify({
              event: 'audit_error',
              method,
              path: req.originalUrl,
              status: err.status || 500,
              tenantId: tenantId || 'anonymous',
              userId: user?.id || 'anonymous',
              error: err.message,
              durationMs: duration,
              ip: req.ip,
              timestamp: new Date().toISOString(),
            }),
          );
        },
      }),
    );
  }
}
