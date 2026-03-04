# Arquitetura — CRM BG Tech

> Documento de arquitetura detalhada do CRM proprietário da BG Tech.
> Última atualização: Março 2026

---

## 1. Visão Geral

O **CRM BG Tech** é um CRM proprietário construído para empresas de **software sob demanda** e **serviços profissionais de TI**. Diferente de CRMs genéricos, ele integra nativamente:

- Qualificação técnica de leads (BANT + requisitos de engenharia)
- Geração automatizada de propostas técnicas via IA
- Gestão de contratos (CLM) com verificação determinística
- Analytics de revenue engineering (Pipeline Velocity, Margin Variance, LTV)
- Agentes de IA especializados para cada etapa do funil

**Público-alvo:** Software houses, consultorias de TI, fábricas de software que vendem projetos sob demanda.

---

## 2. Camadas da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
│                  Next.js 14 (App Router) + Tailwind             │
│         Dashboard │ Pipeline │ Propostas │ Contratos │ SLA      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API (JWT)
┌──────────────────────────────▼──────────────────────────────────┐
│                       APPLICATION LAYER                         │
│                    NestJS (Modular Architecture)                 │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │   Auth   │ │ Accounts │ │ Contacts │ │  Opportunities   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │Resources │ │ Projects │ │   SLAs   │ │    Proposals     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐    │
│  │Contracts │ │  Agents  │ │        Analytics             │    │
│  └──────────┘ └──────────┘ └──────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Prisma ORM
┌──────────────────────────────▼──────────────────────────────────┐
│                         DATA LAYER                              │
│           PostgreSQL 16 + JSONB │ Redis 7 (BullMQ)              │
│                RLS Policies │ Supabase Auth                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Camada de Cadastro (Registration)

| Módulo          | Responsabilidade                                                  |
|-----------------|-------------------------------------------------------------------|
| **Accounts**    | Empresas/clientes com indústria, tamanho, receita anual, metadados JSONB |
| **Contacts**    | Pessoas associadas a contas (CTO, CEO, Tech Lead) com LinkedIn    |
| **Opportunities** | Pipeline de vendas com estágios, valor, probabilidade, estimativa técnica |

### 2.2 Camada de Engajamento (Engagement)

| Módulo          | Responsabilidade                                                  |
|-----------------|-------------------------------------------------------------------|
| **Agents**      | 5 agentes de IA (Qualificação, Proposta, Risco, Churn, Negociação) |
| **Proposals**   | Propostas técnicas geradas por IA em Markdown, versionadas         |
| **Contracts**   | CLM — ciclo de vida de contratos com cláusulas e assinatura        |

### 2.3 Camada de Inteligência (Intelligence)

| Módulo          | Responsabilidade                                                  |
|-----------------|-------------------------------------------------------------------|
| **Analytics**   | KPIs em tempo real: Pipeline Velocity, Stage Duration, Utilization |
| **ETL/BI**      | Extração incremental delta, views SQL semânticas                   |
| **Looker/PowerBI** | Modelos LookML para integração com ferramentas de BI            |

---

## 3. Stack Tecnológica

| Camada       | Tecnologia                    | Justificativa                                        |
|-------------|-------------------------------|------------------------------------------------------|
| Backend      | **NestJS** (TypeScript)        | Modular, injeção de dependência, decorators, Swagger |
| Frontend     | **Next.js 14** (App Router)   | SSR/SSG, React Server Components, Tailwind           |
| Banco de Dados | **PostgreSQL 16** + JSONB    | ACID, JSONB para dados semi-estruturados, RLS nativo |
| ORM          | **Prisma**                    | Type-safe, migrations, introspection                 |
| Auth         | **Supabase Auth** + JWT       | RLS integrado, hooks customizados para tenant_id     |
| Filas        | **Redis 7** + BullMQ          | Jobs assíncronos, rate limiting, cache               |
| LLM          | OpenAI / Anthropic / Mock     | Adapters intercambiáveis via factory pattern          |
| CI/CD        | **GitHub Actions**            | Lint, test, build, Docker push                       |
| Infra        | **Docker Compose** / Terraform | Dev local + template para cloud                     |

