import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { AccountsService } from './accounts.service';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounts for current tenant' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  @ApiQuery({ name: 'industry', required: false })
  @ApiQuery({ name: 'size', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('industry') industry?: string,
    @Query('size') size?: string,
  ) {
    return this.accountsService.findAll(tenantId, { industry, size });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account details with relations' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.accountsService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() body: { name: string; industry?: string; website?: string; size?: string; annualRevenue?: number; meta?: any },
  ) {
    return this.accountsService.create(tenantId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an account' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; industry?: string; website?: string; size?: string; annualRevenue?: number; meta?: any },
  ) {
    return this.accountsService.update(tenantId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.accountsService.remove(tenantId, id);
  }
}
