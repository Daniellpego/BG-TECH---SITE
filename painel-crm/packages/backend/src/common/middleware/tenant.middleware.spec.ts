import { TenantMiddleware } from './tenant.middleware';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  const secret = 'dev-secret-change-me';

  beforeEach(() => {
    middleware = new TenantMiddleware();
    process.env.JWT_SECRET = secret;
  });

  it('should extract tenantId from valid JWT', () => {
    const token = jwt.sign(
      { sub: 'user-1', email: 'test@test.com', tenantId: 'tenant-001', role: 'admin' },
      secret,
    );

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as any as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.tenantId).toBe('tenant-001');
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe('user-1');
    expect(req.user!.tenantId).toBe('tenant-001');
    expect(next).toHaveBeenCalled();
  });

  it('should proceed without setting user for missing auth header', () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.tenantId).toBeUndefined();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should proceed without setting user for invalid token', () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token-data' },
    } as any as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.tenantId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should ensure tenant isolation — different tenants get different IDs', () => {
    const token1 = jwt.sign({ sub: 'u1', email: 'a@a.com', tenantId: 'tenant-001', role: 'admin' }, secret);
    const token2 = jwt.sign({ sub: 'u2', email: 'b@b.com', tenantId: 'tenant-002', role: 'admin' }, secret);

    const req1 = { headers: { authorization: `Bearer ${token1}` } } as any;
    const req2 = { headers: { authorization: `Bearer ${token2}` } } as any;
    const next = jest.fn();

    middleware.use(req1, {} as Response, next);
    middleware.use(req2, {} as Response, next);

    expect(req1.tenantId).toBe('tenant-001');
    expect(req2.tenantId).toBe('tenant-002');
    expect(req1.tenantId).not.toBe(req2.tenantId);
  });
});
