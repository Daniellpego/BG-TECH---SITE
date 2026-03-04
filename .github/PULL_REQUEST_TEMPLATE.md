## Descrição

<!-- Descreva brevemente o que esta PR faz -->

## Tipo de Mudança

- [ ] feat: nova funcionalidade
- [ ] fix: correção de bug
- [ ] refactor: refatoração sem mudança funcional
- [ ] chore: manutenção / tooling
- [ ] docs: documentação
- [ ] ci: mudança em CI/CD
- [ ] ops: operações / infra

## Checklist

### Geral
- [ ] Código segue os padrões do projeto (ESLint passa)
- [ ] Commit messages seguem Conventional Commits
- [ ] Testes unitários adicionados/atualizados
- [ ] Documentação atualizada (se aplicável)

### RLS / Multi-tenant
- [ ] Novos modelos têm `tenant_id` e `@@index([tenantId])`
- [ ] RLS policies adicionadas em `sql/rls-policies.sql`
- [ ] `PrismaSessionService.setTenant()` chamado via `TenantInterceptor`
- [ ] RLS smoke test (`test/rls/rls.spec.ts`) passa com as novas tabelas

### Agentes LLM
- [ ] JSON-schema adicionado em `src/agents/prompts/`
- [ ] Worker implementado em `agent-worker-runner.ts`
- [ ] `AgentLog` persistido (sucesso E erro)
- [ ] Budget check funciona (402 quando excede)
- [ ] Mock adapter funciona sem API keys

### Infraestrutura
- [ ] Docker compose levanta sem erros
- [ ] Migrations rodam sem conflito (`prisma migrate deploy`)
- [ ] `.env.example` atualizado com novas variáveis

## Screenshots / Logs

<!-- Se aplicável, cole screenshots ou logs relevantes -->

## Notas para reviewer

<!-- Qualquer contexto adicional para facilitar a revisão -->
