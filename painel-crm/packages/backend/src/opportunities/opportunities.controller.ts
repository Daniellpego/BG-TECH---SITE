import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { OpportunitiesService } from './opportunities.service';

@ApiTags('opportunities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all opportunities for current tenant' })
  @ApiResponse({ status: 200, description: 'List of opportunities' })
  @ApiQuery({ name: 'stage', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('stage') stage?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.opportunitiesService.findAll(tenantId, { stage, accountId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get opportunity by ID' })
  @ApiResponse({ status: 200, description: 'Opportunity details with relations' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new opportunity' })
  @ApiResponse({ status: 201, description: 'Opportunity created' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      accountId: string;
      title: string;
      description?: string;
      value?: number;
      stage?: string;
      probability?: number;
      expectedCloseDate?: string;
      source?: string;
      technicalEstimate?: any;
      qualificationData?: any;
    },
  ) {
    return this.opportunitiesService.create(tenantId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an opportunity' })
  @ApiResponse({ status: 200, description: 'Opportunity updated' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      description?: string;
      value?: number;
      probability?: number;
      expectedCloseDate?: string;
      source?: string;
      technicalEstimate?: any;
      qualificationData?: any;
      lostReason?: string;
    },
  ) {
    return this.opportunitiesService.update(tenantId, id, body);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Transition opportunity to a new stage' })
  @ApiResponse({ status: 200, description: 'Stage updated' })
  @ApiResponse({ status: 400, description: 'Invalid stage transition' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  transitionStage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { stage: string; lostReason?: string },
  ) {
    return this.opportunitiesService.transitionStage(tenantId, id, body.stage, body.lostReason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an opportunity' })
  @ApiResponse({ status: 200, description: 'Opportunity deleted' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.remove(tenantId, id);
  }
}
