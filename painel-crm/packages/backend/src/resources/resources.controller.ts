import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { ResourcesService } from './resources.service';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List all resources for current tenant' })
  @ApiResponse({ status: 200, description: 'List of resources' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.resourcesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiResponse({ status: 200, description: 'Resource details' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.resourcesService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({ status: 201, description: 'Resource created' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      name: string;
      title: string;
      email?: string;
      costPerHour: number;
      billableRate?: number;
      skills?: any;
      availability?: any;
    },
  ) {
    return this.resourcesService.create(tenantId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a resource' })
  @ApiResponse({ status: 200, description: 'Resource updated' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      title?: string;
      email?: string;
      costPerHour?: number;
      billableRate?: number;
      skills?: any;
      availability?: any;
    },
  ) {
    return this.resourcesService.update(tenantId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resource' })
  @ApiResponse({ status: 200, description: 'Resource deleted' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.resourcesService.remove(tenantId, id);
  }
}
