<p align="center">
  <img src="site-principal/logo-bgtech.png" alt="BG Tech" width="180" />
</p>

<h1 align="center">Ecosistema BG Tech 2026</h1>

<p align="center">
  <strong>Plataforma completa de gestão empresarial para operações B2B</strong><br/>
  3 painéis interligados em tempo real via Supabase
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Produção-00C8F0?style=flat-square" />
  <img src="https://img.shields.io/badge/Painéis-3-7C3AED?style=flat-square" />
  <img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat-square" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square" />
  <img src="https://img.shields.io/badge/Monorepo-Turborepo-EF4444?style=flat-square" />
</p>

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                     ECOSISTEMA BG TECH                          │
│                                                                 │
│   ┌──────────┐     ┌──────────┐     ┌──────────────┐           │
│   │  PAINEL   │────▶│  PAINEL   │────▶│    PAINEL     │          │
│   │   CRM     │     │   CFO     │     │   PROJETOS    │          │
│   │          │     │          │     │              │          │
│   │ Leads     │     │ Receitas  │     │ Kanban       │          │
│   │ Deals     │     │ Despesas  │     │ Timeline     │          │
│   │ Pipeline  │     │ DRE       │     │ Tarefas      │          │
│   │ Analytics │     │ Projeções │     │ Dashboard    │          │
│   └─────┬────┘     └─────┬────┘     └──────┬───────┘          │
│         │               │                  │                   │
│         └───────────────┼──────────────────┘                   │
│                         ▼                                      │
│              ┌─────────────────────┐                           │
│              │     SUPABASE        │                           │
│              │  ┌───────────────┐  │                           │
│              │  │  PostgreSQL   │  │                           │
│              │  │  + Realtime   │  │                           │
│              │  │  + Auth       │  │                           │
│              │  │  + RLS        │  │                           │
│              │  └───────────────┘  │                           │
│              └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

Três dashboards que **conversam entre si automaticamente** via triggers SQL. Fechou um deal no CRM? O CFO já registra a receita e o Painel de Projetos já cria o card.

---

## Painéis

### 💰 Painel CFO — Controle Financeiro

> `painel-cfo/` — Dashboard financeiro completo estilo Linear/Mercury

| Feature | Descrição |
|---------|-----------|
| **Overview** | KPIs em tempo real: Caixa, MRR, Receita, Burn Rate, Runway |
| **DRE Gerencial** | Demonstrativo mensal vs acumulado (YTD) |
| **Lançamentos** | CRUD completo de receitas, fixos e variáveis |
| **Projeções** | Simulação de cenários 3/6/12 meses |
| **Relatórios** | DRE simplificado + breakdown por categoria |
| **Visão Anual** | Grid 12 meses com balanço mensal |
| **Trend Badges** | Indicadores MoM (mês a mês) em todos KPIs |
| **Offline Mode** | IndexedDB + sync queue automático |
| **PWA** | Service Worker network-first, instalável |

### 📊 Painel CRM — Gestão Comercial

> `apps/painel-crm/` — Pipeline de vendas e gestão de leads

| Feature | Descrição |
|---------|-----------|
| **Leads** | Cadastro com origem (Meta Ads, Google, Indicação, Direto) |
| **Deals** | Negócios com valor, MRR e status |
| **Pipeline** | Visualização Kanban do funil de vendas |
| **Analytics** | Métricas de conversão e performance |

### 📋 Painel Projetos — Gestão de Entregas

> `apps/painel-projetos/` — Controle de projetos e tarefas

| Feature | Descrição |
|---------|-----------|
| **Dashboard** | Visão geral de todos os projetos |
| **Kanban** | Board com colunas Todo → Doing → Done |
| **Timeline** | Visualização temporal de entregas |
| **Projetos** | Gestão completa com progresso e tags |

---

## Sincronização Cross-Panel

A mágica do ecosistema: **triggers SQL que conectam tudo automaticamente.**

```
Deal fechado (ganho)
  ├─▶ CFO: lançamento de receita criado automaticamente
  ├─▶ CFO: se tem MRR, registra receita recorrente
  └─▶ Projetos: card de projeto criado no backlog

Projeto entregue
  └─▶ CFO: receita realizada registrada

Lead via Meta Ads
  └─▶ CFO: custo de marketing debitado (10% do valor estimado)
```

---

## Stack Técnica

