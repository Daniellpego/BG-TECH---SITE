import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get all KPIs: Pipeline Velocity, Stage Duration, Resource Utilization, Margin Variance, LTV, Net Churn Rate' })
  @ApiResponse({ status: 200, description: 'Aggregated KPI data' })
  getKpis(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getKpis(tenantId);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get pipeline overview: opportunities by stage with counts and values' })
  @ApiResponse({ status: 200, description: 'Pipeline analysis data' })
  getPipeline(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getPipelineOverview(tenantId);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue overview: monthly closed-won breakdown for last 12 months' })
  @ApiResponse({ status: 200, description: 'Revenue analysis data' })
  getRevenue(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getRevenueOverview(tenantId);
  }
}
