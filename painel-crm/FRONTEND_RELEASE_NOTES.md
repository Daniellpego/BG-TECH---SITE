# Frontend Release Notes — Apple-Minimal Design + Security Hardening

**Branch**: `feat/ui-apple-minimal-hardening`  
**Data**: 2026-03-04  
**Versão**: v0.3.0

---

## Resumo

Transformação completa do frontend do CRM em um produto minimalista estilo Apple, com segurança reforçada, onboarding interativo e cobertura de testes ampliada.

## A — Design System & Theme

- **Tokens Apple**: palette iOS blue (#3478f6), pure black bg, Apple gray (#f5f5f7)
- **CSS Custom Properties**: `--bg`, `--bg-elevated`, `--text`, `--primary`, etc. — dark/light theming
- **Sistema de fontes**: Apple system font stack (SF Pro, -apple-system)
- **Motion**: 280ms Apple ease, `prefers-reduced-motion` respeitado
- **Glass effect**: `.glass` class com backdrop-blur
- **Sombras**: sm/md/lg/xl/glow exportadas de tokens

## B — Componentes (14 atualizados)

| Componente | Mudança Principal |
|------------|-------------------|
| Button | Pill shape (rounded-full), CSS vars, whileTap scale 0.97 |
| Input | Floating labels, rounded-xl |
| AnimatedKpiCard | rounded-2xl, pill change badge |
| Badge | Emerald/amber semantic, reduced opacity |
| StatusBadge | CSS vars, subtle backgrounds |
| Modal | rounded-2xl, blur-xl backdrop |
| DataTable | CSS var rows/hover |
| Toast | rounded-2xl, CSS vars |
| Tooltip | rounded-xl, CSS vars |
| ConfirmDialog | rounded-2xl, blur backdrop |
| Skeleton | CSS var pulse bg |
| KpiCard | rounded-2xl, CSS var card |
| MarkdownEditor | rounded-2xl, CSS var toolbar |
| PageTransition | Apple 280ms ease, stagger 60ms |

## C — Layout & Pages (10 arquivos)

- **Sidebar**: Colapsável, 44px touch targets, links Help/Onboarding
- **Topbar**: Glass effect (backdrop-blur)
- **Dashboard**: KPI cards com CSS vars
- **Pipeline**: Kanban com CSS vars
- **Leads**: Search/filter com CSS vars
- **Proposals**: Card list com CSS vars
- **Projects**: DataTable com CSS vars
- **SLA**: Cards com CSS vars
- **Opportunities/[id]**: Detail page com CSS vars
- **Login**: Glass card, pill button

## D — Segurança (Security Hardening)

### Frontend
- **Next.js Edge Middleware**: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, HSTS (prod)
- `poweredByHeader: false` no next.config.mjs

### Backend
- **Helmet**: HTTP security headers
- **Rate Limiting**: 100 req/min global, 10 req/15min para auth
- **AuditInterceptor**: Log JSON estruturado para todas as operações mutantes (POST/PUT/PATCH/DELETE) — tenant, user, path, duration, IP

## E — Onboarding & Help Center

- **/onboarding**: Tour de 6 passos com progress bar, animações, skip/anterior/próximo
- **/help**: Central de ajuda com FAQ pesquisável, 10 artigos, filtros por categoria (Geral, Pipeline, IA, Propostas, SLA, Segurança)
- Links na Sidebar: 🚀 Tour Interativo, ❓ Central de Ajuda

## F — Testes

### Jest (68 testes, 11 suites — todos passando)
- Button (10), Badge (5), Sidebar (6), Toast (5), ConfirmDialog (7), Modal (3), KpiCard (6), AnimatedKpiCard (5), Skeleton (3), Avatar (2), PageTransition (6)

### Playwright E2E (novo spec)
- Security headers (CSP, X-Frame-Options, no X-Powered-By)
- Onboarding tour (navegação, skip, indicadores de progresso)
- Help center (FAQ, busca, filtros de categoria)
- Apple design (dashboard cards, sidebar colapsável, glass topbar)

## G — CI/CD

- Job `Test Frontend (Jest)` adicionado ao CI workflow
- Verificação de middleware de segurança no CI
- Frontend build verification integrado

## H — Documentação de Segurança

- `ops/security/pentest_checklist.md` com 10 seções: headers HTTP, auth/authz, injeção, validação de input, dados sensíveis, segurança LLM, infra, CI/CD, recomendações futuras, ferramentas manuais

---

## Commits (5)

1. `feat(frontend/design)`: Apple-minimal design system + CSS variables (31 files)
2. `feat(security)`: CSP headers, Helmet, rate limiting, audit logs (7 files)
3. `feat(frontend)`: Onboarding tour + help center (4 files)
4. `test`: Update + add Jest/Playwright tests for Apple design (8 files)
5. `ci`: Add frontend Jest tests to CI + pentest checklist (2 files)

## Build

```
✓ Compiled successfully
✓ 14 routes (12 static + 2 dynamic)
✓ Middleware 26.9 kB
✓ 68/68 Jest tests passing
✓ 0 TypeScript errors
```
