/**
 * Qualification Worker for Quiz Leads
 *
 * Processes 'qualification' jobs from the BullMQ queue.
 * - Loads lead from DB
 * - Calls LLM adapter with quiz qualification prompt
 * - Updates lead (score, tags, lead_status)
 * - Creates Opportunity when hot (>= 75)
 * - Persists AgentLog on success and error
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createLlmAdapter } from './adapters/llm.factory';
import type { AgentJobData, AgentJobResult } from './queue';

const prisma = new PrismaClient();

/** Safely parse JSON from LLM response, returning null on failure. */
function safeJsonParse(content: unknown): Record<string, any> | null {
  if (typeof content === 'object' && content !== null) return content as Record<string, any>;
  if (typeof content !== 'string') return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Load the quiz qualification prompt once
const promptPath = join(__dirname, 'prompts', 'qualification_leads_quiz.json');
let promptConfig: { system: string; instructions: string; schema: any };
try {
  promptConfig = JSON.parse(readFileSync(promptPath, 'utf-8'));
} catch {
  // Fallback for compiled dist (json copied)
  promptConfig = {
    system: 'Você é um Agente de Qualificação técnico para BG Tech. Analise a resposta do quiz do lead e retorne APENAS JSON.',
    instructions: 'Calcule lead_score entre 0-100. Score >=75 => hot; 50-74 => warm; <50 => cold.',
    schema: {},
  };
}

/**
 * Process a qualification job for a quiz lead.
 */
export async function processLeadQualification(
  jobData: AgentJobData,
): Promise<AgentJobResult> {
  const { tenantId, payload } = jobData;
  const leadId: string = payload.leadId;
  const context = payload.context ?? {};
  const start = Date.now();

  // Set RLS tenant context
  await prisma.$executeRawUnsafe(
    "SELECT set_config('my.tenant', $1, true)",
    tenantId,
  );

  // Load lead from DB if context not provided
  let leadData = context;
  if (leadId && (!context.nome && !context.empresa)) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      leadData = {
        nome: lead.nome,
        empresa: lead.empresa,
        whatsapp: lead.whatsapp,
        segmento: lead.segmento,
        horas_perdidas: lead.horasPerdidas,
        dor_principal: lead.dorPrincipal,
        faturamento: lead.faturamento,
        maturidade: lead.maturidade,
        janela_decisao: lead.janelaDecisao,
        lead_temperature: lead.leadTemperature,
        score: lead.score,
        custo_mensal: lead.custoMensal,
        diagnostico_id: lead.diagnosticoId,
      };
    }
  }

  // Build prompts
  const systemPrompt = [
    promptConfig.system,
    '',
    promptConfig.instructions,
    '',
    '## Output JSON Schema (STRICT)',
    '```json',
    JSON.stringify(promptConfig.schema, null, 2),
    '```',
    'Responda APENAS com JSON válido.',
  ].join('\n');

  const userMessage = `Dados do lead (quiz):\n${JSON.stringify(leadData, null, 2)}`;

  try {
    const llm = createLlmAdapter();
    const response = await llm.chat(systemPrompt, userMessage, {
      responseFormat: 'json',
      temperature: 0.2,
    });

    const output = safeJsonParse(response.content);
    if (!output) {
      throw new Error('LLM returned invalid JSON: ' + String(response.content).slice(0, 200));
    }

    const latencyMs = Date.now() - start;

    // Update lead with qualification results
    if (leadId) {
      const existingLead = await prisma.lead.findUnique({ where: { id: leadId } });
      const prevRaw = (existingLead?.rawQuizResponse as Record<string, any>) || {};

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          score: output.lead_score ?? existingLead?.score,
          leadTags: { push: output.lead_category },
          leadStatus: output.recommended_stage ?? 'qualified',
          rawQuizResponse: { ...prevRaw, qualification: output },
          updatedAt: new Date(),
        },
      });

      // Route based on category (idempotent — skip if already converted)
      const freshLead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (output.lead_category === 'hot' && output.lead_score >= 75 && !freshLead?.opportunityId) {
        await createOpportunityFromLead(tenantId, leadId, leadData, output);
      }
    }

    // Persist AgentLog
    await prisma.agentLog.create({
      data: {
        tenantId,
        leadId: leadId || undefined,
        agentName: 'qualification',
        action: jobData.action,
        input: leadData,
        output,
        tokensUsed: response.tokensUsed,
        latencyMs: Math.round(latencyMs),
        status: 'success',
        model: response.model,
      },
    });

    return {
      agentName: 'qualification',
      status: 'success',
      output,
      tokensUsed: response.tokensUsed,
      latencyMs: Math.round(latencyMs),
      model: response.model,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;

    // Persist error log
    await prisma.agentLog.create({
      data: {
        tenantId,
        leadId: leadId || undefined,
        agentName: 'qualification',
        action: jobData.action,
        input: leadData,
        status: 'error',
        errorMessage: error.message,
        latencyMs: Math.round(latencyMs),
      },
    }).catch(() => {}); // Don't let log failure mask the real error

    throw error;
  }
}

// ─── Routing Helper ─────────────────────────────────────────────────────

async function createOpportunityFromLead(
  tenantId: string,
  leadId: string,
  leadData: any,
  qualification: any,
): Promise<void> {
  // We need an account — find or create one from the lead's empresa
  let accountId: string | null = null;

  if (leadData.empresa) {
    const existingAccount = await prisma.account.findFirst({
      where: { tenantId, name: leadData.empresa },
    });

    if (existingAccount) {
      accountId = existingAccount.id;
    } else {
      const newAccount = await prisma.account.create({
        data: {
          tenantId,
          name: leadData.empresa,
          industry: leadData.segmento ?? undefined,
          meta: { source: 'quiz_lead', leadId },
        },
      });
      accountId = newAccount.id;
    }
  }

  if (!accountId) {
    // Create a placeholder account
    const placeholder = await prisma.account.create({
      data: {
        tenantId,
        name: leadData.nome ?? 'Lead sem empresa',
        meta: { source: 'quiz_lead', leadId },
      },
    });
    accountId = placeholder.id;
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId,
      accountId,
      title: `Oportunidade - ${leadData.empresa || leadData.nome || 'Quiz Lead'}`,
      description: qualification.summary ?? 'Gerado automaticamente via qualificação de quiz',
      value: qualification.budget_estimate_brl ?? 0,
      stage: 'qualified',
      probability: qualification.lead_score ?? 75,
      source: 'quiz',
      qualificationData: qualification,
    },
  });

  // Link opportunity back to the lead
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      opportunityId: opportunity.id,
      leadStatus: 'converted',
    },
  });

  console.log(
    `[qualification-worker] Hot lead ${leadId} → Opportunity ${opportunity.id} created`,
  );
}
