/**
 * Agent Worker Runner — standalone process that consumes agent jobs from BullMQ.
 *
 * Start with: npx ts-node src/agents/agent-worker-runner.ts
 * Or via package.json script: npm run start:worker
 *
 * Environment:
 *   REDIS_URL       — Redis connection string (default: redis://localhost:6379)
 *   DATABASE_URL    — PostgreSQL connection string
 *   LLM_PROVIDER    — mock | openai | anthropic (default: mock)
 *   WORKER_CONCURRENCY — number of concurrent jobs (default: 3)
 */
import { PrismaClient } from '@prisma/client';
import { Job } from 'bullmq';
import { createAgentWorker, AgentJobData, AgentJobResult } from './queue';
import { createLlmAdapter } from './adapters/llm.factory';
import { AGENT_PROMPTS } from './prompts';

const prisma = new PrismaClient();
const llm = createLlmAdapter();

console.log(`🚀 Starting agent worker — LLM adapter: ${llm.name}`);

async function processJob(
  job: Job<AgentJobData>,
): Promise<AgentJobResult> {
  const { tenantId, agentName, action, payload } = job.data;
  const startMs = Date.now();

  console.log(
    `[worker] Processing job ${job.id} — agent=${agentName} action=${action} tenant=${tenantId}`,
  );

  try {
    // Set tenant context for RLS
    await prisma.$executeRawUnsafe(
      `SELECT set_config('my.tenant', $1, true)`,
      tenantId,
    );

    let result: AgentJobResult;

    switch (agentName) {
      case 'qualification':
        result = await runQualification(tenantId, payload);
        break;
      case 'proposal':
        result = await runProposal(tenantId, payload);
        break;
      case 'risk':
        result = await runRisk(tenantId, payload);
        break;
      case 'churn':
        result = await runChurn(tenantId, payload);
        break;
      case 'negotiation':
        result = await runNegotiation(tenantId, payload);
        break;
      case 'lead-to-proposal':
        result = await runLeadToProposal(tenantId, payload);
        break;
      default:
        throw new Error(`Unknown agent: ${agentName}`);
    }

    // Persist AgentLog
    await prisma.agentLog.create({
      data: {
        tenantId,
        opportunityId: payload.opportunityId || null,
        agentName,
        action,
        input: payload,
        output: result.output,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        status: 'success',
      },
    });

    return result;
  } catch (error: any) {
    const latencyMs = Date.now() - startMs;

    // Persist error log
    await prisma.agentLog.create({
      data: {
        tenantId,
        opportunityId: payload.opportunityId || null,
        agentName,
        action,
        input: payload,
        status: 'error',
        errorMessage: error.message || 'Unknown error',
        latencyMs,
      },
    });

    throw error;
  }
}

// ─── Agent Implementations (for worker context) ──────────────────

async function runQualification(
  tenantId: string,
  payload: Record<string, any>,
): Promise<AgentJobResult> {
  const prompt = AGENT_PROMPTS.qualification;
  const userMessage = prompt.userTemplate(payload.context || '');

  const response = await llm.chat(prompt.system, userMessage, {
    responseFormat: 'json',
    temperature: 0.2,
  });

  const output = JSON.parse(response.content);

  if (payload.opportunityId) {
    await prisma.opportunity.update({
      where: { id: payload.opportunityId },
      data: {
        qualificationData: output,
        stage: output.recommended_stage === 'disqualified' ? 'closed_lost' : 'qualified',
        probability: output.qualification_score || 50,
      },
    });
  }

  return {
    agentName: 'qualification',
    status: 'success',
    output,
    tokensUsed: response.tokensUsed,
    latencyMs: response.latencyMs,
    model: response.model,
  };
}

