import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, params?: { industry?: string; size?: string }) {
    return this.prisma.account.findMany({
      where: {
        tenantId,
        ...(params?.industry && { industry: params.industry }),
        ...(params?.size && { size: params.size }),
      },
      include: { _count: { select: { contacts: true, opportunities: true, projects: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, tenantId },
      include: { contacts: true, opportunities: true, projects: true, slas: true },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async create(tenantId: string, data: {
    name: string;
    industry?: string;
    website?: string;
    size?: string;
    annualRevenue?: number;
    meta?: any;
  }) {
    return this.prisma.account.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: {
    name?: string;
    industry?: string;
    website?: string;
    size?: string;
    annualRevenue?: number;
    meta?: any;
  }) {
    await this.findById(tenantId, id);
    return this.prisma.account.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.account.delete({ where: { id } });
  }
}
