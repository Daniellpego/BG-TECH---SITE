import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      user?: { id: string; email: string; tenantId: string; role: string };
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(); // let guards handle unauthorized
    }

    try {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET must be set in production');
        }
        // fallback only in dev/test
      }
      const jwtSecret = secret || 'dev-secret-change-me';
      const decoded = jwt.verify(token, jwtSecret) as {
        sub: string;
        email: string;
        tenantId: string;
        role: string;
      };

      req.user = {
        id: decoded.sub,
        email: decoded.email,
        tenantId: decoded.tenantId,
        role: decoded.role,
      };
      req.tenantId = decoded.tenantId;
    } catch (err: any) {
      this.logger.warn(`JWT verification failed: ${err.message}`);
      // token invalid — guards will reject
    }

    next();
  }
}
