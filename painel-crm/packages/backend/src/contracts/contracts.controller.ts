import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { ContractsService } from './contracts.service';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @ApiOperation({ summary: 'List all contracts for current tenant' })
  @ApiResponse({ status: 200, description: 'List of contracts' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'proposalId', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('accountId') accountId?: string,
    @Query('proposalId') proposalId?: string,
  ) {
    return this.contractsService.findAll(tenantId, { status, accountId, proposalId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiResponse({ status: 200, description: 'Contract details with relations' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.contractsService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({ status: 201, description: 'Contract created' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      accountId: string;
      proposalId?: string;
      title: string;
      status?: string;
      contentMarkdown?: string;
      clauses?: any;
      signedAt?: string;
      expiresAt?: string;
      signatureData?: any;
      meta?: any;
    },
  ) {
    return this.contractsService.create(tenantId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contract' })
  @ApiResponse({ status: 200, description: 'Contract updated' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      status?: string;
      contentMarkdown?: string;
      clauses?: any;
      signedAt?: string;
      expiresAt?: string;
      signatureData?: any;
      meta?: any;
    },
  ) {
    return this.contractsService.update(tenantId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contract' })
  @ApiResponse({ status: 200, description: 'Contract deleted' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.contractsService.remove(tenantId, id);
  }
}
