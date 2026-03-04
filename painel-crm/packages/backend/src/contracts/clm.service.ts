import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AgentsService } from '../agents/agents.service';
import { verifyProposal, verifyContract, VerificationResult } from './rule-engine';

@Injectable()
export class ClmService {
  private readonly logger = new Logger(ClmService.name);

  constructor(
    private prisma: PrismaService,
    private agentsService: AgentsService,
  ) {}

  /**
   * Fluxo completo CLM: Gera proposta via LLM → Verifica com rule engine → Cria draft
   */
  async generateProposalDraft(
    tenantId: string,
    opportunityId: string,
  ): Promise<{
    proposal: any;
    verification: VerificationResult;
    status: 'approved' | 'needs_review';
  }> {
    // 1. Gerar proposta via agente
    const agentResult = await this.agentsService.runProposal(tenantId, opportunityId);

    // 2. Buscar proposta criada
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: agentResult.output.proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found after generation');
    }

    // 3. Verificar com rule engine
    const verification = verifyProposal({
      estimatedValue: proposal.estimatedValue,
      validUntil: proposal.validUntil,
      effortBreakdown: proposal.effortBreakdown,
      contentMarkdown: proposal.contentMarkdown,
      riskAssessment: proposal.riskAssessment,
    });

    // 4. Atualizar status da proposta
    const newStatus = verification.passed ? 'review' : 'draft';
    await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: newStatus,
        verificationLog: verification as any,
      },
    });

    this.logger.log(
      `CLM: Proposal ${proposal.id} — verification score: ${verification.score}, passed: ${verification.passed}`,
    );

    return {
      proposal: { ...proposal, status: newStatus },
      verification,
      status: verification.passed ? 'approved' : 'needs_review',
    };
  }

  /**
   * Gera contrato a partir de proposta aprovada
   */
  async generateContract(
    tenantId: string,
    proposalId: string,
  ): Promise<{
    contract: any;
    verification: VerificationResult;
  }> {
    const proposal = await this.prisma.proposal.findFirstOrThrow({
      where: { id: proposalId, tenantId },
      include: { opportunity: true },
    });

    // Gerar conteúdo do contrato a partir da proposta
    const contractContent = this.generateContractMarkdown(proposal);

    const clauses = [
      { id: 1, title: 'Escopo do Trabalho', status: 'approved' },
      { id: 2, title: 'Cronograma e Milestones', status: 'approved' },
      { id: 3, title: 'Condições de Pagamento', status: 'pending_review' },
      { id: 4, title: 'Propriedade Intelectual', status: 'pending_review' },
      { id: 5, title: 'Confidencialidade (NDA)', status: 'approved' },
      { id: 6, title: 'SLA e Suporte', status: 'pending_review' },
      { id: 7, title: 'Rescisão e Penalidades', status: 'pending_review' },
    ];

    const contract = await this.prisma.contract.create({
      data: {
        tenantId,
        accountId: proposal.accountId,
        proposalId: proposal.id,
        title: `Contrato — ${proposal.title}`,
        status: 'draft',
        contentMarkdown: contractContent,
        clauses: clauses as any,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Verificar contrato
    const verification = verifyContract({
      title: contract.title,
      clauses,
      expiresAt: contract.expiresAt,
      proposalValue: proposal.estimatedValue,
      status: contract.status,
    });

    return { contract, verification };
  }

  /**
   * Verificação standalone de proposta existente
   */
  async verifyExistingProposal(tenantId: string, proposalId: string): Promise<VerificationResult> {
    const proposal = await this.prisma.proposal.findFirstOrThrow({
      where: { id: proposalId, tenantId },
    });

    return verifyProposal({
      estimatedValue: proposal.estimatedValue,
      validUntil: proposal.validUntil,
      effortBreakdown: proposal.effortBreakdown,
      contentMarkdown: proposal.contentMarkdown,
      riskAssessment: proposal.riskAssessment,
    });
  }

  private generateContractMarkdown(proposal: any): string {
    return `# Contrato de Prestação de Serviços

## ${proposal.title}

**Data:** ${new Date().toLocaleDateString('pt-BR')}
**Proposta de referência:** ${proposal.id}

---

## 1. ESCOPO DO TRABALHO

Conforme descrito na proposta técnica ref. ${proposal.id}, o escopo compreende:

${proposal.contentMarkdown ? proposal.contentMarkdown.substring(0, 500) + '...' : 'Vide proposta técnica anexa.'}

## 2. CRONOGRAMA

O projeto será executado conforme milestones definidos na proposta técnica.

## 3. INVESTIMENTO

Valor total: R$ ${(proposal.estimatedValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Pagamento vinculado a milestones conforme cronograma.

## 4. PROPRIEDADE INTELECTUAL

Todo código-fonte e documentação desenvolvidos serão de propriedade do CONTRATANTE após pagamento integral.

## 5. CONFIDENCIALIDADE

As partes concordam em manter sigilo sobre informações confidenciais trocadas durante a execução do projeto.

## 6. SLA E SUPORTE

Suporte pós-entrega conforme SLA contratado separadamente.

## 7. RESCISÃO

Qualquer parte pode rescindir com 30 dias de aviso prévio, mediante pagamento proporcional ao trabalho executado.

---

**CONTRATANTE:** ___________________________

**CONTRATADA (BG Tech):** ___________________________

**Data de Assinatura:** ___/___/______
`;
  }
}
