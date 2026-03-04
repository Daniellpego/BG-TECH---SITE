# Guia de Agentes — CRM BG Tech

> Documentação completa dos 5 agentes de IA do CRM BG Tech.
> Última atualização: Março 2026

---

## 1. Visão Geral

O CRM BG Tech possui **5 agentes de IA** especializados que automatizam tarefas-chave do funil de vendas B2B para serviços profissionais de software:

| # | Agente           | Endpoint                        | Função                                     |
|---|------------------|---------------------------------|--------------------------------------------|
| 1 | Qualification    | `POST /api/agents/qualification`| Qualifica leads com BANT e scoring          |
| 2 | Proposal         | `POST /api/agents/proposal`     | Gera propostas técnicas em Markdown         |
| 3 | Risk             | `POST /api/agents/risk`         | Avalia risco e margem de deals              |
| 4 | Churn            | `POST /api/agents/churn`        | Detecta risco de churn em contas            |
| 5 | Negotiation      | `POST /api/agents/negotiation`  | Prepara estratégias de negociação           |

Além disso, existe um **pipeline completo** que encadeia Qualification → Proposal → Risk automaticamente:

- `POST /api/agents/lead-to-proposal`

---

## 2. Agente de Qualificação

### Propósito

Analisa informações de um lead (texto livre, transcrição de reunião, dados do formulário) e extrai dados estruturados incluindo análise BANT, requisitos técnicos, riscos e recomendações.

### System Prompt

```
Você é um Agente de Qualificação técnico para BG Tech, uma empresa de software sob demanda.
Sua tarefa é analisar informações de um lead e extrair dados estruturados.

Extraia:
- BANT (Budget, Authority, Need, Timing)
- Requisitos funcionais e não-funcionais
- Componentes existentes do cliente (SCADA, ERP, CRM, etc.)
- Sinais de intenção (dark funnel signals)
- Riscos identificados
- Próximos passos recomendados
- Estimativa inicial de esforço (horas)

Forneça SEMPRE um JSON válido com a seguinte estrutura:
{
  "budget_estimate": number,
  "decision_makers": string[],
  "must_have_reqs": string[],
  "nice_to_have": string[],
  "risk_flags": string[],
  "recommended_next_steps": string[],
  "initial_effort_hours": number,
  "bant": {
    "budget": string,
    "authority": string,
    "need": string,
    "timing": string
  },
  "qualification_score": number (0-100),
  "recommended_stage": "lead" | "qualified" | "disqualified"
}
```

### Schema de Entrada

```json
{
  "opportunityId": "string (UUID)",
  "context": "string (texto livre — informações do lead, transcrição de reunião, etc.)"
}
```

### Schema de Saída

```json
{
  "agentName": "qualification",
  "status": "success",
  "output": {
    "budget_estimate": 150000,
    "decision_makers": ["João Silva (CTO)", "Maria Santos (CEO)"],
    "must_have_reqs": ["Dashboard SCADA real-time", "API REST integrada"],
    "nice_to_have": ["Mobile app", "Alertas por WhatsApp"],
    "risk_flags": ["Prazo agressivo", "Equipe interna limitada"],
    "recommended_next_steps": ["Agendar demo técnica", "Levantar requisitos detalhados"],
    "initial_effort_hours": 480,
    "bant": {
      "budget": "R$ 150-200K aprovado para 2026",
      "authority": "CTO é decisor técnico, CEO aprova budget",
      "need": "Monitoramento IoT industrial com alertas",
      "timing": "Q2 2026 — início imediato"
    },
    "qualification_score": 78,
    "recommended_stage": "qualified"
  },
  "tokensUsed": 1250,
  "latencyMs": 2340,
  "model": "mock-v1"
}
```

### Exemplo de Chamada

```bash
# 1. Obter JWT
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}' \
  | jq -r '.access_token')

# 2. Executar agente de qualificação
curl -X POST http://localhost:3001/api/agents/qualification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "opportunityId": "opp-t1-001",
    "context": "Reunião com Petrobras Digital. CTO João Silva precisa de plataforma IoT industrial para monitoramento SCADA. Budget aprovado de R$200K. Timing: início Q2 2026. Equipe interna de 5 devs mas sem experiência em IoT. Precisam de dashboard real-time, alertas e API REST."
  }'
```

---

## 3. Agente de Propostas

### Propósito

Gera uma proposta técnica completa em Markdown a partir dos dados de qualificação e informações da conta. A proposta inclui resumo executivo, arquitetura, breakdown de esforço, riscos, cronograma e investimento.

### System Prompt

