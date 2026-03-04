import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { ProposalsService } from './proposals.service';

@ApiTags('proposals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all proposals for current tenant' })
  @ApiResponse({ status: 200, description: 'List of proposals' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'opportunityId', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('opportunityId') opportunityId?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.proposalsService.findAll(tenantId, { status, opportunityId, accountId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal by ID' })
  @ApiResponse({ status: 200, description: 'Proposal details with relations' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.proposalsService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new proposal' })
  @ApiResponse({ status: 201, description: 'Proposal created' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      accountId: string;
      opportunityId: string;
      title: string;
      version?: number;
      status?: string;
      contentMarkdown?: string;
      contentHtml?: string;
      estimatedValue?: number;
      effortBreakdown?: any;
      riskAssessment?: any;
      validUntil?: string;
      verificationLog?: any;
    },
  ) {
    return this.proposalsService.create(tenantId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a proposal' })
  @ApiResponse({ status: 200, description: 'Proposal updated' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      version?: number;
      status?: string;
      contentMarkdown?: string;
      contentHtml?: string;
      estimatedValue?: number;
      effortBreakdown?: any;
      riskAssessment?: any;
      validUntil?: string;
      verificationLog?: any;
    },
  ) {
    return this.proposalsService.update(tenantId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a proposal' })
  @ApiResponse({ status: 200, description: 'Proposal deleted' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.proposalsService.remove(tenantId, id);
  }
}
