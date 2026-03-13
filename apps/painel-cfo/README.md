# Painel CFO — BG Tech

Painel financeiro completo para gestao da BG Tech. Usado diariamente pelo CFO para acompanhar receitas, custos, DRE, projecoes e saude financeira da empresa.

## Rodar Localmente

```bash
cd apps/painel-cfo
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Variaveis de Ambiente

Crie o arquivo `apps/painel-cfo/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://urpuiznydrlwmaqhdids.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_anon_key>
```

A `GROQ_API_KEY` fica apenas como secret na Edge Function do Supabase (nunca no frontend).

## Criar Primeiro Usuario (Login)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/urpuiznydrlwmaqhdids/auth/users)
2. Clique em **"Add user"** > **"Create new user"**
3. Preencha email e senha (ex: `gustavo@bgtech.dev`)
4. Marque **"Auto Confirm User"**
5. Clique em **"Create user"**
6. Use essas credenciais no login do painel

## Abas do Painel

| Aba | Rota | Funcao |
|-----|------|--------|
| Painel Geral | `/dashboard` | KPIs, alertas inteligentes, grafico receita vs custos, analise IA |
| DRE | `/dre` | Demonstracao de Resultado (cascata: Receita > Custos Var > Margem > Custos Fixos > Impostos > Resultado) |
| Receitas | `/receitas` | CRUD de faturamento com filtros por tipo e status |
| Custos Fixos | `/custos-fixos` | CRUD de custos fixos mensais com pie chart |
| Gastos Variaveis | `/gastos-variaveis` | CRUD de gastos por categoria com CAC |
| Projecoes | `/projecoes` | 3 cenarios financeiros (conservador/realista/agressivo) |
| Balanco Anual | `/balanco-anual` | Grid de 12 meses com drill-down |
| Academy | `/academy` | Glossario financeiro + guias + chat IA |

## Stack

- Next.js 15 + App Router + TypeScript
- Supabase (Auth + Postgres + Edge Functions)
- TanStack React Query v5
- Tailwind CSS + Radix UI + Recharts
- Framer Motion + Zod
- Groq API (llama-3.3-70b) via Edge Function

## Scripts

```bash
npm run dev        # Dev server com Turbopack
npm run build      # Build de producao
npm run start      # Serve build de producao
npm run typecheck  # Verificacao de tipos (tsc --noEmit)
npm run lint       # ESLint
```

## Regras de Negocio

- **Simples Nacional:** impostos sobre faturamento (receita bruta), nao sobre lucro
- **DRE:** Receita Bruta > Custos Variaveis > Margem Bruta > Custos Fixos > Resultado Operacional > Impostos > Resultado Liquido
- **MRR:** soma de receitas com `recorrente=true` e `status=confirmado`
- **Runway:** Caixa Disponivel / Burn Rate mensal
- Apenas receitas `status=confirmado` entram nos calculos
- Apenas custos fixos `status=ativo` entram nos calculos
