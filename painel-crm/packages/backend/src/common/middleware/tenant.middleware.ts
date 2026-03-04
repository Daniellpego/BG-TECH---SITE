import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
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
  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(); // let guards handle unauthorized
    }

    try {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
      const decoded = jwt.verify(token, secret) as {
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
    } catch {
      // token invalid — guards will reject
    }

    next();
  }
}
