# Guia de Onboarding — CRM BG Tech

> Guia para novos desenvolvedores começarem a contribuir com o projeto.
> Última atualização: Março 2026

---

## 1. Pré-requisitos

| Ferramenta   | Versão Mínima | Verificação               |
|-------------|---------------|--------------------------|
| **Node.js** | 20.0+         | `node --version`         |
| **Docker**  | 24.0+         | `docker --version`       |
| **Docker Compose** | v2+    | `docker compose version` |
| **Git**     | 2.40+         | `git --version`          |
| **npm**     | 10.0+         | `npm --version`          |

### Ferramentas recomendadas (opcionais)

- **VS Code** com extensões: Prisma, ESLint, Tailwind CSS IntelliSense, REST Client
- **jq** — para parsing de JSON no terminal: `brew install jq` ou `apt install jq`
- **Insomnia / Postman** — para testes de API

---

## 2. Quick Start

### 3 Comandos para Começar

```bash
# 1. Clone o repositório
git clone https://github.com/bgtech/crm-bgtech.git
cd crm-bgtech

# 2. Suba a infraestrutura (Postgres, Redis, Backend, Frontend)
docker compose up -d

# 3. Instale dependências, rode migrations e seed
cd painel-crm/packages/backend && npm install && npx prisma migrate dev && npx prisma db seed && cd ../..
```

### O que ficou rodando?

| Serviço    | URL                          | Descrição                    |
|-----------|------------------------------|------------------------------|
| Frontend  | http://localhost:3000        | Interface web Next.js        |
| Backend   | http://localhost:3001        | API REST NestJS              |
| Swagger   | http://localhost:3001/api    | Documentação interativa da API |
| PostgreSQL| localhost:5432               | Banco de dados               |
| Redis     | localhost:6379               | Cache e filas                |

### Dados de Seed

O seed cria automaticamente:

- **2 Tenants:** ACME Corp (professional), Globex Industries (enterprise)
- **4 Usuários:** admin e vendas para cada tenant
- **Contas, contatos, oportunidades e projetos** de exemplo

---

## 3. Acesso à API

### Usuários Padrão (Seed)

| Email              | Senha        | Tenant    | Role     |
|-------------------|-------------|-----------|----------|
| admin@acme.com    | password123 | ACME Corp | admin    |
| vendas@acme.com   | password123 | ACME Corp | sales    |
| admin@globex.com  | password123 | Globex    | admin    |
| eng@globex.com    | password123 | Globex    | engineer |

### Obter JWT

```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}'
```

**Resposta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-001",
    "email": "admin@acme.com",
    "name": "Carlos Admin",
    "role": "admin",
    "tenantId": "tenant-001"
  }
}
```

### Usar o JWT em Chamadas

```bash
# Salvar token em variável
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}' \
  | jq -r '.access_token')

# Listar contas
curl -s http://localhost:3001/api/accounts \
  -H "Authorization: Bearer $TOKEN" | jq

# Listar oportunidades
curl -s http://localhost:3001/api/opportunities \
  -H "Authorization: Bearer $TOKEN" | jq

# KPIs de Analytics
curl -s http://localhost:3001/api/analytics/kpis \
  -H "Authorization: Bearer $TOKEN" | jq

# Executar agente de qualificação
curl -X POST http://localhost:3001/api/agents/qualification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "opportunityId": "opp-t1-001",
    "context": "Lead interessado em plataforma IoT"
  }'
```

---

## 4. Workflow de Desenvolvimento

### 4.1 Backend (NestJS)

```bash
# Navegar para o backend
cd painel-crm/packages/backend

# Copiar variáveis de ambiente
cp .env.example .env

# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate

# Rodar migrations
npx prisma migrate dev

# Executar seed
npx prisma db seed

# Iniciar em modo de desenvolvimento (hot reload)
npm run start:dev

# Rodar testes
npm test

# Rodar lint
npm run lint

# Abrir Prisma Studio (GUI para o banco)
npx prisma studio
```

#### Worker de Agentes (BullMQ)

```bash
# Iniciar o worker de agentes (processa jobs da fila)
npm run start:worker

