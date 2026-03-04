import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects for current tenant' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.projectsService.findAll(tenantId, { status, accountId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.projectsService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      accountId: string;
      name: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      milestones?: any;
      marginEst?: number;
      budgetHours?: number;
      meta?: any;
    },
  ) {
    return this.projectsService.create(tenantId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      milestones?: any;
      marginEst?: number;
      marginReal?: number;
      budgetHours?: number;
      actualHours?: number;
      meta?: any;
    },
  ) {
    return this.projectsService.update(tenantId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.projectsService.remove(tenantId, id);
  }
}
