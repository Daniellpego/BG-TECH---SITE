-- ══════════════════════════════════════════════════════════════
-- Migration 003: Fix CRM ↔ CFO Bridge
--
-- Resolve GAP 1: Triggers escrevem em cfo_lancamentos (fantasma)
--                Reescrever para usar receitas/gastos_variaveis
-- Resolve GAP 2: Drop cfo_lancamentos (tabela fantasma)
-- Resolve GAP 4: Criar quiz_sessions para captura de leads
-- Resolve GAP 6: Deduplicação de receita (deal ganho + projeto entregue)
-- ══════════════════════════════════════════════════════════════

-- ─── GAP 4: QUIZ_SESSIONS ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id             UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  setor               TEXT,
  faturamento_faixa   TEXT,
  horas_retrabalho    TEXT,
  gargalos            TEXT[],
  nivel_tecnologia    TEXT,
  urgencia            TEXT,
  respostas           JSONB,
  score_automacao     INTEGER,
  custo_invisivel_min NUMERIC(12,2),
  custo_invisivel_max NUMERIC(12,2),
  resultado_tipo      TEXT DEFAULT 'diagnostico'
                        CHECK (resultado_tipo IN ('diagnostico', 'parceria')),
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,
  utm_content         TEXT,
  origem              TEXT CHECK (origem IN ('meta_ads', 'google_ads', 'site_organico', 'indicacao')),
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_lead ON public.quiz_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created ON public.quiz_sessions(created_at DESC);

-- RLS: authenticated full access, anon can only INSERT (quiz is public)
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "auth_all_quiz_sessions" ON public.quiz_sessions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "anon_insert_quiz_sessions" ON public.quiz_sessions
    FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── GAP 1: REESCREVER TRIGGER trg_deal_ganho ─────────────
-- Agora insere em "receitas" (tabela real do CFO) em vez de cfo_lancamentos
-- Inclui guard de deduplicação (GAP 6)

CREATE OR REPLACE FUNCTION on_deal_ganho()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente TEXT;
  v_existing UUID;