# Em produção (após build)
npm run start:worker:prod
```

O worker roda como processo separado do servidor NestJS. Ele consome jobs
da fila `agent-jobs` no Redis e executa os agentes LLM. Cada job:
- Define a session `my.tenant` para isolamento RLS
- Executa o agente correspondente (qualification, proposal, risk, churn, negotiation, lead-to-proposal)
- Persiste um `AgentLog` com tokens consumidos, latência e status
- Registra erros em `AgentLog` com `status = 'error'`

#### RLS — Row Level Security

Todas as tabelas com `tenant_id` possuem policies RLS. O `TenantInterceptor`
(global) chama `PrismaSessionService.setTenant()` antes de cada request,
injecting `SET LOCAL my.tenant = '<tenantId>'`.

Para testar o isolamento:

```bash
npx jest test/rls/rls.spec.ts --runInBand
```

#### Budget / Custo LLM

O `BudgetMiddleware` (aplicado em `POST /agents/*`) verifica o gasto
acumulado por tenant. Quando ultrapassa `LLM_MONTHLY_BUDGET_USD` (default: $50),
retorna HTTP 402 Payment Required.

#### Métricas e Health

```bash
# Prometheus metrics
curl http://localhost:3001/api/metrics

# Health check
curl http://localhost:3001/api/health
```

### 4.2 Frontend (Next.js)

```bash
# Navegar para o frontend
cd painel-crm/apps/frontend

# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar lint
npm run lint
```

### 4.3 Adicionando um Novo Módulo (Backend)

1. **Gere o módulo NestJS:**

```bash
cd painel-crm/packages/backend
npx nest generate module nome-modulo
npx nest generate controller nome-modulo
npx nest generate service nome-modulo
```

2. **Atualize o schema Prisma** em `prisma/schema.prisma`

3. **Crie a migration:**

```bash
npx prisma migrate dev --name add_nome_modulo
```

4. **Registre no AppModule** em `src/app.module.ts`

5. **Adicione testes** no arquivo `*.spec.ts`

### 4.4 Adicionando uma Página (Frontend)

1. Crie a pasta em `painel-crm/apps/frontend/src/app/nome-pagina/`
2. Crie `page.tsx` com o componente
3. Adicione link no sidebar em `src/components/`

---

## 5. Comandos Úteis

### Raiz do Projeto

| Comando                 | Descrição                                     |
|------------------------|-----------------------------------------------|
| `npm run dev`          | Sobe toda a stack via Docker Compose           |
| `npm run dev:backend`  | Roda backend em dev mode (hot reload)          |
| `npm run dev:frontend` | Roda frontend em dev mode (hot reload)         |
| `npm run build`        | Build backend + frontend                       |
| `npm test`             | Roda todos os testes                           |
| `npm run lint`         | Roda lint em todos os pacotes                  |
| `npm run migrate:dev`  | Roda Prisma migrate dev                        |
| `npm run seed`         | Executa seed do banco                          |
| `npm run db:studio`    | Abre Prisma Studio                             |
| `npm run docker:up`    | Docker compose up                              |
| `npm run docker:down`  | Docker compose down                            |

### Makefile

| Comando            | Descrição                                     |
|-------------------|-----------------------------------------------|
| `make dev`        | Docker compose up + log de URLs                |
| `make build`      | Build backend + frontend                       |
| `make test`       | Roda todos os testes                           |
| `make lint`       | Lint em todos os pacotes                       |
| `make migrate`    | Prisma migrate dev                             |
| `make seed`       | Prisma db seed                                 |
| `make docker-up`  | Docker compose up --build                      |
| `make docker-down`| Docker compose down -v                         |

### Banco de Dados

| Comando                                        | Descrição                          |
|-----------------------------------------------|------------------------------------|
| `npx prisma migrate dev --name descricao`     | Criar nova migration                |
| `npx prisma migrate deploy`                   | Aplicar migrations (produção)       |
| `npx prisma db seed`                          | Executar seed                       |
| `npx prisma studio`                           | GUI web para explorar dados         |
| `npx prisma generate`                         | Regenerar Prisma Client             |
| `npx prisma db push`                          | Push schema sem migration           |

---

## 6. Estrutura do Projeto

```
crm-bgtech/
├── apps/
│   └── frontend/           # Next.js 14 (App Router)
│       └── src/
│           ├── app/        # Rotas (dashboard, pipeline, proposals, etc.)
│           ├── components/  # Componentes React
│           ├── hooks/       # Custom hooks
│           ├── lib/         # Utilitários
│           └── types/       # TypeScript types
├── packages/
│   └── backend/            # NestJS API
│       ├── prisma/
│       │   ├── schema.prisma  # Modelo de dados (11 entidades)
│       │   ├── migrations/    # Database migrations
│       │   └── seeds/         # Seed data
│       └── src/
│           ├── accounts/      # Módulo de contas
│           ├── agents/        # 5 agentes de IA + adapters
│           ├── analytics/     # KPIs e dashboards
│           ├── auth/          # Autenticação JWT
│           ├── contacts/      # Módulo de contatos
│           ├── contracts/     # CLM (contratos)
│           ├── common/        # Guards, decorators, Prisma
│           ├── opportunities/ # Pipeline de vendas
│           ├── projects/      # Gestão de projetos
│           ├── proposals/     # Propostas técnicas
│           ├── resources/     # Recursos (equipe)
│           ├── sla/           # Gestão de SLAs
│           └── tenants/       # Multi-tenancy
├── etl/                    # ETL pipeline + BI views
├── infra/                  # Docker, Terraform, Supabase
├── sql/                    # RLS policies
├── ops/                    # Scripts operacionais
├── docs/                   # Documentação
├── painel-crm/docker-compose.yaml     # Stack completa
├── Makefile               # Comandos úteis
└── package.json           # Scripts raiz
```

---

## 7. Solução de Problemas

### Porta já em uso

```bash
# Verificar quem está usando a porta
lsof -i :3001
# Matar o processo
kill -9 <PID>
```

### Banco não conecta

```bash
# Verificar se Postgres está rodando
docker compose ps
# Verificar logs
docker compose logs postgres
# Recriar containers
docker compose down -v && docker compose up -d
```

### Prisma Client desatualizado

```bash
cd painel-crm/packages/backend
npx prisma generate
```

### Limpar e recomeçar

```bash
# Derrubar tudo e limpar volumes
docker compose down -v
# Subir do zero
docker compose up -d --build
# Re-rodar migrations e seed
cd painel-crm/packages/backend && npx prisma migrate dev && npx prisma db seed
```