---

## 4. Multi-Tenancy

### Estratégia: Shared Database + Row Level Security (RLS)

```
┌─────────────────────────────────────────────┐
│              PostgreSQL (Shared)              │
│                                              │
│  ┌─ tenants ─────────────────────────────┐   │
│  │ id: tenant-001 │ name: ACME Corp      │   │
│  │ id: tenant-002 │ name: Globex Ind.    │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  Toda tabela tem coluna tenant_id            │
│  RLS: WHERE tenant_id = get_current_tenant() │
└─────────────────────────────────────────────┘
```

**Fluxo de isolamento:**

1. Usuário faz login → recebe JWT com `tenant_id` e `user_role` nos claims
2. Supabase Auth hook (`custom_access_token_hook`) injeta dados no JWT
3. Toda query passa pelo RLS vía `get_current_tenant_id()` que extrai tenant do JWT
4. Aplicação NestJS também valida `tenantId` no decorator `@CurrentTenant()`
5. Dupla proteção: RLS no banco + validação na aplicação

### Sessão RLS no NestJS

O `TenantInterceptor` (global) executa antes de cada request:

```
PrismaSessionService.setTenant(tenantId)
  → SELECT set_config('my.tenant', tenantId, true)
```

Isso define `current_setting('my.tenant')` na sessão Postgres, que é lido
pelas RLS policies (`WHERE tenant_id = current_setting('my.tenant')::uuid`).

### Worker de Agentes (BullMQ)

Os endpoints `POST /api/agents/*` agora enfileiram jobs no Redis (fila `agent-jobs`)
e retornam `{ jobId }` com HTTP 202. Um worker separado (`npm run start:worker`)
processa os jobs assincronamente:

```
Controller → enqueueAgentJob() → Redis (BullMQ)
                                       ↓
Worker: SET my.tenant → executa agente → persiste AgentLog → retorna resultado
                                       ↓
Frontend: GET /api/agents/jobs/:jobId → poll status/resultado
```

### Budget / Cost Control

O `BudgetMiddleware` intercepta `POST /agents/*` e verifica o gasto acumulado
por tenant contra `LLM_MONTHLY_BUDGET_USD`. Retorna HTTP 402 quando excedido.

### Observabilidade

- **Logging:** pino (JSON em prod, pino-pretty em dev)
- **Metrics:** prom-client → `GET /api/metrics` (Prometheus format)
- **Health:** `GET /api/health`

---

## 5. Modelo de Dados

### 5.1 Diagrama de Entidades (11 entidades)

