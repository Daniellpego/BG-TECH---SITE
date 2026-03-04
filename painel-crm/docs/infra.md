# Infraestrutura — CRM BG Tech

> Guia de infraestrutura: Docker Compose, Terraform, Supabase, GitHub Actions CI, Dependabot.
> Última atualização: Março 2026

---

## 1. Docker Compose (Desenvolvimento Local)

### Arquitetura

```
┌──────────────────────────────────────────────────────┐
│                  painel-crm/docker-compose.yaml                  │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ postgres │  │  redis   │  │ backend  │           │
│  │ :5432    │  │  :6379   │  │  :3001   │           │
│  │ PG 16    │  │  Redis 7 │  │  NestJS  │           │
│  └──────────┘  └──────────┘  └────┬─────┘           │
│       ▲              ▲              │                 │
│       │              │              │ depends_on      │
│       │              │              ▼                 │
│       │              │         ┌──────────┐          │
│       │              │         │ frontend │          │
│       │              │         │  :3000   │          │
│       │              │         │  Next.js │          │
│       │              │         └──────────┘          │
│       │              │                               │
│  ┌────▼──────────────▼───────────────────────┐       │
│  │         pgdata (volume persistente)        │       │
│  └────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────┘
```

### Serviços

| Serviço    | Imagem                | Porta  | Healthcheck                      |
|-----------|----------------------|--------|----------------------------------|
| postgres  | postgres:16-alpine   | 5432   | `pg_isready -U crm -d crm_bgtech` |
| redis     | redis:7-alpine       | 6379   | `redis-cli ping`                  |
| backend   | Custom (Dockerfile)  | 3001   | Depends on postgres + redis       |
| frontend  | Custom (Dockerfile)  | 3000   | Depends on backend                |

### Variáveis de Ambiente

```yaml
# Backend
DATABASE_URL: postgresql://crm:crm_secret_2026@postgres:5432/crm_bgtech
REDIS_URL: redis://redis:6379
JWT_SECRET: dev-jwt-secret-change-in-production
LLM_PROVIDER: mock
PORT: 3001
FRONTEND_URL: http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL: http://localhost:3001/api
```

### Comandos

```bash
# Subir toda a stack
docker compose up -d

# Subir com rebuild
docker compose up -d --build

# Ver logs
docker compose logs -f backend
docker compose logs -f postgres

# Derrubar tudo (preservar dados)
docker compose down

# Derrubar tudo (apagar volumes)
docker compose down -v

# Acessar o banco via psql
docker compose exec postgres psql -U crm -d crm_bgtech
```

### Dockerfiles

#### Backend (`infra/docker/Dockerfile.backend`)

- Base: Node.js 20 Alpine
- Build: `npm ci` → `npx prisma generate` → `npm run build`
- Runtime: Distroless ou Alpine com apenas `dist/`

#### Frontend (`infra/docker/Dockerfile.frontend`)

- Base: Node.js 20 Alpine
- Build: `npm ci` → `npm run build`
- Runtime: Next.js standalone output

---

## 2. Terraform (Template Cloud)

### Localização

```
infra/terraform/main.tf
```

### Status

Template base — requer customização para o provedor cloud desejado.

### Variáveis

| Variável       | Default       | Descrição                     |
|---------------|---------------|-------------------------------|
| `project_name`| crm-bgtech    | Nome do projeto               |
| `environment` | staging        | Ambiente (staging/production) |
| `region`      | us-east-1      | Região cloud                  |
| `db_password` | (sensitive)    | Senha do banco                |

### Arquitetura Recomendada (Cloud)

```
┌─────────────────────────────────────────────────────┐
│                    Cloud Provider                     │
│                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │  Vercel  │    │ECS Fargate│   │Supabase  │       │
│  │ Frontend │    │ Backend   │   │ Postgres │       │
│  │  (CDN)   │───▶│ (NestJS) │───▶│  + Auth  │       │
│  └──────────┘    └─────┬────┘    └──────────┘       │
│                        │                              │
│                   ┌────▼─────┐                        │
│                   │ Upstash  │                        │
│                   │  Redis   │                        │
│                   └──────────┘                        │
└─────────────────────────────────────────────────────┘
```

### Opções de Deploy

| Componente | Opção 1 (Simples) | Opção 2 (Enterprise) |
|------------|-------------------|---------------------|
| Frontend   | Vercel            | CloudFront + S3     |
| Backend    | Fly.io / Railway  | ECS Fargate / EKS   |
| Postgres   | Supabase          | RDS / Cloud SQL     |
| Redis      | Upstash           | ElastiCache         |

---

## 3. Supabase Setup

### Localização

```
infra/supabase/setup.sql
```

### O que o setup configura