```
Você é um Agente de Propostas técnico para BG Tech.
Sua tarefa é gerar uma proposta técnica detalhada em Markdown.

Use os dados de qualificação e o catálogo de componentes fornecido.

A proposta deve conter:
1. Resumo Executivo
2. Arquitetura Proposta (diagrama textual ASCII)
3. Breakdown de esforço por recurso (tabela com horas)
4. Riscos e mitigação
5. Cronograma estimado (milestones)
6. Investimento total estimado
7. Condições de pagamento sugeridas
8. Validade da proposta
9. Equipe recomendada

Gere o documento COMPLETO em Markdown, pronto para envio ao cliente.
Inclua tabelas formatadas e seções bem organizadas.
```

### Schema de Entrada

```json
{
  "opportunityId": "string (UUID)"
}
```

> **Nota:** O agente busca automaticamente os dados de `qualificationData` e `account` do banco.

### Schema de Saída

```json
{
  "agentName": "proposal",
  "status": "success",
  "output": {
    "proposalId": "uuid-da-proposta-criada",
    "markdown": "# Proposta Técnica — Plataforma IoT\n\n## Resumo Executivo\n..."
  },
  "tokensUsed": 3500,
  "latencyMs": 4200,
  "model": "mock-v1"
}
```

### Exemplo de Chamada

```bash
curl -X POST http://localhost:3001/api/agents/proposal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "opportunityId": "opp-t1-001"
  }'
```

---

## 4. Agente de Risco

### Propósito

Avalia a margem e risco de um deal com base na proposta, custos de recursos e SLAs. Retorna score de risco, análise financeira (best/expected/worst case), recomendação de go/no-go e pontos de atenção.

### System Prompt

```
Você é um Agente de Análise de Risco para BG Tech.
Avalie a margem e risco de um deal.

Entrada: proposta, custos de recursos, SLA solicitado.

Retorne SEMPRE um JSON válido:
{
  "risk_score": number (0-100, onde 100 = máximo risco),
  "risk_level": "low" | "medium" | "high" | "critical",
  "attention_points": string[],
  "financial_impact": {
    "best_case_margin": number (0-1),
    "expected_margin": number (0-1),
    "worst_case_margin": number (0-1)
  },
  "escalate_to": string[] (ex: ["finance", "legal"]),
  "recommendations": string[],
  "go_no_go": "go" | "conditional" | "no_go"
}
```

### Schema de Entrada

```json
{
  "opportunityId": "string (UUID)"
}
```

> **Nota:** O agente busca automaticamente a última proposta, custos de recursos e SLAs.

### Schema de Saída

```json
{
  "agentName": "risk",
  "status": "success",
  "output": {
    "risk_score": 42,
    "risk_level": "medium",
    "attention_points": [
      "Prazo agressivo pode impactar qualidade",
      "Margem apertada se escopo crescer"
    ],
    "financial_impact": {
      "best_case_margin": 0.35,
      "expected_margin": 0.22,
      "worst_case_margin": 0.08
    },
    "escalate_to": ["finance"],
    "recommendations": [
      "Incluir buffer de 15% no cronograma",
      "Definir escopo fixo com change request pago"
    ],
    "go_no_go": "conditional"
  },
  "tokensUsed": 980,
  "latencyMs": 1800,
  "model": "mock-v1"
}
```

### Exemplo de Chamada

```bash
curl -X POST http://localhost:3001/api/agents/risk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "opportunityId": "opp-t1-001"
  }'
```

---

## 5. Agente de Prevenção de Churn

### Propósito

Analisa sinais de risco de churn em uma conta com base no histórico de engajamento, SLAs, projetos e propõe ações preventivas de retenção.

### System Prompt

```
Você é um Agente de Prevenção de Churn para BG Tech.
Analise sinais de risco de churn em uma conta e proponha ações preventivas.

Retorne SEMPRE um JSON válido:
{
  "churn_probability": number (0-1),
  "risk_signals": string[],
  "health_score": number (0-100),
  "recommended_actions": string[],
  "urgency": "low" | "medium" | "high" | "critical",
  "retention_strategy": string
}
```

### Schema de Entrada

```json
{
  "accountId": "string (UUID)"
}
```

### Schema de Saída

```json
{
  "agentName": "churn",
  "status": "success",
  "output": {
    "churn_probability": 0.35,
    "risk_signals": [
      "SLA tier rebaixado no último trimestre",
      "Nenhum novo projeto nos últimos 6 meses"
    ],
    "health_score": 62,
    "recommended_actions": [
      "Agendar QBR (Quarterly Business Review)",
      "Oferecer upgrade de SLA com desconto",
      "Apresentar roadmap de novas features"
    ],
    "urgency": "medium",
    "retention_strategy": "Reengajamento proativo com foco em expansão de escopo"
  },
  "tokensUsed": 750,
  "latencyMs": 1500,
  "model": "mock-v1"
}
```

### Exemplo de Chamada

```bash
curl -X POST http://localhost:3001/api/agents/churn \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "accountId": "acc-t1-001"
  }'
```

---

