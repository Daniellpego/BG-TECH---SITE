-- ══════════════════════════════════════════════════════════════
-- Ecosistema BG Tech 2026 — Unified Supabase Schema
--
-- Tables: leads, deals, projetos, tarefas
-- Triggers: cross-panel sync (CRM → CFO, Projetos → CFO)
-- Realtime: enabled on CRM/project tables
--
-- NOTE: The trigger functions below (on_deal_ganho, on_projeto_entregue,
-- on_lead_meta_ads) originally wrote to "cfo_lancamentos" which was never
-- created. Migration 003 uses CREATE OR REPLACE FUNCTION to rewrite them
-- to target the correct CFO tables (receitas, gastos_variaveis, etc.).
-- ══════════════════════════════════════════════════════════════

-- ─── ENUM TYPES ──────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('novo', 'contatado', 'qualificado', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE deal_status AS ENUM ('aberto', 'ganho', 'perdido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE projeto_status AS ENUM ('backlog', 'em_andamento', 'revisao', 'entregue', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tarefa_prioridade AS ENUM ('baixa', 'media', 'alta', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lancamento_tipo AS ENUM ('receita', 'despesa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── CRM: LEADS ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leads (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome          TEXT NOT NULL,
  empresa       TEXT,
  email         TEXT,
  telefone      TEXT,
  origem        TEXT DEFAULT 'direto',         -- meta_ads, google, indicacao, direto
  status        lead_status DEFAULT 'novo',
  valor_estimado NUMERIC(12,2) DEFAULT 0,
  notas         TEXT,
  responsavel   TEXT DEFAULT 'BG',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  user_id       UUID REFERENCES auth.users(id)
);

-- ─── CRM: DEALS (negócios fechados) ─────────────────────────

CREATE TABLE IF NOT EXISTS public.deals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id       UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  titulo        TEXT NOT NULL,
  valor         NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrr           NUMERIC(12,2) DEFAULT 0,       -- receita recorrente mensal
  status        deal_status DEFAULT 'aberto',
  data_fechamento DATE,
  categoria     TEXT DEFAULT 'servico',         -- servico, produto, consultoria
  notas         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  user_id       UUID REFERENCES auth.users(id)
);

-- ─── PROJETOS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projetos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id       UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  titulo        TEXT NOT NULL,
  descricao     TEXT,
  cliente       TEXT,
  status        projeto_status DEFAULT 'backlog',
  valor         NUMERIC(12,2) DEFAULT 0,
  data_inicio   DATE,
  data_entrega  DATE,
  responsavel   TEXT DEFAULT 'Daniel',
  progresso     INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  user_id       UUID REFERENCES auth.users(id)
);

-- ─── TAREFAS (cards de projeto) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.tarefas (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id    UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  descricao     TEXT,
  status        TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  prioridade    tarefa_prioridade DEFAULT 'media',
  responsavel   TEXT,
  data_limite   DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_origem ON public.leads(origem);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_lead ON public.deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_projetos_status ON public.projetos(status);
CREATE INDEX IF NOT EXISTS idx_projetos_deal ON public.projetos(deal_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_projeto ON public.tarefas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_projetos_updated BEFORE UPDATE ON public.projetos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_tarefas_updated BEFORE UPDATE ON public.tarefas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ══════════════════════════════════════════════════════════════
-- CROSS-PANEL TRIGGERS — The "magic" that links the 3 dashboards
-- ══════════════════════════════════════════════════════════════

-- ─── 1. Deal ganho → CFO lançamento (receita) + Projeto card ─

CREATE OR REPLACE FUNCTION on_deal_ganho()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status changes to 'ganho'
  IF NEW.status = 'ganho' AND (OLD.status IS NULL OR OLD.status != 'ganho') THEN

    -- Insert revenue entry in CFO lancamentos
    INSERT INTO public.cfo_lancamentos (
      nome, valor, tipo, categoria, data, recorrencia, status, user_id
    ) VALUES (
      'Deal fechado: ' || NEW.titulo,
      NEW.valor,
      'receita',
      COALESCE(NEW.categoria, 'Projetos Avulsos'),
      COALESCE(NEW.data_fechamento, CURRENT_DATE),
      CASE WHEN NEW.mrr > 0 THEN 'mensal' ELSE 'unico' END,
      'Confirmado',
      NEW.user_id
    );

    -- If deal has MRR, also register recurrent entry
    IF NEW.mrr > 0 THEN
      INSERT INTO public.cfo_lancamentos (
        nome, valor, tipo, categoria, data, recorrencia, status, user_id
      ) VALUES (
        'MRR: ' || NEW.titulo,
        NEW.mrr,
        'receita',
        'Mensalidade',
        COALESCE(NEW.data_fechamento, CURRENT_DATE),
        'mensal',
        'Confirmado',
        NEW.user_id
      );
    END IF;

    -- Create project card automatically
    INSERT INTO public.projetos (
      deal_id, titulo, cliente, valor, status, responsavel, data_inicio, user_id
    ) VALUES (
      NEW.id,
      NEW.titulo,
      (SELECT l.empresa FROM public.leads l WHERE l.id = NEW.lead_id),
      NEW.valor,
      'backlog',
      'Daniel',
      CURRENT_DATE,
      NEW.user_id
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_deal_ganho AFTER INSERT OR UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION on_deal_ganho();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Projeto entregue → CFO receita realizada ────────────

CREATE OR REPLACE FUNCTION on_projeto_entregue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status != 'entregue') THEN

    INSERT INTO public.cfo_lancamentos (
      nome, valor, tipo, categoria, data, recorrencia, status, user_id
    ) VALUES (
      'Projeto entregue: ' || NEW.titulo,
      NEW.valor,
      'receita',
      'Projetos Avulsos',
      CURRENT_DATE,
      'unico',
      'Confirmado',
      NEW.user_id
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_projeto_entregue AFTER UPDATE ON public.projetos
    FOR EACH ROW EXECUTE FUNCTION on_projeto_entregue();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 3. Lead com origem meta_ads → CFO debita custo ads ─────

CREATE OR REPLACE FUNCTION on_lead_meta_ads()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.origem = 'meta_ads' AND NEW.valor_estimado > 0 THEN

    INSERT INTO public.cfo_lancamentos (
      nome, valor, tipo, categoria, data, recorrencia, status, user_id
    ) VALUES (
      'Meta Ads — Lead: ' || NEW.nome,
      NEW.valor_estimado * 0.10,  -- estimated ad cost (10% of deal value)
      'variavel',
      'Marketing',
      CURRENT_DATE,
      'unico',
      'Confirmado',
      NEW.user_id
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_lead_meta_ads AFTER INSERT ON public.leads
    FOR EACH ROW EXECUTE FUNCTION on_lead_meta_ads();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENABLE REALTIME ─────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projetos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas;

-- ─── RLS POLICIES ────────────────────────────────────────────

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Authenticated users can CRUD all rows (single-tenant team)
CREATE POLICY "auth_all_leads" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_deals" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_projetos" ON public.projetos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_tarefas" ON public.tarefas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Block anon
CREATE POLICY "deny_anon_leads" ON public.leads AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_anon_deals" ON public.deals AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_anon_projetos" ON public.projetos AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_anon_tarefas" ON public.tarefas AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- ══════════════════════════════════════════════════════════════
-- Run in Supabase SQL Editor to apply.
-- After: verify with SELECT * FROM pg_policies;
-- ══════════════════════════════════════════════════════════════
