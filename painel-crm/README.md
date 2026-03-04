# CRM BG Tech

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D20-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

> **CRM proprietário da BG Tech** — sistema de gestão de relacionamento com clientes especializado em **software sob demanda** e **serviços profissionais de TI**, com agentes de IA integrados para qualificação de leads, geração de propostas e análise de risco.

---

## Funcionalidades

- **Pipeline de Vendas** — Oportunidades com estágios (lead → qualified → proposal → negotiation → closed_won/lost)
- **Gestão de Contas e Contatos** — Empresas, contatos, indústria, receita, metadados JSONB
- **5 Agentes de IA** — Qualificação, Proposta, Risco, Churn, Negociação
- **Pipeline Automatizado** — Lead → Qualificação → Proposta → Risco em uma chamada
- **Propostas Técnicas** — Geração automática em Markdown via LLM
- **CLM (Contratos)** — Ciclo de vida de contratos com verificação determinística
- **Gestão de Projetos** — Projetos, milestones, horas, margem
- **Gestão de SLAs** — Tiers (Gold/Silver/Bronze), métricas, renovação
- **Gestão de Recursos** — Equipe, custos, skills, disponibilidade
- **Analytics / KPIs** — Pipeline Velocity, Stage Duration, Utilization, Margin Variance, LTV, Churn Rate
- **ETL / BI** — Extração incremental, views SQL semânticas, modelo Looker
- **Multi-Tenancy** — Shared DB + RLS com isolamento por tenant_id
- **RBAC** — 5 perfis: admin, manager, engineer, sales, finance
- **Audit Trail** — Logs completos de execução dos agentes

---

## Stack Tecnológica

| Camada        | Tecnologia             | Versão    |
|--------------|------------------------|-----------|
| Backend       | NestJS (TypeScript)    | 10.x      |
| Frontend      | Next.js (App Router)   | 14.x      |
| Banco de Dados| PostgreSQL + JSONB     | 16        |
| ORM           | Prisma                 | 5.x       |
| Auth          | JWT + Supabase Auth    | —         |
| Filas/Cache   | Redis + BullMQ         | 7.x       |
| LLM           | OpenAI / Anthropic / Mock | —      |
| CI/CD         | GitHub Actions         | —         |
| Infra         | Docker Compose / Terraform | —     |

---

## Quick Start

```bash
# 1. Clone e suba a stack
git clone https://github.com/bgtech/crm-bgtech.git && cd crm-bgtech

# 2. Suba infraestrutura (Postgres, Redis, Backend, Frontend)
docker compose up -d

# 3. Instale deps, rode migrations e seed
cd painel-crm/packages/backend && npm install && npx prisma migrate dev && npx prisma db seed
```

**Acesse:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Login: `admin@acme.com` / `password123`

---

## Arquitetura

```
Frontend (Next.js)  ──REST──▶  Backend (NestJS)  ──Prisma──▶  PostgreSQL
                                    │                              │
                                    ├── Agents (LLM Adapters)      │── RLS Policies
                                    ├── Analytics (KPIs)           │── JSONB Fields
                                    └── Redis (BullMQ)             └── Multi-tenant
```

Documentação completa: [docs/arch.md](docs/arch.md)

---

## Endpoints da API

### Autenticação

| Método | Endpoint              | Descrição                  |
|--------|-----------------------|----------------------------|
| POST   | `/api/auth/login`     | Login → JWT token          |
| POST   | `/api/auth/register`  | Registro de novo usuário   |

### Entidades (CRUD)

| Método | Endpoint                | Descrição                   |
|--------|-------------------------|-----------------------------|
| GET    | `/api/accounts`         | Listar contas               |
| POST   | `/api/accounts`         | Criar conta                 |
| GET    | `/api/accounts/:id`     | Detalhes da conta           |
| PUT    | `/api/accounts/:id`     | Atualizar conta             |
| DELETE | `/api/accounts/:id`     | Excluir conta               |
| GET    | `/api/contacts`         | Listar contatos             |
| POST   | `/api/contacts`         | Criar contato               |
| GET    | `/api/opportunities`    | Listar oportunidades        |
| POST   | `/api/opportunities`    | Criar oportunidade          |
| GET    | `/api/resources`        | Listar recursos             |
| POST   | `/api/resources`        | Criar recurso               |
| GET    | `/api/projects`         | Listar projetos             |
| POST   | `/api/projects`         | Criar projeto               |
| GET    | `/api/slas`             | Listar SLAs                 |
| POST   | `/api/slas`             | Criar SLA                   |
| GET    | `/api/proposals`        | Listar propostas            |
| GET    | `/api/contracts`        | Listar contratos            |

### Agentes de IA

| Método | Endpoint                         | Descrição                                |
|--------|----------------------------------|------------------------------------------|
| POST   | `/api/agents/qualification`      | Qualificar lead (BANT + scoring)         |
| POST   | `/api/agents/proposal`           | Gerar proposta técnica em Markdown       |
| POST   | `/api/agents/risk`               | Avaliar risco e margem do deal           |
| POST   | `/api/agents/churn`              | Analisar risco de churn de conta         |
| POST   | `/api/agents/negotiation`        | Preparar estratégia de negociação        |
| POST   | `/api/agents/lead-to-proposal`   | Pipeline completo: Lead → Proposta → Risco|
| POST   | `/api/agents/:agentName/run`     | Execução genérica de agente              |

