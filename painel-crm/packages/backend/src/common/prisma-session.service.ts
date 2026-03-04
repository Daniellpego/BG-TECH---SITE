import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Sets the `my.tenant` session variable on the current PostgreSQL connection.
 * This is used by RLS policies to filter rows to the current tenant.
 *
 * Must be called at the start of each request (via TenantInterceptor).
 */
@Injectable()
export class PrismaSessionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Set the tenant context for the current database session/transaction.
   * Uses set_config('my.tenant', tenantId, true) where true = local to transaction.
   */
  async setTenant(tenantId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `SELECT set_config('my.tenant', $1, true)`,
      tenantId,
    );
  }
}