```
┌──────────┐
│  Tenant  │──────────────────────────────────────────────────┐
│──────────│                                                   │
│ id (PK)  │                                                   │
│ name     │                                                   │
│ domain   │                                                   │
│ plan     │                                                   │
│ settings │                                                   │
└────┬─────┘                                                   │
     │ 1:N                                                     │
     │                                                         │
     ├──────────────┬──────────────┬───────────────┐           │
     ▼              ▼              ▼               ▼           │
┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐       │
│  User   │  │ Account  │  │ Resource  │  │ AgentLog │       │
│─────────│  │──────────│  │───────────│  │──────────│       │
│ id (PK) │  │ id (PK)  │  │ id (PK)   │  │ id (PK)  │       │
│ email   │  │ name     │  │ name      │  │ agentName│       │
│ role    │  │ industry │  │ costPerHr │  │ action   │       │
│ tenant  │  │ size     │  │ skills[]  │  │ input    │       │
│ _id(FK) │  │ revenue  │  │ tenant    │  │ output   │       │
└─────────┘  │ tenant   │  │ _id(FK)   │  │ tokens   │       │
             │ _id(FK)  │  └───────────┘  │ latency  │       │
             └────┬─────┘                 │ oppty    │       │
                  │ 1:N                   │ _id(FK)  │       │
     ┌────────────┼────────────┬──────────└──────────┘       │
     ▼            ▼            ▼            ▼                 │
┌──────────┐┌────────────┐┌─────────┐┌──────────┐           │
│ Contact  ││Opportunity ││ Project ││   SLA    │           │
│──────────││────────────││─────────││──────────│           │
│ id (PK)  ││ id (PK)    ││ id (PK) ││ id (PK)  │           │
│ name     ││ title      ││ name    ││ tier     │           │
│ email    ││ value      ││ status  ││ metrics  │           │
│ role     ││ stage      ││ margin  ││ renewAt  │           │
│ account  ││ probability││ hours   ││ account  │           │
│ _id(FK)  ││ qualData   ││ account ││ _id(FK)  │           │
└──────────┘│ account    ││ _id(FK) │└──────────┘           │
            │ _id(FK)    │└─────────┘                       │
            └─────┬──────┘                                   │
                  │ 1:N                                      │
                  ▼                                          │
           ┌───────────┐                                     │
           │ Proposal  │                                     │
           │───────────│                                     │
           │ id (PK)   │                                     │
           │ title     │                                     │
           │ version   │                                     │
           │ status    │                                     │
           │ markdown  │                                     │
           │ risk      │                                     │
           │ oppty     │                                     │
           │ _id(FK)   │                                     │
           └─────┬─────┘                                     │
                 │ 1:N                                       │
                 ▼                                           │
           ┌───────────┐                                     │
           │ Contract  │                                     │
           │───────────│                                     │
           │ id (PK)   │                                     │
           │ title     │                                     │
           │ status    │                                     │
           │ clauses[] │                                     │
           │ signedAt  │                                     │
           │ proposal  │                                     │
           │ _id(FK)   │                                     │
           └───────────┘                                     │
```

### 5.2 Campos JSONB Relevantes

| Entidade      | Campo JSONB           | Conteúdo                                           |
|---------------|-----------------------|---------------------------------------------------|
| Tenant        | `settings`            | Timezone, moeda, configurações personalizadas      |
| Account       | `meta`                | Tags, integrações, dados customizados              |
| Opportunity   | `qualificationData`   | Resultado do agente de qualificação (BANT)         |
| Opportunity   | `technicalEstimate`   | Estimativa técnica (horas, componentes)            |
| Resource      | `skills`              | Array de competências técnicas                      |
| Project       | `milestones`          | Array de marcos do projeto                          |
| Proposal      | `effortBreakdown`     | Tabela de esforço por recurso/fase                  |
| Proposal      | `riskAssessment`      | Resultado do agente de risco                        |
| Proposal      | `verificationLog`     | Log da verificação determinística (CLM)            |
| Contract      | `clauses`             | Array de cláusulas contratuais                      |
| Contract      | `signatureData`       | Dados de assinatura eletrônica (placeholder)        |
| AgentLog      | `input` / `output`    | Entrada e saída completas do agente                 |

---

## 6. Arquitetura de Agentes

### 6.1 Visão Geral

```
┌─────────────────────────────────────────────────────┐
│                   AgentsController                    │
│   POST /agents/qualification                         │
│   POST /agents/proposal                              │
│   POST /agents/risk                                  │
│   POST /agents/churn                                 │
│   POST /agents/negotiation                           │
│   POST /agents/lead-to-proposal (pipeline completo)  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                    AgentsService                      │
│                                                       │
│  runQualification() ─┐                                │
│  runProposal()    ───┤    AGENT_PROMPTS (templates)   │
│  runRisk()        ───┤   ┌───────────────────────┐    │
│  runChurn()       ───┼──▶│ system prompt          │    │
│  runNegotiation() ───┤   │ userTemplate(context)  │    │
│  runLeadToProposal()│   └───────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                   LLM Adapter Layer                   │
│                                                       │
│    LlmAdapter (interface)                             │
│    ├── MockLlmAdapter    (dev/test — sem custo)       │
│    ├── OpenAIAdapter     (GPT-4o)                     │
│    └── AnthropicAdapter  (Claude Sonnet)              │
│                                                       │
│    Factory: createLlmAdapter()                        │
│    Seleção via: LLM_PROVIDER env var                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                    AgentLog (Audit)                    │
│  Toda execução é logada: input, output, tokens,       │
│  latência, status, erros                              │
└─────────────────────────────────────────────────────┘
```

