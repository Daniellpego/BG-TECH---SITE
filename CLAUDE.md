# BG Tech — Ecosistema

## Projeto Principal: Painel CFO

Painel financeiro completo da BG Tech, usado diariamente pelo CFO (Gustavo Batista).
Localizado em `apps/painel-cfo/`.

### Stack

- **Framework:** Next.js 15 + App Router + Turbopack
- **Linguagem:** TypeScript (strict mode, zero `any`)
- **Auth:** Supabase Auth (email/password) com SSR middleware
- **Database:** Supabase Postgres com RLS em todas as tabelas
- **Data fetching:** TanStack React Query v5 (cache + invalidation)
- **UI:** Tailwind CSS + Radix UI primitives + Lucide icons
- **Charts:** Recharts (ComposedChart, PieChart, LineChart, AreaChart)
- **Animations:** Framer Motion (PageTransition em todas as rotas)
- **Forms:** Zod validation + controlled components
- **IA:** Groq API (llama-3.3-70b-versatile) via Supabase Edge Function

### Supabase

- **Project ID:** `urpuiznydrlwmaqhdids`
- **URL:** `https://urpuiznydrlwmaqhdids.supabase.co`
- **Edge Function:** `groq-analysis` (usa secret `GROQ_API_KEY`)
- **RLS:** Ativo em todas as 8 tabelas (policy: `auth.role() = 'authenticated'`)

### Schema do Banco (tabelas principais)

| Tabela | Descrição |
|--------|-----------|
| `receitas` | Faturamento. Campos-chave: `valor_bruto`, `valor_liquido` (generated: bruto - taxas), `tipo`, `recorrente`, `status` |
| `custos_fixos` | Custos mensais fixos. Campos-chave: `valor_mensal`, `categoria`, `status` (ativo/suspenso/cancelado) |
| `gastos_variaveis` | Custos que variam mês a mês. Campos-chave: `valor`, `tipo` (operacional/marketing/comercial/impostos), `categoria` |
| `caixa` | Saldo em conta. Campos-chave: `saldo`, `data`, `banco` |
| `projecoes` | Cenários financeiros (conservador/realista/agressivo). Campos-chave: `taxa_crescimento_mensal`, `ticket_medio`, `custo_variavel_percentual` |
| `metas_financeiras` | Metas por período e métrica |
| `emprestimo_socio` | Empréstimos entre sócios |
| `historico_decisoes` | Log de decisões estratégicas |

### Regras de Negocio (CRITICAS)

1. **Simples Nacional:** Impostos incidem sobre FATURAMENTO (receita bruta), NAO sobre lucro
2. **DRE Cascade:** Receita Bruta → (-) Custos Variáveis (sem impostos) → (=) Margem Bruta → (-) Custos Fixos → (=) Resultado Operacional → (-) Impostos → (=) Resultado Liquido
3. **Dashboard usa valor_bruto** (mesma base da DRE), NAO valor_liquido
4. **Gastos variáveis com tipo='impostos'** sao separados dos demais custos variáveis na DRE
5. **Custos fixos** consideram apenas `status='ativo'`
6. **Receitas** consideram apenas `status='confirmado'` para calculos
7. **MRR** = soma de receitas onde `recorrente=true` AND `status='confirmado'`
8. **Burn Rate** = Custos Fixos + Gastos Variáveis + Impostos
9. **Runway** = Caixa Disponível / Burn Rate (em meses)

### Abas do Painel

1. **Login** (`/login`) — Email/senha com Supabase Auth
2. **Painel Geral** (`/dashboard`) — KPIs, alertas inteligentes, gráficos, análise IA
3. **DRE** (`/dre`) — Demonstração de Resultado simplificada com cascata completa
4. **Receitas** (`/receitas`) — CRUD completo de faturamento com filtros e KPIs
5. **Custos Fixos** (`/custos-fixos`) — CRUD de custos fixos com pie chart de distribuição
6. **Gastos Variáveis** (`/gastos-variaveis`) — CRUD com tabs por tipo + CAC
7. **Projeções** (`/projecoes`) — 3 cenários (conservador/realista/agressivo) com 12 meses
8. **Balanço Anual** (`/balanco-anual`) — Grid de 12 meses com drill-down
9. **Academy** (`/academy`) — Glossário financeiro + guias + chat IA (Groq)

### Brand Book

| Token | Valor | Uso |
|-------|-------|-----|
| `bg-navy` | `#0A1628` | Background principal |
| `bg-card` | `#131F35` | Cards (classe `card-glass`) |
| `brand-cyan` | `#00C8F0` | CTAs, destaques, links ativos |
| `brand-blue` | `#1A6AAA` | Elementos secundários |
| `brand-blue-deep` | `#153B5F` | Borders, grid lines |
| `text-primary` | `#F0F4F8` | Texto principal |
| `text-secondary` | `#94A3B8` | Labels, subtextos |
| `status-positive` | `#10B981` | Valores positivos (verde) |
| `status-negative` | `#EF4444` | Valores negativos (vermelho) |
| `status-warning` | `#F59E0B` | Alertas (amarelo) |
| **Font** | Poppins | 300-700 weights |

### Estrutura de Pastas (painel-cfo)

```
src/
  app/
    login/page.tsx
    (authenticated)/
      dashboard/page.tsx
      dre/page.tsx
      receitas/page.tsx
      custos-fixos/page.tsx
      gastos-variaveis/page.tsx
      projecoes/page.tsx
      balanco-anual/page.tsx
      academy/page.tsx
      layout.tsx          # Sidebar + PeriodProvider + QueryProvider
  components/
    layout/sidebar.tsx
    ui/                   # Button, Input, Skeleton, Tabs, Dialog, etc.
    receitas/             # ReceitaForm, ReceitasTable
    custos-fixos/         # CustoFixoForm, CustosFixosTable
    gastos-variaveis/     # GastoVariavelForm, GastosVariaveisTable
    motion.tsx            # PageTransition, StaggerContainer, AnimatedNumber
  hooks/
    use-dashboard.ts      # 9 queries paralelas, KPIs, alertas, health status
    use-dre.ts            # DRE cascade completa
    use-receitas.ts       # CRUD receitas
    use-custos-fixos.ts   # CRUD custos fixos
    use-gastos-variaveis.ts # CRUD gastos variáveis
    use-balanco.ts        # Balanço anual 12 meses
    use-projecoes.ts      # 3 cenários de projeção
    use-groq.ts           # Chamada à Edge Function Groq
  lib/
    supabase/client.ts    # Browser client
    supabase/server.ts    # Server client (SSR)
    supabase/middleware.ts # Auth redirect middleware
    format.ts             # formatCurrency, formatPercent
    utils.ts              # cn() (clsx + tailwind-merge)
  providers/
    period-provider.tsx   # Contexto de período (mês/ano) global
    query-provider.tsx    # TanStack Query provider
  types/
    database.ts           # Tipos TypeScript do schema Supabase
```

### Convenções

- Dark mode only (sem toggle)
- Mobile-first responsive
- Skeleton loaders (nunca spinners genéricos)
- `card-glass` para todos os cards
- Framer Motion `PageTransition` em todas as páginas
- Formulários em Dialog/Sheet modal (não página separada)
- TanStack Query com invalidação após mutações
- Insert pattern: `.insert(data as unknown as Record<string, unknown>)` (workaround para tipos do Supabase sem generics)
