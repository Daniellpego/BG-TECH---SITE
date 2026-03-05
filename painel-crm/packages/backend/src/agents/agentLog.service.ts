import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function saveAgentLog(payload: {
  tenantId: string;
  agentName: string;
  action?: string;
  input?: any;
  output?: any;
  tokensUsed?: number;
  latencyMs?: number;
  status: string;
  errorMessage?: string;
  model?: string;
  opportunityId?: string;
  leadId?: string;
}) {
  return prisma.agentLog.create({
    data: {
      tenantId: payload.tenantId,
      agentName: payload.agentName,
      action: payload.action ?? '',
      input: payload.input ?? {},
      output: payload.output ?? {},
      tokensUsed: payload.tokensUsed,
      latencyMs: payload.latencyMs,
      status: payload.status,
      errorMessage: payload.errorMessage,
      model: payload.model,
      opportunityId: payload.opportunityId,
      leadId: payload.leadId,
    },
  });
}
