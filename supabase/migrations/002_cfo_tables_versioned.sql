-- ══════════════════════════════════════════════════════════════
-- Migration 002: CFO Tables Versioned
--
-- Resolve GAP 3: 8 tabelas CFO sem migration no repo
-- Resolve GAP 5: 3 views sem SQL no repo
-- Resolve GAP Extra: Realtime habilitado nas tabelas CFO
--
-- Todas usam CREATE TABLE IF NOT EXISTS para idempotência
-- (as tabelas já existem no Supabase, mas não estavam versionadas)
-- ══════════════════════════════════════════════════════════════

-- ─── 1. RECEITAS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.receitas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data            DATE NOT NULL,
  cliente         TEXT NOT NULL,
  descricao       TEXT,
  tipo            TEXT NOT NULL DEFAULT 'projeto_avulso'
                    CHECK (tipo IN ('setup', 'mensalidade', 'projeto_avulso', 'consultoria', 'mvp', 'outro')),
  valor_bruto     NUMERIC(12,2) NOT NULL DEFAULT 0,
  taxas           NUMERIC(12,2) DEFAULT 0,
  valor_liquido   NUMERIC(12,2) GENERATED ALWAYS AS (valor_bruto - taxas) STORED,
  recorrente      BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'previsto'
                    CHECK (status IN ('previsto', 'confirmado', 'cancelado')),
  categoria       TEXT,
  observacoes     TEXT,
  comprovante_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_receitas_data ON public.receitas(data);
CREATE INDEX IF NOT EXISTS idx_receitas_status ON public.receitas(status);
CREATE INDEX IF NOT EXISTS idx_receitas_tipo ON public.receitas(tipo);

-- ─── 2. CUSTOS FIXOS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.custos_fixos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome            TEXT NOT NULL,
  categoria       TEXT NOT NULL DEFAULT 'outro'
                    CHECK (categoria IN ('ferramentas', 'contabilidade', 'marketing', 'infraestrutura', 'administrativo', 'pro_labore', 'impostos_fixos', 'outro')),
  valor_mensal    NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_inicio     DATE NOT NULL,
  dia_vencimento  INTEGER,
  recorrencia     TEXT DEFAULT 'mensal'
                    CHECK (recorrencia IN ('mensal', 'trimestral', 'anual', 'outro')),
  obrigatorio     BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'ativo'
                    CHECK (status IN ('ativo', 'suspenso', 'cancelado')),
  observacoes     TEXT,
  comprovante_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_custos_fixos_status ON public.custos_fixos(status);
CREATE INDEX IF NOT EXISTS idx_custos_fixos_categoria ON public.custos_fixos(categoria);