### 6.2 Os 5 Agentes

| Agente          | Função                                   | Input                      | Output                                  |
|-----------------|------------------------------------------|----------------------------|-----------------------------------------|
| **Qualification** | Analisa lead, extrai BANT, score       | context (texto livre)      | JSON: BANT, score, next_steps, effort   |
| **Proposal**    | Gera proposta técnica em Markdown         | qualificationData, account | Markdown: proposta completa              |
| **Risk**        | Avalia risco e margem de um deal          | proposal, costs, SLA       | JSON: risk_score, margins, go/no_go     |
| **Churn**       | Detecta risco de churn em uma conta       | accountData, usage         | JSON: churn_probability, health_score   |
| **Negotiation** | Estratégia de negociação AI-to-AI         | proposal, counterparty     | JSON: counter_proposal, strategy        |

### 6.3 LLM Adapters

```typescript
interface LlmAdapter {
  name: string;
  chat(systemPrompt: string, userMessage: string, options?: LlmOptions): Promise<LlmResponse>;
}

interface LlmResponse {
  content: string;
  tokensUsed: number;
  latencyMs: number;
  model: string;
}
```

**Seleção via variável de ambiente:**

| `LLM_PROVIDER` | Adapter            | Uso recomendado         |
|----------------|--------------------|-------------------------|
| `mock`         | MockLlmAdapter     | Desenvolvimento e testes |
| `openai`       | OpenAIAdapter      | Produção (GPT-4o)       |
| `anthropic`    | AnthropicAdapter   | Produção (Claude Sonnet) |

---

## 7. Fluxo CLM (Contract Lifecycle Management)

```
┌───────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐
│ Proposta  │───▶│  LLM Draft   │───▶│ Verificação  │───▶│ Aprovação│───▶│Assinatura│
│ Aceita    │    │ (Contrato)   │    │Determinística│    │  Manual  │    │(placeholder)│
└───────────┘    └──────────────┘    └──────────────┘    └──────────┘    └──────────┘
                                            │
                                    ┌───────▼───────┐
                                    │ Rule Engine   │
                                    │───────────────│
                                    │ • Valores ≤   │
                                    │   proposta    │
                                    │ • Cláusulas   │
                                    │   obrigatórias│
                                    │ • Prazos      │
                                    │   válidos     │
                                    │ • Compliance  │
                                    └───────────────┘
```

### Estágios do Contrato

| Status         | Descrição                                          |
|----------------|----------------------------------------------------|
| `draft`        | Rascunho gerado pela LLM                           |
| `legal_review` | Em revisão pela equipe jurídica                     |
| `approved`     | Aprovado internamente                               |
| `signed`       | Assinado pelas partes (placeholder para e-sign)     |
| `active`       | Contrato em vigor                                   |
| `expired`      | Contrato expirado                                   |

### Verificação Determinística

O CLM inclui uma camada de **verificação determinística** que roda após o draft da LLM:

1. **Validação de valores** — O valor do contrato não pode exceder o da proposta
2. **Cláusulas obrigatórias** — Verifica presença de cláusulas de SLA, confidencialidade, IP
3. **Prazos** — Datas de início/expiração consistentes
4. **Compliance** — Verificação de termos regulatórios
5. **Log de verificação** — Resultado armazenado em `verificationLog` (JSONB)

---

## 8. ETL / BI

### 8.1 Extração Incremental (Delta)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  PostgreSQL  │────▶│   ETL Script │────▶│  Data        │
│  (Fonte)     │     │  (Delta)     │     │  Warehouse   │
└─────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │  WHERE updated_at  │  .etl-state.json
       │  > last_run        │  (watermark)
       └────────────────────┘
