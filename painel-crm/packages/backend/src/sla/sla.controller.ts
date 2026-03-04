import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { SlaService } from './sla.service';

@ApiTags('sla')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get()
  @ApiOperation({ summary: 'List all SLAs for current tenant' })
  @ApiResponse({ status: 200, description: 'List of SLAs' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.slaService.findAll(tenantId, { status, accountId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get SLA by ID' })
  @ApiResponse({ status: 200, description: 'SLA details' })
  @ApiResponse({ status: 404, description: 'SLA not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.slaService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new SLA' })
  @ApiResponse({ status: 201, description: 'SLA created' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      accountId: string;
      description: string;
      tier?: number;
      metrics?: any;
      startDate?: string;
      renewAt: string;
      status?: string;
    },
  ) {
    return this.slaService.create(tenantId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an SLA' })
  @ApiResponse({ status: 200, description: 'SLA updated' })
  @ApiResponse({ status: 404, description: 'SLA not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      description?: string;
      tier?: number;
      metrics?: any;
      startDate?: string;
      renewAt?: string;
      status?: string;
    },
  ) {
    return this.slaService.update(tenantId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an SLA' })
  @ApiResponse({ status: 200, description: 'SLA deleted' })
  @ApiResponse({ status: 404, description: 'SLA not found' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.slaService.remove(tenantId, id);
  }
}