BEGIN
  -- Only fire when status changes to 'ganho'
  IF NEW.status = 'ganho' AND (OLD.status IS NULL OR OLD.status != 'ganho') THEN

    -- Resolve client name from lead
    SELECT l.empresa INTO v_cliente
    FROM public.leads l
    WHERE l.id = NEW.lead_id;

    -- GAP 6: Check for duplicate revenue (idempotency guard)
    SELECT id INTO v_existing
    FROM public.receitas
    WHERE descricao = 'Deal: ' || NEW.titulo
      AND cliente = COALESCE(v_cliente, 'Cliente não informado')
      AND valor_bruto = NEW.valor
    LIMIT 1;

    -- Only insert if no duplicate exists
    IF v_existing IS NULL THEN
      INSERT INTO public.receitas (
        data, cliente, descricao, tipo, valor_bruto, taxas,
        recorrente, status, categoria, created_by
      ) VALUES (
        COALESCE(NEW.data_fechamento, CURRENT_DATE),
        COALESCE(v_cliente, 'Cliente não informado'),
        'Deal: ' || NEW.titulo,
        CASE WHEN NEW.mrr > 0 THEN 'mensalidade' ELSE 'projeto_avulso' END,
        NEW.valor,
        0,
        (NEW.mrr > 0),
        'confirmado',
        COALESCE(NEW.categoria, 'projeto'),
        NEW.user_id
      );
    END IF;

    -- If deal has MRR, also register recurrent entry
    IF NEW.mrr > 0 THEN
      -- Check for duplicate MRR entry
      SELECT id INTO v_existing
      FROM public.receitas
      WHERE descricao = 'MRR: ' || NEW.titulo
        AND cliente = COALESCE(v_cliente, 'Cliente não informado')
        AND valor_bruto = NEW.mrr
      LIMIT 1;

      IF v_existing IS NULL THEN
        INSERT INTO public.receitas (
          data, cliente, descricao, tipo, valor_bruto, taxas,
          recorrente, status, categoria, created_by
        ) VALUES (
          COALESCE(NEW.data_fechamento, CURRENT_DATE),
          COALESCE(v_cliente, 'Cliente não informado'),
          'MRR: ' || NEW.titulo,
          'mensalidade',
          NEW.mrr,
          0,
          true,
          'confirmado',
          'Mensalidade',
          NEW.user_id
        );
      END IF;
    END IF;

    -- Create project card automatically (unchanged, this already works)
    INSERT INTO public.projetos (
      deal_id, titulo, cliente, valor, status, responsavel, data_inicio, user_id
    ) VALUES (
      NEW.id,
      NEW.titulo,
      COALESCE(v_cliente, 'Cliente não informado'),
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

-- ─── GAP 1: REESCREVER TRIGGER trg_projeto_entregue ───────
-- NÃO cria nova receita (GAP 6: evita duplicação)
-- Registra no histórico de decisões para auditoria

CREATE OR REPLACE FUNCTION on_projeto_entregue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status != 'entregue') THEN

    -- Log the delivery as a strategic decision
    INSERT INTO public.historico_decisoes (
      data, decisao, contexto, autor
    ) VALUES (
      CURRENT_DATE,
      'Projeto entregue: ' || NEW.titulo,
      'Cliente: ' || COALESCE(NEW.cliente, 'N/A') ||
      ' | Valor: R$ ' || COALESCE(NEW.valor::TEXT, '0') ||
      ' | Início: ' || COALESCE(NEW.data_inicio::TEXT, 'N/A'),
      COALESCE(NEW.responsavel, 'Sistema')
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── GAP 1: REESCREVER TRIGGER trg_lead_meta_ads ──────────
-- Insere em gastos_variaveis (tabela real do CFO) em vez de cfo_lancamentos

CREATE OR REPLACE FUNCTION on_lead_meta_ads()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.origem = 'meta_ads' AND NEW.valor_estimado > 0 THEN

    INSERT INTO public.gastos_variaveis (
      data, descricao, categoria, tipo, valor, status, created_by
    ) VALUES (
      CURRENT_DATE,
      'Lead Meta Ads: ' || NEW.nome || ' - ' || COALESCE(NEW.empresa, 'Sem empresa'),
      'marketing',
      'marketing',
      NEW.valor_estimado * 0.10,   -- 10% do valor estimado como custo de aquisição
      'confirmado',
      NEW.user_id
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── GAP 2: DROP cfo_lancamentos (tabela fantasma) ─────────
-- Primeiro migra dados existentes para as tabelas corretas, se houver

DO $$
BEGIN
  -- Check if cfo_lancamentos exists before trying to migrate
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cfo_lancamentos'
  ) THEN

    -- Migrate revenue entries to receitas
    INSERT INTO public.receitas (data, cliente, descricao, tipo, valor_bruto, taxas, recorrente, status, categoria)
    SELECT
      COALESCE(data, CURRENT_DATE),
      COALESCE(nome, 'Migrado de cfo_lancamentos'),
      nome,
      CASE
        WHEN recorrencia = 'mensal' THEN 'mensalidade'
        ELSE 'projeto_avulso'
      END,
      valor,
      0,
      (recorrencia = 'mensal'),
      'confirmado',
      COALESCE(categoria, 'projeto')
    FROM public.cfo_lancamentos
    WHERE tipo = 'receita'
    ON CONFLICT DO NOTHING;

    -- Migrate expense entries to gastos_variaveis
    INSERT INTO public.gastos_variaveis (data, descricao, categoria, tipo, valor, status)
    SELECT
      COALESCE(data, CURRENT_DATE),
      COALESCE(nome, 'Migrado de cfo_lancamentos'),
      CASE
        WHEN LOWER(categoria) = 'marketing' THEN 'marketing'
        ELSE 'operacional'
      END,
      CASE
        WHEN LOWER(categoria) = 'marketing' THEN 'marketing'
        ELSE 'operacional'
      END,
      valor,
      'confirmado'
    FROM public.cfo_lancamentos
    WHERE tipo IN ('despesa', 'variavel')
    ON CONFLICT DO NOTHING;

    -- Now drop the ghost table
    DROP TABLE public.cfo_lancamentos;

    RAISE NOTICE 'cfo_lancamentos migrated and dropped successfully';

  ELSE
    RAISE NOTICE 'cfo_lancamentos does not exist, nothing to migrate';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- Verification queries (run after applying):
--
-- 1. Confirm triggers write to correct tables:
--    SELECT tgname, tgrelid::regclass, tgfoid::regproc
--    FROM pg_trigger WHERE tgname LIKE 'trg_%';
--
-- 2. Confirm cfo_lancamentos is gone:
--    SELECT * FROM information_schema.tables
--    WHERE table_name = 'cfo_lancamentos';
--
-- 3. Confirm quiz_sessions exists:
--    SELECT * FROM information_schema.tables
--    WHERE table_name = 'quiz_sessions';
--
-- 4. Confirm Realtime:
--    SELECT * FROM pg_publication_tables
--    WHERE pubname = 'supabase_realtime';
-- ══════════════════════════════════════════════════════════════