### Analytics

| Método | Endpoint                | Descrição                                  |
|--------|-------------------------|--------------------------------------------|
| GET    | `/api/analytics/kpis`   | Todos os KPIs agregados                    |
| GET    | `/api/analytics/pipeline`| Pipeline overview por estágio             |
| GET    | `/api/analytics/revenue`| Revenue overview (últimos 12 meses)        |

---

## Exemplo: Agentes de IA

```bash
# Obter token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}' \
  | jq -r '.access_token')

# Pipeline completo: Lead → Qualificação → Proposta → Risco
curl -X POST http://localhost:3001/api/agents/lead-to-proposal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "accountId": "acc-t1-001",
    "title": "Plataforma IoT Industrial",
    "description": "Dashboard SCADA real-time com alertas",
    "value": 200000,
    "source": "inbound",
    "context": "CTO precisa de monitoramento IoT. Budget R$200K. Timeline: Q2 2026."
  }'
```

Documentação completa dos agentes: [docs/agent-guides.md](docs/agent-guides.md)

---

## KPIs Implementados

| KPI                       | Descrição                                      | Endpoint                   |
|---------------------------|-------------------------------------------------|----------------------------|
| Pipeline Velocity         | Receita/dia baseada em deals fechados (30 dias) | `GET /api/analytics/kpis`  |
| Stage Duration            | Dias médios por estágio do pipeline              | `GET /api/analytics/kpis`  |
| Resource Utilization      | % horas reais vs. orçadas em projetos ativos     | `GET /api/analytics/kpis`  |
| Project Margin Variance   | Desvio de margem (estimada vs. real)             | `GET /api/analytics/kpis`  |
| LTV (Lifetime Value)      | Receita média × tempo de vida médio da conta     | `GET /api/analytics/kpis`  |
| Net Churn Rate            | % contas perdidas nos últimos 12 meses           | `GET /api/analytics/kpis`  |

---

## Estrutura do Projeto

```
crm-bgtech/
├── apps/
│   └── frontend/              # Next.js 14 (App Router + Tailwind)
│       └── src/
│           ├── app/           # Rotas: dashboard, pipeline, proposals, projects, sla
│           ├── components/    # Componentes React reutilizáveis
│           ├── hooks/         # Custom hooks
│           ├── lib/           # Utilitários e clients
│           └── types/         # TypeScript types
├── packages/
│   └── backend/               # NestJS API
│       ├── prisma/
│       │   ├── schema.prisma  # 11 entidades + multi-tenancy
│       │   ├── migrations/    # Database migrations
│       │   └── seeds/         # Seed data (2 tenants, 4 users, etc.)
│       └── src/
│           ├── accounts/      # CRUD de contas
│           ├── agents/        # 5 agentes de IA + LLM adapters
│           │   ├── adapters/  # Mock, OpenAI, Anthropic
│           │   └── prompts.ts # Templates de prompts
│           ├── analytics/     # KPIs e dashboards
│           ├── auth/          # JWT auth (login/register)
│           ├── common/        # Guards, decorators, Prisma service
│           ├── contacts/      # CRUD de contatos
│           ├── contracts/     # CLM (contratos)
│           ├── opportunities/ # Pipeline de vendas
│           ├── projects/      # Gestão de projetos
│           ├── proposals/     # Propostas técnicas
│           ├── resources/     # Recursos (equipe/custos)
│           ├── sla/           # Gestão de SLAs
│           └── tenants/       # Multi-tenancy
├── etl/                       # ETL pipeline + BI views + Looker model
├── infra/
│   ├── docker/                # Dockerfiles (backend + frontend)
│   ├── supabase/              # Setup SQL para Supabase
│   └── terraform/             # Template Terraform (cloud)
├── sql/                       # RLS policies
├── ops/                       # Scripts de deploy e operações
├── docs/                      # Documentação detalhada
│   ├── arch.md                # Arquitetura
│   ├── agent-guides.md        # Guia dos agentes
│   ├── onboarding.md          # Onboarding de desenvolvedores
│   └── infra.md               # Infraestrutura
├── .github/
│   ├── workflows/ci.yml       # GitHub Actions CI
│   └── dependabot.yml         # Atualizações automáticas
├── painel-crm/docker-compose.yaml        # Stack completa para dev
├── Makefile                   # Comandos úteis
├── CONTRIBUTING.md            # Guia de contribuição
└── LICENSE                    # MIT
```

---

## Documentação

| Documento                                  | Conteúdo                               |
|-------------------------------------------|----------------------------------------|
| [docs/arch.md](docs/arch.md)              | Arquitetura detalhada                  |
| [docs/agent-guides.md](docs/agent-guides.md) | Guia completo dos 5 agentes         |
| [docs/onboarding.md](docs/onboarding.md)  | Onboarding de novos devs              |
| [docs/infra.md](docs/infra.md)            | Docker, Terraform, CI, Supabase        |
| [CONTRIBUTING.md](CONTRIBUTING.md)         | Como contribuir                        |

---

## Licença

[MIT](LICENSE) — Copyright (c) 2026 BG Tech
