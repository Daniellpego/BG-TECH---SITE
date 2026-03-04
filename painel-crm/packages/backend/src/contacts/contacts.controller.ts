import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { ContactsService } from './contacts.service';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List all contacts for current tenant' })
  @ApiResponse({ status: 200, description: 'List of contacts' })
  @ApiQuery({ name: 'accountId', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.contactsService.findAll(tenantId, { accountId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiResponse({ status: 200, description: 'Contact details' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.contactsService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      name: string;
      accountId?: string;
      email?: string;
      phone?: string;
      role?: string;
      department?: string;
      linkedinUrl?: string;
      meta?: any;
    },
  ) {
    return this.contactsService.create(tenantId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({ status: 200, description: 'Contact updated' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      accountId?: string;
      email?: string;
      phone?: string;
      role?: string;
      department?: string;
      linkedinUrl?: string;
      meta?: any;
    },
  ) {
    return this.contactsService.update(tenantId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.contactsService.remove(tenantId, id);
  }
}