1. **Extensões** — `uuid-ossp`, `pgcrypto`
2. **Custom Access Token Hook** — Injeta `tenant_id` e `user_role` nos claims do JWT
3. **Permissões** — Grants para `supabase_auth_admin`
4. **RLS Policies** — Referência para `sql/rls-policies.sql`

### Fluxo de Autenticação com Supabase

```
Usuário → Login → Supabase Auth → custom_access_token_hook()
                                        │
                                  ┌─────▼──────────┐
                                  │ SELECT tenant_id│
                                  │ FROM users      │
                                  │ WHERE id = uid  │
                                  └─────┬──────────┘
                                        │
                                  JWT com claims:
                                  {
                                    "tenant_id": "t-001",
                                    "user_role": "admin"
                                  }
```

### RLS Policies

Arquivo: `sql/rls-policies.sql`

Tabelas protegidas com RLS:
- users
- accounts
- contacts
- opportunities
- resources
- projects
- slas
- proposals
- contracts
- agent_logs

Cada tabela possui policies para SELECT, INSERT, UPDATE e DELETE verificando `tenant_id = get_current_tenant_id()`.

### Como Aplicar

```bash
# Via Supabase Dashboard → SQL Editor:
# 1. Execute infra/supabase/setup.sql
# 2. Execute sql/rls-policies.sql

# Ou via CLI:
supabase db push
```

---

## 4. GitHub Actions CI

### Localização

```
.github/workflows/ci.yml
```

### Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Push /  │────▶│ Lint &   │────▶│ Build Docker │
│   PR     │     │  Test    │     │   Images     │
└──────────┘     └──────────┘     └──────────────┘
                       │                  │
                       │                  │ (only main)
                 ┌─────▼───────┐    ┌────▼─────────┐
                 │  Services:  │    │  Push to     │
                 │  postgres   │    │  Registry    │
                 │  redis      │    └──────────────┘
                 └─────────────┘
```

### Job: lint-and-test

| Step                    | Descrição                                    |
|------------------------|----------------------------------------------|
| Checkout               | `actions/checkout@v4`                        |
| Setup Node.js          | Node 20 com cache de npm                     |
| Install Backend Deps   | `npm ci` no backend                          |
| Generate Prisma Client | `npx prisma generate`                        |
| Run Migrations         | `npx prisma migrate deploy` (banco de teste) |
| Lint Backend           | `npm run lint`                               |
| Test Backend           | `npm test` com LLM_PROVIDER=mock             |
| Install Frontend Deps  | `npm ci` no frontend                         |
| Lint Frontend          | `npm run lint`                               |
| Build Frontend         | `npm run build`                              |

### Job: build-docker

- **Trigger:** Apenas push na branch `main`
- **Depends on:** lint-and-test
- Builda imagens Docker do backend e frontend

### Services (Containers de Teste)

| Serviço    | Imagem              | Porta |
|-----------|---------------------|-------|
| postgres  | postgres:16-alpine  | 5432  |
| redis     | redis:7-alpine      | 6379  |

### Variáveis de Ambiente de Teste

```yaml
DATABASE_URL: postgresql://crm:test_password@localhost:5432/crm_bgtech_test
REDIS_URL: redis://localhost:6379
JWT_SECRET: test-secret
LLM_PROVIDER: mock
```

---

## 5. Dependabot

### Localização

```
.github/dependabot.yml
```

### Configuração

| Ecossistema      | Diretório            | Frequência | Limite de PRs | Labels                  |
|-----------------|---------------------|-----------|---------------|-------------------------|
| npm (backend)    | `/painel-crm/packages/backend`  | Semanal   | 5             | dependencies, backend   |
| npm (frontend)   | `/painel-crm/apps/frontend`     | Semanal   | 5             | dependencies, frontend  |
| Docker           | `/infra/docker`      | Mensal    | 5             | dependencies, infra     |
| GitHub Actions   | `/`                  | Semanal   | 5             | dependencies, ci        |

### Workflow de Atualização

1. Dependabot cria PR com atualização de dependência
2. CI roda automaticamente (lint + test)
3. Se CI passa, desenvolvedor faz review e merge
4. Labels automáticas facilitam triagem

---

## 6. Checklist de Deploy em Produção

- [ ] Trocar `JWT_SECRET` para um valor seguro
- [ ] Configurar `LLM_PROVIDER` para `openai` ou `anthropic`
- [ ] Configurar `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY`
- [ ] Usar banco PostgreSQL managed (Supabase / RDS)
- [ ] Configurar Redis managed (Upstash / ElastiCache)
- [ ] Aplicar RLS policies no banco de produção
- [ ] Configurar HTTPS / domínio customizado
- [ ] Configurar backup automático do banco
- [ ] Configurar monitoramento (logs, métricas, alertas)
- [ ] Revisar CORS e `FRONTEND_URL`
- [ ] Configurar rate limiting para endpoints de agentes
