import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ProposalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, params?: { status?: string; opportunityId?: string; accountId?: string }) {
    return this.prisma.proposal.findMany({
      where: {
        tenantId,
        ...(params?.status && { status: params.status }),
        ...(params?.opportunityId && { opportunityId: params.opportunityId }),
        ...(params?.accountId && { accountId: params.accountId }),
      },
      include: {
        account: { select: { id: true, name: true } },
        opportunity: { select: { id: true, title: true, stage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, tenantId },
      include: { account: true, opportunity: true, contracts: true },
    });
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);
    return proposal;
  }

  async create(tenantId: string, data: {
    accountId: string;
    opportunityId: string;
    title: string;
    version?: number;
    status?: string;
    contentMarkdown?: string;
    contentHtml?: string;
    estimatedValue?: number;
    effortBreakdown?: any;
    riskAssessment?: any;
    validUntil?: string;
    verificationLog?: any;
  }) {
    return this.prisma.proposal.create({
      data: {
        tenantId,
        accountId: data.accountId,
        opportunityId: data.opportunityId,
        title: data.title,
        version: data.version ?? 1,
        status: data.status ?? 'draft',
        contentMarkdown: data.contentMarkdown,
        contentHtml: data.contentHtml,
        estimatedValue: data.estimatedValue,
        effortBreakdown: data.effortBreakdown,
        riskAssessment: data.riskAssessment,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        verificationLog: data.verificationLog,
      },
    });
  }

  async update(tenantId: string, id: string, data: {
    title?: string;
    version?: number;
    status?: string;
    contentMarkdown?: string;
    contentHtml?: string;
    estimatedValue?: number;
    effortBreakdown?: any;
    riskAssessment?: any;
    validUntil?: string;
    verificationLog?: any;
  }) {
    await this.findById(tenantId, id);
    return this.prisma.proposal.update({
      where: { id },
      data: {
        ...data,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.proposal.delete({ where: { id } });
  }
}
