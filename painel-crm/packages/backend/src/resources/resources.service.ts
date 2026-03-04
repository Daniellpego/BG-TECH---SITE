import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.resource.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { id, tenantId },
    });
    if (!resource) throw new NotFoundException(`Resource ${id} not found`);
    return resource;
  }

  async create(tenantId: string, data: {
    name: string;
    title: string;
    email?: string;
    costPerHour: number;
    billableRate?: number;
    skills?: any;
    availability?: any;
  }) {
    return this.prisma.resource.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: {
    name?: string;
    title?: string;
    email?: string;
    costPerHour?: number;
    billableRate?: number;
    skills?: any;
    availability?: any;
  }) {
    await this.findById(tenantId, id);
    return this.prisma.resource.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.resource.delete({ where: { id } });
  }
}