```

**Tabelas extraídas:** tenants, users, accounts, contacts, opportunities, resources, projects, slas, proposals, contracts, agent_logs

**Mecanismo:** `updated_at > last_run` com estado persistido em arquivo JSON. Fallback para `created_at` em tabelas sem `updated_at` (ex: agent_logs).

**Roadmap:** Migrar para CDC via Debezium / `pg_recvlogical`.

### 8.2 Views SQL (Camada Semântica)

| View                        | Métricas                                         |
|-----------------------------|--------------------------------------------------|
| `bi_pipeline_overview`      | Oportunidades por estágio, valores, probabilidade |
| `bi_pipeline_velocity`      | Deals ganhos/perdidos por mês, ciclo médio        |
| `bi_stage_duration`         | Dias médios em cada estágio do pipeline            |
| `bi_resource_utilization`   | % utilização de recursos, variação de margem       |
| `bi_sla_health`             | Status de SLAs, dias até renovação                 |
| `bi_account_ltv`            | LTV por conta, oportunidades, projetos             |

### 8.3 Integração BI

- **Looker:** Modelo LookML pronto em `etl/looker-model.lkml`
- **Power BI:** Conexão direta via views SQL ou importação de dados
- **Metabase:** Compatível via conexão PostgreSQL direta

---

## 9. Segurança

### 9.1 Autenticação

- **JWT** com claims customizados: `tenant_id`, `user_role`, `sub` (user_id)
- **Supabase Auth** (opcional) com hook para injetar tenant_id no token
- Fallback para autenticação local (bcrypt + JWT) para desenvolvimento

### 9.2 Isolamento de Dados (RLS)

```sql
-- Toda tabela com RLS habilitado
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policy padrão: tenant_id = JWT tenant
CREATE POLICY "accounts_tenant_select" ON accounts
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());
```

**Tabelas com RLS:** users, accounts, contacts, opportunities, resources, projects, slas, proposals, contracts, agent_logs

### 9.3 RBAC (Controle de Acesso por Perfil)

| Role       | Permissões                                              |
|------------|--------------------------------------------------------|
| `admin`    | Acesso total, gerenciamento de usuários e tenant        |
| `manager`  | CRUD completo, aprovação de propostas e contratos       |
| `engineer` | Leitura de pipeline, escrita em projetos e recursos     |
| `sales`    | CRUD de accounts, contacts, opportunities, propostas    |
| `finance`  | Leitura de analytics, aprovação financeira de contratos |

### 9.4 Audit Trail

Toda execução de agente é registrada na tabela `agent_logs`:

- `agentName` — qual agente executou
- `action` — ação realizada
- `input` / `output` — dados completos (JSONB)
- `tokensUsed` / `latencyMs` — métricas de consumo
- `status` — success / error / timeout
- `errorMessage` — detalhe de falha

---

## 10. Roadmap de Escalabilidade

| Componente Atual          | Evolução Planejada               | Gatilho                           |
|---------------------------|----------------------------------|-----------------------------------|
| Supabase (hosted Postgres)| AWS RDS / Cloud SQL (managed)    | > 100 tenants ou compliance       |
| BullMQ (Redis)            | Temporal.io                       | Workflows complexos, retries      |
| Redis Streams             | Apache Kafka                      | > 10K eventos/sec                 |
| Mock LLM                  | OpenAI GPT-4o / Claude Sonnet    | Produção                          |
| ETL Delta (cron)          | CDC via Debezium                  | Near real-time BI                 |
| Docker Compose            | Kubernetes (EKS/GKE)             | > 5 instâncias                    |
| Assinatura placeholder    | DocuSign / Autentique API         | MVP de assinatura eletrônica      |
| Monolito NestJS           | Microsserviços (se necessário)    | > 500K RPM por módulo             |

---

## Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma ORM](https://www.prisma.io/docs/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [BullMQ](https://docs.bullmq.io/)
