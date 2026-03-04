import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pipeline Velocity: opportunities closed_won in last 30 days * avg value / 30
   */
  async getPipelineVelocity(tenantId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const closedWon = await this.prisma.opportunity.findMany({
      where: {
        tenantId,
        stage: 'closed_won',
        updatedAt: { gte: thirtyDaysAgo },
      },
      select: { value: true },
    });

    const count = closedWon.length;
    const totalValue = closedWon.reduce((sum, o) => sum + (o.value ?? 0), 0);
    const avgValue = count > 0 ? totalValue / count : 0;
    const velocity = (count * avgValue) / 30;

    return { count, totalValue, avgValue, velocityPerDay: velocity };
  }

  /**
   * Stage Duration: average days opportunities spend in each stage
   */
  async getStageDuration(tenantId: string) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: { tenantId },
      select: { stage: true, createdAt: true, updatedAt: true },
    });

    const stageMap: Record<string, { totalDays: number; count: number }> = {};
    for (const opp of opportunities) {
      const days = (opp.updatedAt.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (!stageMap[opp.stage]) stageMap[opp.stage] = { totalDays: 0, count: 0 };
      stageMap[opp.stage].totalDays += days;
      stageMap[opp.stage].count += 1;
    }

    return Object.entries(stageMap).map(([stage, data]) => ({
      stage,
      avgDays: data.count > 0 ? Math.round((data.totalDays / data.count) * 100) / 100 : 0,
      count: data.count,
    }));
  }

  /**
   * Resource Utilization: (actual_hours / budget_hours) across active projects
   */
  async getResourceUtilization(tenantId: string) {
    const activeProjects = await this.prisma.project.findMany({
      where: { tenantId, status: 'active' },
      select: { id: true, name: true, budgetHours: true, actualHours: true },
    });

    const totalBudget = activeProjects.reduce((sum, p) => sum + (p.budgetHours ?? 0), 0);
    const totalActual = activeProjects.reduce((sum, p) => sum + (p.actualHours ?? 0), 0);
    const utilization = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return {
      totalBudgetHours: totalBudget,
      totalActualHours: totalActual,
      utilizationPercent: Math.round(utilization * 100) / 100,
      projects: activeProjects.map((p) => ({
        id: p.id,
        name: p.name,
        budgetHours: p.budgetHours ?? 0,
        actualHours: p.actualHours ?? 0,
        utilizationPercent:
          p.budgetHours && p.budgetHours > 0
            ? Math.round(((p.actualHours ?? 0) / p.budgetHours) * 10000) / 100
            : 0,
      })),
    };
  }

  /**
   * Project Margin Variance: (marginEst - marginReal) for completed projects
   */
  async getProjectMarginVariance(tenantId: string) {
    const completedProjects = await this.prisma.project.findMany({
      where: { tenantId, status: 'completed' },
      select: { id: true, name: true, marginEst: true, marginReal: true },
    });

    return completedProjects.map((p) => ({
      id: p.id,
      name: p.name,
      marginEst: p.marginEst ?? 0,
      marginReal: p.marginReal ?? 0,
      variance: (p.marginReal ?? 0) - (p.marginEst ?? 0),
    }));
  }

  /**
   * LTV: avg revenue per account * avg account lifespan (in months)
   */
  async getLTV(tenantId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { tenantId },
      select: { id: true, annualRevenue: true, createdAt: true },
    });

    if (accounts.length === 0) {
      return { avgRevenue: 0, avgLifespanMonths: 0, ltv: 0, accountCount: 0 };
    }

    const now = new Date();
    const totalRevenue = accounts.reduce((sum, a) => sum + (a.annualRevenue ?? 0), 0);
    const avgRevenue = totalRevenue / accounts.length;

    const totalLifespanMonths = accounts.reduce((sum, a) => {
      const months = (now.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return sum + months;
    }, 0);
    const avgLifespanMonths = totalLifespanMonths / accounts.length;

    // LTV = avg annual revenue * avg lifespan in years
    const ltv = avgRevenue * (avgLifespanMonths / 12);

    return {
      avgRevenue: Math.round(avgRevenue * 100) / 100,
      avgLifespanMonths: Math.round(avgLifespanMonths * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
      accountCount: accounts.length,
    };
  }

  /**
   * Net Churn Rate: lost accounts / total accounts in period (last 12 months)
   */
  async getNetChurnRate(tenantId: string) {
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const [totalAccounts, lostOpportunities] = await Promise.all([
      this.prisma.account.count({
        where: { tenantId, createdAt: { lte: new Date() } },
      }),
      // Accounts that had all opportunities closed_lost in the period
      this.prisma.opportunity.groupBy({
        by: ['accountId'],
        where: {
          tenantId,
          stage: 'closed_lost',
          updatedAt: { gte: twelveMonthsAgo },
        },
        _count: { id: true },
      }),
    ]);

    const lostAccountCount = lostOpportunities.length;
    const churnRate = totalAccounts > 0 ? (lostAccountCount / totalAccounts) * 100 : 0;

    return {
      totalAccounts,
      lostAccountCount,
      churnRatePercent: Math.round(churnRate * 100) / 100,
      period: '12_months',
    };
  }

  /**
   * Aggregated KPIs endpoint
   */
  async getKpis(tenantId: string) {
    const [pipelineVelocity, stageDuration, resourceUtilization, marginVariance, ltv, churnRate] =
      await Promise.all([
        this.getPipelineVelocity(tenantId),
        this.getStageDuration(tenantId),
        this.getResourceUtilization(tenantId),
        this.getProjectMarginVariance(tenantId),
        this.getLTV(tenantId),
        this.getNetChurnRate(tenantId),
      ]);

    return {
      pipelineVelocity,
      stageDuration,
      resourceUtilization,
      marginVariance,
      ltv,
      churnRate,
    };
  }

  /**
   * Pipeline overview: opportunities grouped by stage with totals
   */
  async getPipelineOverview(tenantId: string) {
    const [byStage, totalPipeline] = await Promise.all([
      this.prisma.opportunity.groupBy({
        by: ['stage'],
        where: { tenantId },
        _count: { id: true },
        _sum: { value: true },
        _avg: { probability: true },
      }),
      this.prisma.opportunity.aggregate({
        where: { tenantId, stage: { notIn: ['closed_won', 'closed_lost'] } },
        _sum: { value: true },
        _count: { id: true },
      }),
    ]);

    return {
      stages: byStage.map((s) => ({
        stage: s.stage,
        count: s._count.id,
        totalValue: s._sum.value ?? 0,
        avgProbability: Math.round((s._avg.probability ?? 0) * 100) / 100,
      })),
      activePipeline: {
        count: totalPipeline._count.id,
        totalValue: totalPipeline._sum.value ?? 0,
      },
    };
  }

  /**
   * Revenue overview: closed_won totals by month
   */
  async getRevenueOverview(tenantId: string) {
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const closedWon = await this.prisma.opportunity.findMany({
      where: {
        tenantId,
        stage: 'closed_won',
        updatedAt: { gte: twelveMonthsAgo },
      },
      select: { value: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    // Group by month
    const monthlyRevenue: Record<string, { month: string; total: number; count: number }> = {};
    for (const opp of closedWon) {
      const key = `${opp.updatedAt.getFullYear()}-${String(opp.updatedAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyRevenue[key]) monthlyRevenue[key] = { month: key, total: 0, count: 0 };
      monthlyRevenue[key].total += opp.value ?? 0;
      monthlyRevenue[key].count += 1;
    }

    const totalRevenue = closedWon.reduce((sum, o) => sum + (o.value ?? 0), 0);

    return {
      totalRevenueLast12Months: totalRevenue,
      totalDealsClosedLast12Months: closedWon.length,
      monthlyBreakdown: Object.values(monthlyRevenue),
    };
  }
}
