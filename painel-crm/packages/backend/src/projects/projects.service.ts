import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, params?: { status?: string; accountId?: string }) {
    return this.prisma.project.findMany({
      where: {
        tenantId,
        ...(params?.status && { status: params.status }),
        ...(params?.accountId && { accountId: params.accountId }),
      },
      include: { account: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      include: { account: true },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(tenantId: string, data: {
    accountId: string;
    name: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    milestones?: any;
    marginEst?: number;
    budgetHours?: number;
    meta?: any;
  }) {
    return this.prisma.project.create({
      data: {
        tenantId,
        accountId: data.accountId,
        name: data.name,
        status: data.status ?? 'planning',
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        milestones: data.milestones,
        marginEst: data.marginEst,
        budgetHours: data.budgetHours,
        meta: data.meta,
      },
    });
  }

  async update(tenantId: string, id: string, data: {
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
  }) {
    await this.findById(tenantId, id);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.project.delete({ where: { id } });
  }
}
