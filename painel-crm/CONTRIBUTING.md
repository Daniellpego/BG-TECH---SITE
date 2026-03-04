# Contribuição — CRM BG Tech

Obrigado pelo interesse em contribuir com o CRM BG Tech! Este guia descreve o fluxo de trabalho para contribuições.

---

## Fluxo de Contribuição

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone o seu fork
git clone https://github.com/SEU-USUARIO/crm-bgtech.git
cd crm-bgtech
```

### 2. Configurar Upstream

```bash
git remote add upstream https://github.com/bgtech/crm-bgtech.git
git fetch upstream
```

### 3. Criar Branch

Sempre crie branches a partir de `develop`:

```bash
git checkout develop
git pull upstream develop
git checkout -b tipo/descricao-curta
```

**Convenção de branches:**

| Prefixo     | Uso                              | Exemplo                         |
|-------------|----------------------------------|---------------------------------|
| `feat/`     | Nova funcionalidade               | `feat/agent-pricing`            |
| `fix/`      | Correção de bug                  | `fix/rls-policy-contacts`       |
| `docs/`     | Documentação                     | `docs/api-examples`             |
| `refactor/` | Refatoração sem mudança funcional | `refactor/agents-service`       |
| `test/`     | Adição/melhoria de testes         | `test/churn-agent-edge-cases`   |
| `chore/`    | Tarefas de manutenção            | `chore/update-dependencies`     |

### 4. Desenvolver

```bash
# Subir a stack local
docker compose up -d

# Fazer alterações
# Rodar testes
cd painel-crm/packages/backend && npm test
cd painel-crm/apps/frontend && npm run lint

# Commitar (veja convenção abaixo)
git add .
git commit -m "feat(agents): add pricing estimation agent"
```

### 5. Push e Pull Request

```bash
git push origin feat/agent-pricing
```

1. Abra um Pull Request no GitHub contra a branch `develop`
2. Preencha o template do PR com:
   - **Descrição** do que foi feito
   - **Screenshots** (se tiver mudanças de UI)
   - **Como testar** as alterações
3. Aguarde o CI passar
4. Solicite review de pelo menos 1 mantenedor

### 6. Após Merge

```bash
git checkout develop
git pull upstream develop
git branch -d feat/agent-pricing
```

---

## Conventional Commits

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit padronizadas.

### Formato

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[footer opcional]
```

### Tipos Permitidos

| Tipo       | Descrição                                    |
|-----------|----------------------------------------------|
| `feat`    | Nova funcionalidade                           |
| `fix`     | Correção de bug                              |
| `docs`    | Alterações em documentação                    |
| `style`   | Formatação, ponto-e-vírgula (sem mudança de código) |
| `refactor`| Refatoração sem mudança funcional             |
| `test`    | Adição ou correção de testes                  |
| `chore`   | Manutenção, build, CI                        |
| `perf`    | Melhoria de performance                       |
| `ci`      | Mudanças em CI/CD                            |

### Escopos Comuns

| Escopo          | Módulo                      |
|-----------------|-----------------------------|
| `agents`        | Agentes de IA               |
| `accounts`      | Módulo de contas            |
| `auth`          | Autenticação                |
| `analytics`     | Analytics / KPIs            |
| `contracts`     | CLM / Contratos             |
| `proposals`     | Propostas                   |
| `opportunities` | Pipeline de vendas          |
| `frontend`      | Interface web               |
| `infra`         | Docker, Terraform, CI       |
| `prisma`        | Schema, migrations          |

### Exemplos

```bash
feat(agents): add pricing estimation agent
fix(auth): correct JWT tenant extraction for Supabase
docs(api): add curl examples for all endpoints
refactor(proposals): extract validation to separate service
test(agents): add edge cases for churn probability
chore(deps): update prisma to 5.x
perf(analytics): optimize KPI queries with indexes
ci: add e2e test stage to pipeline
```

### Breaking Changes

Para mudanças que quebram compatibilidade, adicione `!` após o tipo:

```bash
feat(auth)!: migrate from session to JWT-only auth

BREAKING CHANGE: Session-based auth removed. All clients must use Bearer token.
```

---

## Padrões de Código

### Geral

- **TypeScript** em todo o projeto (strict mode)
- **ESLint** configurado — rode `npm run lint` antes de commitar
- **Prettier** para formatação automática
- Nomes de variáveis e funções em **camelCase**
- Nomes de classes em **PascalCase**
- Interfaces com prefixo descritivo (ex: `LlmAdapter`, `AgentRunResult`)

### Backend (NestJS)

- Um módulo por entidade/feature
- Controllers apenas recebem/retornam — lógica no Service
- Use decorators para auth: `@UseGuards(JwtAuthGuard)`, `@CurrentTenant()`
- Tudo tenant-scoped: sempre filtrar por `tenantId`
- Swagger decorators em todos os endpoints

### Frontend (Next.js)

- App Router (não Pages Router)
- Componentes em `src/components/`
- Hooks customizados em `src/hooks/`
- Tailwind CSS para estilização
- Tipagem em `src/types/`

### Testes

- Testes unitários com Jest
- Nome do arquivo: `*.spec.ts`
- Mock de dependências externas (LLM, banco)
- Testes de agentes usam `MockLlmAdapter`

### Banco de Dados

- Prisma para todo acesso ao banco
- Migrations nomeadas descritivamente: `--name add_pricing_field`
- JSONB para dados semi-estruturados
- Sempre incluir `tenant_id` em novas tabelas
- Criar RLS policies para novas tabelas

---

## Revisão de Código

### O que esperamos em um PR

- [ ] Testes passando (`npm test`)
- [ ] Lint passando (`npm run lint`)
- [ ] Commits seguindo Conventional Commits
- [ ] Novas funcionalidades com testes
- [ ] Endpoints com decorators Swagger
- [ ] Documentação atualizada (se aplicável)

### Critérios de Aprovação

- Pelo menos 1 aprovação de mantenedor
- CI verde
- Sem conflitos com `develop`

---

## Reportando Issues

Use as templates do GitHub para reportar:

- **Bug Report** — Descreva: o que aconteceu, o que esperava, como reproduzir
- **Feature Request** — Descreva: problema, solução proposta, alternativas consideradas

---

## Dúvidas?

Abra uma issue com a tag `question` ou entre em contato com a equipe de desenvolvimento.
