# Ultra-Prompt — CRM BG Tech

> Este arquivo contém o prompt completo utilizado para gerar o repositório `crm-bgtech`.
> Pode ser reutilizado para regenerar, estender ou adaptar o projeto.

---

## Contexto

CRM proprietário como vantagem competitiva para BG Tech. Arquitetura com separação entre **Registro** (Accounts, Contacts, Opportunities), **Engajamento** (Agents, Proposals, CLM) e **Inteligência** (Analytics, KPIs, BI).

**Stack recomendado:**
- PostgreSQL + JSONB, Supabase para aceleração e RLS
- Node.js / NestJS para backend
- Next.js + Tailwind CSS para frontend
- Multi-tenancy com RLS (Row Level Security)
- Agentes multi-agentes: Qualificação, Proposta, Risco, Prevenção de Churn, Negociação AI-to-AI
- Automação de Quote-to-Contract (CLM) combinando IA generativa com verificadores determinísticos
- Integração BI (Looker/Power BI) e ETL incremental
- KPIs de engenharia de receita
- Memórias organizacionais e Answer Engine Optimization

---

## Requisitos Obrigatórios

- **Linguagens:** TypeScript para backend e frontend
- **Backend:** NestJS (Node.js)
- **Frontend:** Next.js (React) + Tailwind CSS
- **DB:** PostgreSQL (relacional + JSONB); Supabase (auth + RLS)
- **ORM:** Prisma
- **Agentes/LLMs:** LangChain / adaptadores para OpenAI/Anthropic
- **Workers:** BullMQ (Redis) para MVP
- **Multi-tenancy:** Shared DB + RLS
- **CI/CD:** GitHub Actions
- **Infra:** docker-compose para dev; Terraform/Supabase para staging/prod
- **Observabilidade:** logs estruturados (pino), métricas (Prometheus)
- **Segurança:** JWT (Supabase Auth), RLS, Dependabot

---

## Entregáveis

1. Repositório `crm-bgtech` com scaffold completo
2. Backend NestJS com módulos: auth, tenants, accounts, contacts, opportunities, resources, projects, sla, proposals, contracts, agents, analytics
3. Prisma migrations + seeds (2 tenants, 3 oportunidades cada)
4. RLS SQL scripts
5. Frontend Next.js com dashboard, pipeline, opportunities, projects, SLA, proposals
6. 5 Agentes de IA com prompt templates e testes
7. CLM: gerador LLM + verificador determinístico
8. ETL/BI: pipeline incremental + views SQL + modelo Looker
9. Docker Compose + GitHub Actions CI
10. Testes unitários + E2E
11. Documentação: arch.md, agent-guides.md, onboarding.md, infra.md

---

## Critérios de Aceite

- Backend expõe OpenAPI para CRUD de Accounts, Contacts, Opportunities, Projects, SLAs, Proposals
- RLS ativa e testada com 2 tenants (sem leak cross-tenant)
- Fluxo lead → qualification → proposal automático via API
- Painel com KPIs: Pipeline Velocity, Stage Duration, Resource Utilization, Project Margin Variance, LTV, Net Churn Rate
- Testes unitários e E2E cobrindo fluxos principais
- Documentação para levantar ambiente com `docker compose up`

---

## Modelo de Dados

```prisma
// 11 entidades: Tenant, User, Account, Contact, Opportunity, Resource,
// Project, SLA, Proposal, Contract, AgentLog
// Ver prisma/schema.prisma para o modelo completo
```

---

## RLS (Exemplo)

```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON accounts
FOR SELECT TO authenticated
USING (tenant_id = public.get_current_tenant_id());
```

---

## Prompts dos Agentes

### Qualification Agent
```
SYSTEM: Você é um Agente de Qualificação técnico para BG Tech.
Extraia: BANT, requisitos, componentes existentes, sinais de intenção.
Retorne JSON: { budget_estimate, decision_makers, must_have_reqs[], risk_flags[], recommended_next_steps[], initial_effort_hours }
```

### Proposal Agent
```
SYSTEM: Gere proposta técnica com arquitetura, breakdown de esforço, riscos, cronograma e investimento em Markdown.
```

### Risk Agent
```
SYSTEM: Avalie margem e risco do deal. Retorne score (0-100), pontos de atenção, escalação necessária.
```

---

## Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/login | Login JWT |
| GET | /api/accounts | Listar contas |
| POST | /api/agents/lead-to-proposal | Pipeline completo |
| POST | /api/agents/qualification | Qualificação de lead |
| POST | /api/agents/proposal | Gerar proposta |
| POST | /api/agents/risk | Avaliação de risco |
| GET | /api/analytics/kpis | KPIs agregados |
| POST | /api/clm/proposals/generate | Gerar proposta CLM |
| POST | /api/clm/contracts/generate | Gerar contrato |

---

## Instruções de Reuso

Para regenerar o projeto a partir deste prompt:

1. Copie este arquivo para um novo workspace
2. Instrua o agente a criar o repositório seguindo os requisitos
3. Ajuste variáveis de ambiente conforme `.env.example`
4. Execute `docker compose up` para levantar o ambiente

Para estender:
- Adicione novos agentes em `painel-crm/packages/backend/src/agents/`
- Adicione novas entidades no Prisma schema
- Crie novas páginas em `painel-crm/apps/frontend/src/app/`
