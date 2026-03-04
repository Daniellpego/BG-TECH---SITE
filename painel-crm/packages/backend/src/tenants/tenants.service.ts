import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }

  async create(data: { name: string; domain?: string; plan?: string; settings?: any }) {
    return this.prisma.tenant.create({ data });
  }

  async update(id: string, data: { name?: string; domain?: string; plan?: string; settings?: any }) {
    await this.findById(id);
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.tenant.delete({ where: { id } });
  }

  async getDashboard(tenantId: string) {
    const [
      totalAccounts,
      totalContacts,
      opportunitiesByStage,
      totalPipelineValue,
      activeProjects,
      expiringSlas,
    ] = await Promise.all([
      this.prisma.account.count({ where: { tenantId } }),
      this.prisma.contact.count({ where: { tenantId } }),
      this.prisma.opportunity.groupBy({
        by: ['stage'],
        where: { tenantId },
        _count: { id: true },
        _sum: { value: true },
      }),
      this.prisma.opportunity.aggregate({
        where: { tenantId, stage: { notIn: ['closed_won', 'closed_lost'] } },
        _sum: { value: true },
      }),
      this.prisma.project.count({
        where: { tenantId, status: 'active' },
      }),
      this.prisma.sLA.count({
        where: {
          tenantId,
          status: 'active',
          renewAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      totalAccounts,
      totalContacts,
      opportunitiesByStage: opportunitiesByStage.map((g) => ({
        stage: g.stage,
        count: g._count.id,
        totalValue: g._sum.value ?? 0,
      })),
      totalPipelineValue: totalPipelineValue._sum.value ?? 0,
      activeProjects,
      expiringSlas,
    };
  }
}
