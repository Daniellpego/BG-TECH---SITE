import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaSessionService } from '../prisma-session.service';

/**
 * TenantInterceptor — sets the `my.tenant` session variable in PostgreSQL
 * before each request, enabling RLS policies to filter by tenant.
 *
 * Requires that `request.tenantId` is set (by JWT middleware/guard).
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(private readonly prismaSession: PrismaSessionService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (tenantId) {
      try {
        await this.prismaSession.setTenant(tenantId);
      } catch (error) {
        this.logger.warn(
          `Failed to set tenant session for ${tenantId}: ${error.message}`,
        );
      }
    }

    return next.handle();
  }
}