-- ─── 3. GASTOS VARIÁVEIS ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gastos_variaveis (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data            DATE NOT NULL,
  descricao       TEXT NOT NULL,
  cliente         TEXT,
  categoria       TEXT NOT NULL DEFAULT 'outro'
                    CHECK (categoria IN ('marketing', 'operacional', 'comercial', 'impostos_variaveis', 'freelancer', 'api_consumo', 'outro')),
  tipo            TEXT NOT NULL DEFAULT 'operacional'
                    CHECK (tipo IN ('operacional', 'marketing', 'comercial', 'impostos')),
  valor           NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          TEXT DEFAULT 'previsto'
                    CHECK (status IN ('previsto', 'confirmado')),
  observacoes     TEXT,
  comprovante_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_gastos_variaveis_data ON public.gastos_variaveis(data);
CREATE INDEX IF NOT EXISTS idx_gastos_variaveis_tipo ON public.gastos_variaveis(tipo);
CREATE INDEX IF NOT EXISTS idx_gastos_variaveis_status ON public.gastos_variaveis(status);

-- ─── 4. CAIXA ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.caixa (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data            DATE NOT NULL,
  saldo           NUMERIC(14,2) NOT NULL DEFAULT 0,
  banco           TEXT NOT NULL,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_caixa_data ON public.caixa(data DESC);

-- ─── 5. PROJEÇÕES ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projecoes (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome                      TEXT NOT NULL,
  taxa_crescimento_mensal   NUMERIC(8,4) DEFAULT 0,
  novos_clientes_mes        INTEGER DEFAULT 0,
  ticket_medio              NUMERIC(12,2) DEFAULT 0,
  custos_fixos_projetados   NUMERIC(12,2),
  custo_variavel_percentual NUMERIC(8,4) DEFAULT 0,
  meses_projecao            INTEGER DEFAULT 12,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now(),
  created_by                UUID REFERENCES auth.users(id)
);

-- ─── 6. METAS FINANCEIRAS ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.metas_financeiras (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  periodo         TEXT NOT NULL,
  metrica         TEXT NOT NULL
                    CHECK (metrica IN ('mrr', 'receita_total', 'margem_bruta', 'novos_clientes', 'resultado_liquido', 'burn_rate')),
  valor_meta      NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_metas_periodo ON public.metas_financeiras(periodo);

-- ─── 7. EMPRÉSTIMO SÓCIO ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.emprestimo_socio (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  socio           TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('entrada', 'devolucao')),
  valor           NUMERIC(12,2) NOT NULL DEFAULT 0,
  data            DATE NOT NULL,
  descricao       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 8. HISTÓRICO DECISÕES ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.historico_decisoes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data            DATE NOT NULL,
  decisao         TEXT NOT NULL,
  contexto        TEXT,
  autor           TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historico_data ON public.historico_decisoes(data DESC);

-- ─── UPDATED_AT TRIGGERS (CFO tables) ──────────────────────

DO $$ BEGIN
  CREATE TRIGGER trg_receitas_updated BEFORE UPDATE ON public.receitas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_custos_fixos_updated BEFORE UPDATE ON public.custos_fixos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_gastos_variaveis_updated BEFORE UPDATE ON public.gastos_variaveis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_projecoes_updated BEFORE UPDATE ON public.projecoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── RLS POLICIES (CFO tables) ─────────────────────────────

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_variaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprestimo_socio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_decisoes ENABLE ROW LEVEL SECURITY;

-- Authenticated: full access (single-tenant team)
DO $$ BEGIN CREATE POLICY "auth_all_receitas" ON public.receitas FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_custos_fixos" ON public.custos_fixos FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_gastos_variaveis" ON public.gastos_variaveis FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_caixa" ON public.caixa FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_projecoes" ON public.projecoes FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_metas_financeiras" ON public.metas_financeiras FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_emprestimo_socio" ON public.emprestimo_socio FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_historico_decisoes" ON public.historico_decisoes FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon: blocked
DO $$ BEGIN CREATE POLICY "deny_anon_receitas" ON public.receitas AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "deny_anon_custos_fixos" ON public.custos_fixos AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "deny_anon_gastos_variaveis" ON public.gastos_variaveis AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "deny_anon_caixa" ON public.caixa AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "deny_anon_projecoes" ON public.projecoes AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "deny_anon_metas_financeiras" ON public.metas_financeiras AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "deny_anon_emprestimo_socio" ON public.emprestimo_socio AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "deny_anon_historico_decisoes" ON public.historico_decisoes AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── VIEWS (GAP 5) ─────────────────────────────────────────

CREATE OR REPLACE VIEW public.vw_resumo_mensal AS
SELECT
  to_char(r.data, 'YYYY-MM') AS mes,
  SUM(r.valor_bruto)                                                      AS receita_bruta,
  SUM(CASE WHEN r.tipo = 'setup' THEN r.valor_bruto ELSE 0 END)          AS receita_setup,
  SUM(CASE WHEN r.tipo = 'mensalidade' THEN r.valor_bruto ELSE 0 END)    AS receita_mensalidades,
  SUM(CASE WHEN r.tipo IN ('projeto_avulso','consultoria','mvp','outro')
           THEN r.valor_bruto ELSE 0 END)                                 AS receita_projetos,
  SUM(r.valor_liquido)                                                     AS receita_liquida,
  SUM(CASE WHEN r.recorrente = true THEN r.valor_bruto ELSE 0 END)        AS mrr,
  COUNT(DISTINCT r.cliente)                                                AS clientes_ativos
FROM public.receitas r
WHERE r.status = 'confirmado'
GROUP BY to_char(r.data, 'YYYY-MM')
ORDER BY mes;

CREATE OR REPLACE VIEW public.vw_custos_fixos_mensal AS
SELECT
  to_char(now(), 'YYYY-MM') AS mes,
  SUM(valor_mensal) AS total_custos_fixos
FROM public.custos_fixos
WHERE status = 'ativo';

CREATE OR REPLACE VIEW public.vw_gastos_variaveis_mensal AS
SELECT
  to_char(gv.data, 'YYYY-MM') AS mes,
  SUM(gv.valor)                                                     AS total_gastos_variaveis,
  SUM(CASE WHEN gv.tipo = 'marketing' THEN gv.valor ELSE 0 END)    AS gasto_marketing,
  SUM(CASE WHEN gv.tipo = 'impostos' THEN gv.valor ELSE 0 END)     AS impostos_variaveis
FROM public.gastos_variaveis gv
WHERE gv.status = 'confirmado'
GROUP BY to_char(gv.data, 'YYYY-MM')
ORDER BY mes;

-- ─── REALTIME (GAP Extra) ──────────────────────────────────
-- Wrap in DO block to avoid errors if already added

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.receitas;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.custos_fixos;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gastos_variaveis;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.caixa;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ══════════════════════════════════════════════════════════════
-- Run in Supabase SQL Editor to apply.
-- All statements are idempotent (IF NOT EXISTS / DO EXCEPTION).
-- ══════════════════════════════════════════════════════════════
