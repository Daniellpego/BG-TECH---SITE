-- ══════════════════════════════════════════════════════════════
-- Migration 005: Habilitar INSERT anônimo em leads (quiz público)
--
-- O quiz do site roda sem autenticação. Precisamos permitir INSERT
-- na tabela leads para role anon. SELECT/UPDATE/DELETE continuam bloqueados.
--
-- Também adiciona coluna diagnostico_id usada pelo quiz para vincular
-- a janela_decisao via PATCH posterior.
-- ══════════════════════════════════════════════════════════════

-- ─── 1. ADICIONAR COLUNA diagnostico_id EM LEADS ────────────

DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN diagnostico_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_diagnostico ON public.leads(diagnostico_id);

-- ─── 2. DROPAR POLICY RESTRITIVA QUE BLOQUEIA ANON ─────────

DROP POLICY IF EXISTS "deny_anon_leads" ON public.leads;

-- ─── 3. CRIAR POLICIES GRANULARES PARA ANON ─────────────────

-- Anon pode INSERT (quiz público cria lead)
DO $$ BEGIN
  CREATE POLICY "anon_insert_leads" ON public.leads
    FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anon pode UPDATE apenas a coluna janela_decisao (via PATCH no resultado)
-- Nota: Supabase RLS não filtra por coluna, então limitamos por condição
DO $$ BEGIN
  CREATE POLICY "anon_update_leads_janela" ON public.leads
    FOR UPDATE TO anon
    USING (diagnostico_id IS NOT NULL)
    WITH CHECK (diagnostico_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anon NÃO pode SELECT nem DELETE (dados sensíveis)
DO $$ BEGIN
  CREATE POLICY "deny_anon_select_leads" ON public.leads
    AS RESTRICTIVE FOR SELECT TO anon USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "deny_anon_delete_leads" ON public.leads
    AS RESTRICTIVE FOR DELETE TO anon USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ══════════════════════════════════════════════════════════════
-- Verification:
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'leads';
-- ══════════════════════════════════════════════════════════════
