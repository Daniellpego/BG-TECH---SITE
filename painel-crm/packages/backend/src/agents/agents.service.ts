import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LlmAdapter } from './adapters/llm.interface';
import { createLlmAdapter } from './adapters/llm.factory';
import { AGENT_PROMPTS } from './prompts';

export interface AgentRunResult {
  agentName: string;
  status: 'success' | 'error';
  output: any;
  tokensUsed: number;
  latencyMs: number;
  model: string;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private llm: LlmAdapter;

  constructor(private prisma: PrismaService) {
    this.llm = createLlmAdapter();
    this.logger.log(`LLM adapter initialized: ${this.llm.name}`);
  }

  // ─── Qualification Agent ────────────────────────────
  async runQualification(
    tenantId: string,
    opportunityId: string,
    context: string,
  ): Promise<AgentRunResult> {
    const prompt = AGENT_PROMPTS.qualification;
    const userMessage = prompt.userTemplate(context);

    try {
      const response = await this.llm.chat(prompt.system, userMessage, {
        responseFormat: 'json',
        temperature: 0.2,
      });

      const output = JSON.parse(response.content);

      // Atualizar opportunity com dados de qualificação
      await this.prisma.opportunity.update({
        where: { id: opportunityId },
        data: {
          qualificationData: output,
          stage: output.recommended_stage === 'disqualified' ? 'closed_lost' : 'qualified',
          probability: output.qualification_score || 50,
        },
      });

      // Log
      await this.logAgent(tenantId, opportunityId, 'qualification', 'qualify_lead', { context }, output, response);

      return {
        agentName: 'qualification',
        status: 'success',
        output,
        tokensUsed: response.tokensUsed,
        latencyMs: response.latencyMs,
        model: response.model,
      };
    } catch (error) {
      await this.logAgentError(tenantId, opportunityId, 'qualification', 'qualify_lead', error);
      throw error;
    }
  }