```
Frontend    Vanilla JS (ES Modules) + ApexCharts + Lucide Icons
Backend     Supabase (PostgreSQL + Auth + Realtime + RLS)
Offline     Dexie.js (IndexedDB) + Sync Queue
PWA         Service Worker (network-first)
Monorepo    Turborepo + npm Workspaces
Deploy      Vercel (zero-config)
Design      Dark theme BG Tech (Poppins, 4-tier depth system)
```

---

## Estrutura do Projeto

```
Ecosistema-BG-Tech-2026/
│
├── painel-cfo/                 # Dashboard CFO (financeiro)
│   ├── css/                    # Design tokens + componentes
│   │   ├── variables.css       # Paleta, tipografia, espaçamento
│   │   ├── base.css            # Reset + estilos globais
│   │   ├── layout.css          # Sidebar, grid, modais
│   │   ├── components.css      # Cards, tabelas, badges
│   │   └── views.css           # Estilos específicos por view
│   ├── js/
│   │   ├── app.js              # Controller principal + routing
│   │   ├── auth.js             # Login com alias
│   │   ├── db.js               # CRUD Supabase
│   │   ├── state.js            # State management
│   │   ├── charts.js           # ApexCharts config
│   │   ├── utils.js            # Formatação, filtros, helpers
│   │   ├── offline.js          # IndexedDB + sync
│   │   └── views/              # Módulos de cada view
│   │       ├── overview.js     # KPIs + trends
│   │       ├── dre.js          # DRE Gerencial
│   │       ├── lancamentos.js  # Tabela de lançamentos
│   │       ├── projecoes.js    # Simulações financeiras
│   │       ├── relatorios.js   # Relatórios + export
│   │       └── annual.js       # Balanço anual
│   ├── sw.js                   # Service Worker
│   └── index.html              # App shell
│
├── apps/
│   ├── painel-crm/             # Dashboard CRM
│   │   ├── js/views/           # leads, deals, pipeline, analytics
│   │   └── ...
│   └── painel-projetos/        # Dashboard Projetos
│       ├── js/views/           # dashboard, kanban, projetos, timeline
│       └── ...
│
├── packages/
│   ├── db/                     # Shared database utilities
│   └── types/                  # Shared TypeScript types
│
├── supabase/
│   └── migrations/
│       └── 001_unified_schema.sql   # Schema + triggers + RLS
│
├── site-principal/             # Site institucional BG Tech
├── turbo.json                  # Turborepo config
└── package.json                # Monorepo workspaces
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Daniellpego/Ecosistema-BG-Tech-2026.git
cd Ecosistema-BG-Tech-2026

# 2. Instale dependências
npm install

# 3. Configure Supabase
# Crie um projeto em supabase.com e rode a migration:
# SQL Editor → cole o conteúdo de supabase/migrations/001_unified_schema.sql

# 4. Configure as credenciais
# Edite o config.js de cada painel com sua URL e anon key do Supabase

# 5. Rode em dev
npm run dev:cfo       # Painel CFO
npm run dev:crm       # Painel CRM
npm run dev:projetos  # Painel Projetos

# 6. Build para produção
npm run build
```

---

## Design System

O ecosistema segue um design system consistente com tema dark inspirado em Linear/Mercury:

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-base` | `#080E1A` | Fundo da página |
| `--bg-surface` | `#0C1424` | Cards e painéis |
| `--bg-elevated` | `#111C32` | Modais e drawers |
| `--bg-floating` | `#162240` | Tooltips e hovers |
| `--primary` | `#00C8F0` | Ações principais (cyan) |
| `--success` | `#34D399` | Receita / positivo |
| `--danger` | `#F87171` | Despesa / negativo |
| `--font-body` | Poppins | Tipografia padrão |

---

## Database Schema

```sql
leads ──────┐
             ├──▶ deals ──────▶ projetos ──────▶ tarefas
             │         │
             │         └──▶ cfo_lancamentos (via trigger)
             │
             └──▶ cfo_lancamentos (Meta Ads trigger)
```

**5 tabelas** · **4 triggers automáticos** · **RLS ativo** · **Realtime habilitado**

---

## Segurança

- Row Level Security (RLS) em todas as tabelas
- Apenas usuários autenticados têm acesso
- Anon bloqueado por policy restritiva
- `config.js` excluído do cache do Service Worker
- Credenciais nunca versionadas (`.gitignore`)

---

<p align="center">
  <strong>BG Tech</strong> — Automação e Engenharia Digital para Empresas B2B<br/>
  <a href="https://www.bgtechsolucoes.com.br">bgtechsolucoes.com.br</a>
</p>
