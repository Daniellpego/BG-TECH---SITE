import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, params?: { status?: string; accountId?: string; proposalId?: string }) {
    return this.prisma.contract.findMany({
      where: {
        tenantId,
        ...(params?.status && { status: params.status }),
        ...(params?.accountId && { accountId: params.accountId }),
        ...(params?.proposalId && { proposalId: params.proposalId }),
      },
      include: {
        account: { select: { id: true, name: true } },
        proposal: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, tenantId },
      include: { account: true, proposal: true },
    });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    return contract;
  }

  async create(tenantId: string, data: {
    accountId: string;
    proposalId?: string;
    title: string;
    status?: string;
    contentMarkdown?: string;
    clauses?: any;
    signedAt?: string;
    expiresAt?: string;
    signatureData?: any;
    meta?: any;
  }) {
    return this.prisma.contract.create({
      data: {
        tenantId,
        accountId: data.accountId,
        proposalId: data.proposalId,
        title: data.title,
        status: data.status ?? 'draft',
        contentMarkdown: data.contentMarkdown,
        clauses: data.clauses,
        signedAt: data.signedAt ? new Date(data.signedAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        signatureData: data.signatureData,
        meta: data.meta,
      },
    });
  }

  async update(tenantId: string, id: string, data: {
    title?: string;
    status?: string;
    contentMarkdown?: string;
    clauses?: any;
    signedAt?: string;
    expiresAt?: string;
    signatureData?: any;
    meta?: any;
  }) {
    await this.findById(tenantId, id);
    return this.prisma.contract.update({
      where: { id },
      data: {
        ...data,
        signedAt: data.signedAt ? new Date(data.signedAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.contract.delete({ where: { id } });
  }
}
