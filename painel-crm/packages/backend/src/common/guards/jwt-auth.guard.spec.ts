import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  function createMockContext(user?: any, tenantId?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, tenantId }),
      }),
    } as any;
  }

  it('should allow request with valid user and tenantId', () => {
    const context = createMockContext(
      { id: 'user-1', email: 'test@test.com', tenantId: 'tenant-1', role: 'admin' },
      'tenant-1',
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject request without user', () => {
    const context = createMockContext(undefined, 'tenant-1');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject request without tenantId', () => {
    const context = createMockContext(
      { id: 'user-1', email: 'test@test.com' },
      undefined,
    );
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject request with no auth at all', () => {
    const context = createMockContext(undefined, undefined);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
