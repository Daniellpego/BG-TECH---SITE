import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

const STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, params?: { stage?: string; accountId?: string }) {
    return this.prisma.opportunity.findMany({
      where: {
        tenantId,
        ...(params?.stage && { stage: params.stage }),
        ...(params?.accountId && { accountId: params.accountId }),
      },
      include: { account: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id, tenantId },
      include: { account: true, proposals: true },
    });
    if (!opp) throw new NotFoundException(`Opportunity ${id} not found`);
    return opp;
  }

  async create(tenantId: string, data: {
    accountId: string;
    title: string;
    description?: string;
    value?: number;
    stage?: string;
    probability?: number;
    expectedCloseDate?: string;
    source?: string;
    technicalEstimate?: any;
    qualificationData?: any;
  }) {
    return this.prisma.opportunity.create({
      data: {
        tenantId,
        accountId: data.accountId,
        title: data.title,
        description: data.description,
        value: data.value ?? 0,
        stage: data.stage ?? 'lead',
        probability: data.probability ?? 0,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        source: data.source,
        technicalEstimate: data.technicalEstimate,
        qualificationData: data.qualificationData,
      },
    });
  }

  async update(tenantId: string, id: string, data: {
    title?: string;
    description?: string;
    value?: number;
    probability?: number;
    expectedCloseDate?: string;
    source?: string;
    technicalEstimate?: any;
    qualificationData?: any;
    lostReason?: string;
  }) {
    await this.findById(tenantId, id);
    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.opportunity.delete({ where: { id } });
  }

  async transitionStage(tenantId: string, id: string, newStage: string, lostReason?: string) {
    const opp = await this.findById(tenantId, id);

    if (!STAGE_ORDER.includes(newStage)) {
      throw new BadRequestException(`Invalid stage: ${newStage}. Valid stages: ${STAGE_ORDER.join(', ')}`);
    }

    if (opp.stage === 'closed_won' || opp.stage === 'closed_lost') {
      throw new BadRequestException('Cannot transition from a closed stage');
    }

    const updateData: any = { stage: newStage };

    if (newStage === 'closed_lost' && lostReason) {
      updateData.lostReason = lostReason;
    }

    // Auto-set probability based on stage
    const probabilityMap: Record<string, number> = {
      lead: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0,
    };
    updateData.probability = probabilityMap[newStage] ?? opp.probability;

    return this.prisma.opportunity.update({ where: { id }, data: updateData });
  }
}
