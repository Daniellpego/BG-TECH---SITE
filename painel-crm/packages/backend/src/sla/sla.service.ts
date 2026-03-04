import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SlaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, params?: { status?: string; accountId?: string }) {
    return this.prisma.sLA.findMany({
      where: {
        tenantId,
        ...(params?.status && { status: params.status }),
        ...(params?.accountId && { accountId: params.accountId }),
      },
      include: { account: { select: { id: true, name: true } } },
      orderBy: { renewAt: 'asc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const sla = await this.prisma.sLA.findFirst({
      where: { id, tenantId },
      include: { account: true },
    });
    if (!sla) throw new NotFoundException(`SLA ${id} not found`);
    return sla;
  }

  async create(tenantId: string, data: {
    accountId: string;
    description: string;
    tier?: number;
    metrics?: any;
    startDate?: string;
    renewAt: string;
    status?: string;
  }) {
    return this.prisma.sLA.create({
      data: {
        tenantId,
        accountId: data.accountId,
        description: data.description,
        tier: data.tier ?? 1,
        metrics: data.metrics,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        renewAt: new Date(data.renewAt),
        status: data.status ?? 'active',
      },
    });
  }

  async update(tenantId: string, id: string, data: {
    description?: string;
    tier?: number;
    metrics?: any;
    startDate?: string;
    renewAt?: string;
    status?: string;
  }) {
    await this.findById(tenantId, id);
    return this.prisma.sLA.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        renewAt: data.renewAt ? new Date(data.renewAt) : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.sLA.delete({ where: { id } });
  }
}