## 6. Agente de Negociação

### Propósito

Prepara estratégias de negociação e contra-propostas considerando a posição da contraparte, threshold de walk-away, sequência de concessões e argumentos-chave.

### System Prompt

```
Você é um Agente de Negociação AI-to-AI para BG Tech.
Sua função é preparar estratégias de negociação e contra-propostas.

Retorne SEMPRE um JSON válido:
{
  "counter_proposal": {
    "adjusted_value": number,
    "payment_terms": string,
    "scope_adjustments": string[],
    "timeline_adjustment": string
  },
  "negotiation_strategy": "value-based" | "relationship" | "competitive",
  "walk_away_threshold": number,
  "concession_sequence": string[],
  "key_arguments": string[],
  "anticipated_objections": { "objection": string, "response": string }[]
}
```

### Schema de Entrada

```json
{
  "opportunityId": "string (UUID)",
  "counterpartyPosition": "string (texto livre — posição da contraparte)"
}
```

### Schema de Saída

```json
{
  "agentName": "negotiation",
  "status": "success",
  "output": {
    "counter_proposal": {
      "adjusted_value": 175000,
      "payment_terms": "30/30/40 (início, meio, entrega)",
      "scope_adjustments": ["Remover app mobile do escopo inicial"],
      "timeline_adjustment": "Estender prazo em 2 semanas"
    },
    "negotiation_strategy": "value-based",
    "walk_away_threshold": 130000,
    "concession_sequence": [
      "1. Oferecer desconto de 5% para pagamento à vista",
      "2. Incluir 1 mês de suporte gratuito",
      "3. Aceitar timeline estendida mantendo valor"
    ],
    "key_arguments": [
      "ROI estimado em 6 meses",
      "Expertise comprovada em projetos similares"
    ],
    "anticipated_objections": [
      {
        "objection": "Valor acima do budget",
        "response": "Podemos modularizar a entrega em fases, começando pelo MVP dentro do budget"
      }
    ]
  },
  "tokensUsed": 1100,
  "latencyMs": 2100,
  "model": "mock-v1"
}
```

### Exemplo de Chamada

```bash
curl -X POST http://localhost:3001/api/agents/negotiation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "opportunityId": "opp-t1-001",
    "counterpartyPosition": "Cliente quer reduzir valor de R$200K para R$150K e pagar em 4 parcelas. Aceita um escopo reduzido sem app mobile."
  }'
```

---

## 7. Pipeline Completo: Lead to Proposal

### Propósito

Encadeia automaticamente 3 agentes em sequência:

1. **Cria oportunidade** como `lead`
2. **Qualification Agent** → qualifica e atualiza estágio
3. **Proposal Agent** → gera proposta técnica
4. **Risk Agent** → avalia risco do deal

### Schema de Entrada

```json
{
  "accountId": "string (UUID da conta existente)",
  "title": "string (título da oportunidade)",
  "description": "string (descrição do projeto)",
  "value": "number (valor estimado)",
  "source": "string (inbound | outbound | referral | partner) — opcional",
  "context": "string (informações do lead + transcrição)"
}
```

### Schema de Saída

```json
{
  "opportunity": { "id": "...", "title": "...", "stage": "...", "..." : "..." },
  "qualification": { "agentName": "qualification", "status": "success", "output": { "..." }, "..." },
  "proposal": { "agentName": "proposal", "status": "success", "output": { "proposalId": "...", "markdown": "..." }, "..." },
  "risk": { "agentName": "risk", "status": "success", "output": { "risk_score": 42, "..." }, "..." }
}
```

### Exemplo de Chamada Completa

```bash
# Obter JWT
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}' \
  | jq -r '.access_token')

# Executar pipeline completo
curl -X POST http://localhost:3001/api/agents/lead-to-proposal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "accountId": "acc-t1-001",
    "title": "Plataforma IoT Industrial — Petrobras Digital",
    "description": "Desenvolvimento de plataforma de monitoramento IoT com dashboard SCADA real-time, alertas e API REST integrada.",
    "value": 200000,
    "source": "inbound",
    "context": "Reunião realizada em 28/02/2026 com João Silva (CTO) e Maria Santos (CEO) da Petrobras Digital. A empresa precisa modernizar seu monitoramento SCADA com um dashboard web real-time. Budget aprovado de R$200K. Precisam de: dashboard real-time com gráficos, sistema de alertas (email + SMS), API REST para integração com ERP SAP, app mobile (nice-to-have). Equipe interna tem 5 devs Java mas sem experiência em IoT/SCADA. Timeline desejada: início em abril, MVP em julho. Riscos: prazo agressivo, integração SAP pode ser complexa."
  }'
```

### Exemplo de Resposta