async function runProposal(
  tenantId: string,
  payload: Record<string, any>,
): Promise<AgentJobResult> {
  const opportunity = await prisma.opportunity.findFirstOrThrow({
    where: { id: payload.opportunityId, tenantId },
    include: { account: true },
  });

  const prompt = AGENT_PROMPTS.proposal;
  const userMessage = prompt.userTemplate(
    JSON.stringify(opportunity.qualificationData || {}, null, 2),
    JSON.stringify({ name: opportunity.account.name, industry: opportunity.account.industry }, null, 2),
  );

  const response = await llm.chat(prompt.system, userMessage, {
    temperature: 0.4,
    maxTokens: 8192,
  });

  const proposal = await prisma.proposal.create({
    data: {
      tenantId,
      accountId: opportunity.accountId,
      opportunityId: payload.opportunityId,
      title: `Proposta — ${opportunity.title}`,
      status: 'draft',
      contentMarkdown: response.content,
      estimatedValue: opportunity.value,
      effortBreakdown: {},
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.opportunity.update({
    where: { id: payload.opportunityId },
    data: { stage: 'proposal' },
  });

  return {
    agentName: 'proposal',
    status: 'success',
    output: { proposalId: proposal.id, markdown: response.content },
    tokensUsed: response.tokensUsed,
    latencyMs: response.latencyMs,
    model: response.model,
  };
}

async function runRisk(
  tenantId: string,
  payload: Record<string, any>,
): Promise<AgentJobResult> {
  const opportunity = await prisma.opportunity.findFirstOrThrow({
    where: { id: payload.opportunityId, tenantId },
  });

  const proposals = await prisma.proposal.findMany({
    where: { opportunityId: payload.opportunityId, tenantId },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  const resources = await prisma.resource.findMany({ where: { tenantId } });
  const slas = await prisma.sLA.findMany({
    where: { accountId: opportunity.accountId, tenantId },
  });

  const prompt = AGENT_PROMPTS.risk;
  const userMessage = prompt.userTemplate(
    JSON.stringify(proposals[0] || {}, null, 2),
    JSON.stringify(resources.map((r) => ({ name: r.name, costPerHour: r.costPerHour })), null, 2),
    JSON.stringify(slas.map((s) => ({ tier: s.tier, metrics: s.metrics })), null, 2),
  );

  const response = await llm.chat(prompt.system, userMessage, {
    responseFormat: 'json',
    temperature: 0.2,
  });

  const output = JSON.parse(response.content);

  if (proposals[0]) {
    await prisma.proposal.update({
      where: { id: proposals[0].id },
      data: { riskAssessment: output },
    });
  }

  return {
    agentName: 'risk',
    status: 'success',
    output,
    tokensUsed: response.tokensUsed,
    latencyMs: response.latencyMs,
    model: response.model,
  };
}

async function runChurn(
  tenantId: string,
  payload: Record<string, any>,
): Promise<AgentJobResult> {
  const account = await prisma.account.findFirstOrThrow({
    where: { id: payload.accountId, tenantId },
  });

  const slas = await prisma.sLA.findMany({ where: { accountId: payload.accountId, tenantId } });
  const projects = await prisma.project.findMany({ where: { accountId: payload.accountId, tenantId } });

  const prompt = AGENT_PROMPTS.churn;
  const userMessage = prompt.userTemplate(
    JSON.stringify({ ...account, slas }, null, 2),
    JSON.stringify({ projects: projects.length, activeSlas: slas.length }, null, 2),
  );

  const response = await llm.chat(prompt.system, userMessage, {
    responseFormat: 'json',
    temperature: 0.3,
  });

  return {
    agentName: 'churn',
    status: 'success',
    output: JSON.parse(response.content),
    tokensUsed: response.tokensUsed,
    latencyMs: response.latencyMs,
    model: response.model,
  };
}

async function runNegotiation(
  tenantId: string,
  payload: Record<string, any>,
): Promise<AgentJobResult> {
  const opportunity = await prisma.opportunity.findFirstOrThrow({
    where: { id: payload.opportunityId, tenantId },
  });

  const proposals = await prisma.proposal.findMany({
    where: { opportunityId: payload.opportunityId, tenantId },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  const prompt = AGENT_PROMPTS.negotiation;
  const userMessage = prompt.userTemplate(
    JSON.stringify({ value: opportunity.value, proposal: proposals[0]?.title }, null, 2),
    payload.counterpartyPosition || '',
  );

  const response = await llm.chat(prompt.system, userMessage, {
    responseFormat: 'json',
    temperature: 0.3,
  });

  return {
    agentName: 'negotiation',
    status: 'success',
    output: JSON.parse(response.content),
    tokensUsed: response.tokensUsed,
    latencyMs: response.latencyMs,
    model: response.model,
  };
}

async function runLeadToProposal(
  tenantId: string,
  payload: Record<string, any>,
): Promise<AgentJobResult> {
  const startMs = Date.now();
  let totalTokens = 0;

  // 1. Create opportunity
  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId,
      accountId: payload.accountId,
      title: payload.title,
      description: payload.description,
      value: payload.value || 0,
      stage: 'lead',
      probability: 10,
      source: payload.source || 'inbound',
    },
  });

  // 2. Qualification
  const qual = await runQualification(tenantId, {
    opportunityId: opportunity.id,
    context: payload.context || '',
  });
  totalTokens += qual.tokensUsed;

  // 3. Proposal
  const prop = await runProposal(tenantId, {
    opportunityId: opportunity.id,
  });
  totalTokens += prop.tokensUsed;

  // 4. Risk
  const risk = await runRisk(tenantId, {
    opportunityId: opportunity.id,
  });
  totalTokens += risk.tokensUsed;

  return {
    agentName: 'lead-to-proposal',
    status: 'success',
    output: {
      opportunityId: opportunity.id,
      qualification: qual.output,
      proposal: prop.output,
      risk: risk.output,
    },
    tokensUsed: totalTokens,
    latencyMs: Date.now() - startMs,
    model: qual.model,
  };
}

// ─── Start Worker ──────────────────────────────────

const worker = createAgentWorker(processJob);

process.on('SIGINT', async () => {
  console.log('[worker] Shutting down...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[worker] Shutting down...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('🔄 Agent worker is listening for jobs...');