  // ─── Proposal Agent ────────────────────────────
  async runProposal(
    tenantId: string,
    opportunityId: string,
  ): Promise<AgentRunResult> {
    const opportunity = await this.prisma.opportunity.findFirstOrThrow({
      where: { id: opportunityId, tenantId },
      include: { account: true },
    });

    const prompt = AGENT_PROMPTS.proposal;
    const userMessage = prompt.userTemplate(
      JSON.stringify(opportunity.qualificationData || {}, null, 2),
      JSON.stringify({ name: opportunity.account.name, industry: opportunity.account.industry }, null, 2),
    );

    try {
      const response = await this.llm.chat(prompt.system, userMessage, {
        temperature: 0.4,
        maxTokens: 8192,
      });

      // Criar proposta no banco
      const proposal = await this.prisma.proposal.create({
        data: {
          tenantId,
          accountId: opportunity.accountId,
          opportunityId,
          title: `Proposta — ${opportunity.title}`,
          status: 'draft',
          contentMarkdown: response.content,
          estimatedValue: opportunity.value,
          effortBreakdown: {},
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Atualizar estágio da oportunidade
      await this.prisma.opportunity.update({
        where: { id: opportunityId },
        data: { stage: 'proposal' },
      });

      await this.logAgent(tenantId, opportunityId, 'proposal', 'generate_proposal', {}, { proposalId: proposal.id, markdown: response.content }, response);

      return {
        agentName: 'proposal',
        status: 'success',
        output: { proposalId: proposal.id, markdown: response.content },
        tokensUsed: response.tokensUsed,
        latencyMs: response.latencyMs,
        model: response.model,
      };
    } catch (error) {
      await this.logAgentError(tenantId, opportunityId, 'proposal', 'generate_proposal', error);
      throw error;
    }
  }

  // ─── Risk Agent ────────────────────────────
  async runRisk(
    tenantId: string,
    opportunityId: string,
  ): Promise<AgentRunResult> {
    const opportunity = await this.prisma.opportunity.findFirstOrThrow({
      where: { id: opportunityId, tenantId },
    });

    const proposals = await this.prisma.proposal.findMany({
      where: { opportunityId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const resources = await this.prisma.resource.findMany({
      where: { tenantId },
    });

    const slas = await this.prisma.sLA.findMany({
      where: { accountId: opportunity.accountId, tenantId },
    });

    const prompt = AGENT_PROMPTS.risk;
    const userMessage = prompt.userTemplate(
      JSON.stringify(proposals[0] || {}, null, 2),
      JSON.stringify(resources.map((r) => ({ name: r.name, costPerHour: r.costPerHour })), null, 2),
      JSON.stringify(slas.map((s) => ({ tier: s.tier, metrics: s.metrics })), null, 2),
    );

    try {
      const response = await this.llm.chat(prompt.system, userMessage, {
        responseFormat: 'json',
        temperature: 0.2,
      });

      const output = JSON.parse(response.content);

      // Armazenar risk assessment na proposta
      if (proposals[0]) {
        await this.prisma.proposal.update({
          where: { id: proposals[0].id },
          data: { riskAssessment: output },
        });
      }

      await this.logAgent(tenantId, opportunityId, 'risk', 'assess_risk', {}, output, response);

      return {
        agentName: 'risk',
        status: 'success',
        output,
        tokensUsed: response.tokensUsed,
        latencyMs: response.latencyMs,
        model: response.model,
      };
    } catch (error) {
      await this.logAgentError(tenantId, opportunityId, 'risk', 'assess_risk', error);
      throw error;
    }
  }

  // ─── Churn Agent ────────────────────────────
  async runChurn(tenantId: string, accountId: string): Promise<AgentRunResult> {
    const account = await this.prisma.account.findFirstOrThrow({
      where: { id: accountId, tenantId },
    });

    const slas = await this.prisma.sLA.findMany({
      where: { accountId, tenantId },
    });

    const projects = await this.prisma.project.findMany({
      where: { accountId, tenantId },
    });

    const prompt = AGENT_PROMPTS.churn;
    const userMessage = prompt.userTemplate(
      JSON.stringify({ ...account, slas }, null, 2),
      JSON.stringify({ projects: projects.length, activeSlas: slas.length }, null, 2),
    );

    try {
      const response = await this.llm.chat(prompt.system, userMessage, {
        responseFormat: 'json',
        temperature: 0.3,
      });

      const output = JSON.parse(response.content);
      await this.logAgent(tenantId, null, 'churn', 'assess_churn', { accountId }, output, response);

      return {
        agentName: 'churn',
        status: 'success',
        output,
        tokensUsed: response.tokensUsed,
        latencyMs: response.latencyMs,
        model: response.model,
      };
    } catch (error) {
      await this.logAgentError(tenantId, null, 'churn', 'assess_churn', error);
      throw error;
    }
  }

  // ─── Negotiation Agent ────────────────────────────
  async runNegotiation(
    tenantId: string,
    opportunityId: string,
    counterpartyPosition: string,
  ): Promise<AgentRunResult> {
    const opportunity = await this.prisma.opportunity.findFirstOrThrow({
      where: { id: opportunityId, tenantId },
    });

    const proposals = await this.prisma.proposal.findMany({
      where: { opportunityId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const prompt = AGENT_PROMPTS.negotiation;
    const userMessage = prompt.userTemplate(
      JSON.stringify({ value: opportunity.value, proposal: proposals[0]?.title }, null, 2),
      counterpartyPosition,
    );

    try {
      const response = await this.llm.chat(prompt.system, userMessage, {
        responseFormat: 'json',
        temperature: 0.3,
      });

      const output = JSON.parse(response.content);
      await this.logAgent(tenantId, opportunityId, 'negotiation', 'negotiate', {}, output, response);

      return {
        agentName: 'negotiation',
        status: 'success',
        output,
        tokensUsed: response.tokensUsed,
        latencyMs: response.latencyMs,
        model: response.model,
      };
    } catch (error) {
      await this.logAgentError(tenantId, opportunityId, 'negotiation', 'negotiate', error);
      throw error;
    }
  }

  // ─── Full Pipeline: Lead → Qualification → Proposal ────────────────────────────
  async runLeadToProposal(
    tenantId: string,
    leadData: { accountId: string; title: string; description: string; value: number; source?: string; context: string },
  ): Promise<{ opportunity: any; qualification: AgentRunResult; proposal: AgentRunResult; risk: AgentRunResult }> {
    // 1. Criar oportunidade como lead
    const opportunity = await this.prisma.opportunity.create({
      data: {
        tenantId,
        accountId: leadData.accountId,
        title: leadData.title,
        description: leadData.description,
        value: leadData.value,
        stage: 'lead',
        probability: 10,
        source: leadData.source || 'inbound',
      },
    });

    // 2. Qualification
    const qualification = await this.runQualification(tenantId, opportunity.id, leadData.context);

    // 3. Proposal
    const proposal = await this.runProposal(tenantId, opportunity.id);

    // 4. Risk
    const risk = await this.runRisk(tenantId, opportunity.id);

    return { opportunity, qualification, proposal, risk };
  }

  // ─── Helpers ────────────────────────────
  private async logAgent(
    tenantId: string,
    opportunityId: string | null,
    agentName: string,
    action: string,
    input: any,
    output: any,
    response: { tokensUsed: number; latencyMs: number },
  ) {
    await this.prisma.agentLog.create({
      data: {
        tenantId,
        opportunityId,
        agentName,
        action,
        input,
        output,
        tokensUsed: response.tokensUsed,
        latencyMs: response.latencyMs,
        status: 'success',
      },
    });
  }

  private async logAgentError(
    tenantId: string,
    opportunityId: string | null,
    agentName: string,
    action: string,
    error: any,
  ) {
    await this.prisma.agentLog.create({
      data: {
        tenantId,
        opportunityId,
        agentName,
        action,
        status: 'error',
        errorMessage: error?.message || 'Unknown error',
      },
    });
  }
}