```json
{
  "opportunity": {
    "id": "generated-uuid",
    "tenantId": "tenant-001",
    "accountId": "acc-t1-001",
    "title": "Plataforma IoT Industrial — Petrobras Digital",
    "stage": "proposal",
    "value": 200000,
    "probability": 78,
    "source": "inbound"
  },
  "qualification": {
    "agentName": "qualification",
    "status": "success",
    "output": {
      "budget_estimate": 200000,
      "qualification_score": 78,
      "recommended_stage": "qualified",
      "bant": {
        "budget": "R$ 200K aprovado",
        "authority": "CTO + CEO",
        "need": "Monitoramento IoT SCADA",
        "timing": "Abril-Julho 2026"
      },
      "initial_effort_hours": 480
    },
    "tokensUsed": 1250,
    "latencyMs": 2340,
    "model": "mock-v1"
  },
  "proposal": {
    "agentName": "proposal",
    "status": "success",
    "output": {
      "proposalId": "generated-proposal-uuid",
      "markdown": "# Proposta Técnica — Plataforma IoT Industrial..."
    },
    "tokensUsed": 3500,
    "latencyMs": 4200,
    "model": "mock-v1"
  },
  "risk": {
    "agentName": "risk",
    "status": "success",
    "output": {
      "risk_score": 42,
      "risk_level": "medium",
      "go_no_go": "conditional"
    },
    "tokensUsed": 980,
    "latencyMs": 1800,
    "model": "mock-v1"
  }
}
```

---

## 8. Como Trocar o Provider LLM

O provider é controlado pela variável de ambiente `LLM_PROVIDER`:

```bash
# No arquivo .env do backend
LLM_PROVIDER=mock        # Desenvolvimento — sem custo, respostas simuladas
LLM_PROVIDER=openai      # Produção — requer OPENAI_API_KEY
LLM_PROVIDER=anthropic   # Produção — requer ANTHROPIC_API_KEY
```

### Configuração por Provider

| Provider    | Variáveis Necessárias                           |
|-------------|------------------------------------------------|
| `mock`      | Nenhuma (padrão)                                |
| `openai`    | `OPENAI_API_KEY`, `OPENAI_MODEL` (ex: gpt-4o)  |
| `anthropic` | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (ex: claude-sonnet-4-20250514) |

### Exemplo `.env` para OpenAI

```dotenv
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o
```

### Exemplo `.env` para Anthropic

```dotenv
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

---

## 9. Como Adicionar um Agente Customizado

### Passo 1: Criar o prompt em `prompts.ts`

```typescript
// painel-crm/packages/backend/src/agents/prompts.ts
export const AGENT_PROMPTS = {
  // ... prompts existentes ...

  meuAgente: {
    system: `Você é um Agente de [Função] para BG Tech.
[Instruções detalhadas...]

Retorne SEMPRE um JSON válido:
{
  "campo1": "tipo",
  "campo2": "tipo"
}`,
    userTemplate: (param1: string, param2: string) =>
      `[Template com contexto]\n\n${param1}\n\n${param2}`,
  },
};
```

### Passo 2: Adicionar método no `AgentsService`

```typescript
// painel-crm/packages/backend/src/agents/agents.service.ts
async runMeuAgente(tenantId: string, ...params): Promise<AgentRunResult> {
  const prompt = AGENT_PROMPTS.meuAgente;
  const userMessage = prompt.userTemplate(param1, param2);

  const response = await this.llm.chat(prompt.system, userMessage, {
    responseFormat: 'json',
    temperature: 0.2,
  });

  const output = JSON.parse(response.content);
  await this.logAgent(tenantId, null, 'meuAgente', 'acao', {}, output, response);

  return {
    agentName: 'meuAgente',
    status: 'success',
    output,
    tokensUsed: response.tokensUsed,
    latencyMs: response.latencyMs,
    model: response.model,
  };
}
```

### Passo 3: Adicionar endpoint no `AgentsController`

```typescript
// painel-crm/packages/backend/src/agents/agents.controller.ts
@Post('meu-agente')
@ApiOperation({ summary: 'Run Meu Agente' })
async meuAgente(
  @CurrentTenant() tenantId: string,
  @Body() body: { param1: string; param2: string },
) {
  return this.agentsService.runMeuAgente(tenantId, body.param1, body.param2);
}
```

### Passo 4: Adicionar mock response (se necessário)

Atualizar `MockLlmAdapter` em `painel-crm/packages/backend/src/agents/adapters/mock-llm.adapter.ts` para reconhecer o novo system prompt e retornar dados de teste.

### Passo 5: Adicionar testes

```typescript
// painel-crm/packages/backend/src/agents/agents.spec.ts
it('should return meuAgente JSON', async () => {
  const result = await adapter.chat(AGENT_PROMPTS.meuAgente.system, 'test');
  const parsed = JSON.parse(result.content);
  expect(parsed).toHaveProperty('campo1');
});
```
