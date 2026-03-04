import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LLM Budget Middleware
 *
 * Reads tenant monthly budget from env / config and blocks requests
 * once the budget has been exceeded. In production this would query
 * a usage table; here we use a simple in-memory counter per tenant
 * and fall back to the LLM_MONTHLY_BUDGET_USD env variable.
 */

const DEFAULT_MONTHLY_BUDGET_USD = 50; // conservative default

/** In-memory spend tracker (per process). Production: use Redis or DB. */
const tenantSpend = new Map<string, number>();

export function getTenantSpend(tenantId: string): number {
  return tenantSpend.get(tenantId) ?? 0;
}

export function addTenantSpend(tenantId: string, amountUsd: number): number {
  const current = getTenantSpend(tenantId);
  const next = current + amountUsd;
  tenantSpend.set(tenantId, next);
  return next;
}

export function resetTenantSpend(tenantId: string): void {
  tenantSpend.delete(tenantId);
}

@Injectable()
export class BudgetMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BudgetMiddleware.name);
  private readonly budgetUsd: number;

  constructor() {
    this.budgetUsd = parseFloat(process.env.LLM_MONTHLY_BUDGET_USD ?? '') || DEFAULT_MONTHLY_BUDGET_USD;
  }

  use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) {
      return next(); // no tenant context — skip budget check
    }

    const currentSpend = getTenantSpend(tenantId);
    if (currentSpend >= this.budgetUsd) {
      this.logger.warn(
        `Tenant ${tenantId} exceeded LLM budget: $${currentSpend.toFixed(2)} / $${this.budgetUsd}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'LLM budget exceeded',
          message: `Monthly LLM budget of $${this.budgetUsd} has been reached. Current spend: $${currentSpend.toFixed(2)}.`,
          currentSpendUsd: +currentSpend.toFixed(4),
          budgetUsd: this.budgetUsd,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return next();
  }
}
