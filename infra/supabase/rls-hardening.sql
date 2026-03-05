-- ══════════════════════════════════════════════════════════════
-- RLS Hardening — painel_gastos
-- 
-- Purpose: Block all direct anon access to painel_gastos.
-- After this, only the Vercel serverless backend (using
-- service_role key) can read/write the table.
--
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- ══════════════════════════════════════════════════════════════

-- 1. Enable Row Level Security
ALTER TABLE public.painel_gastos ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing permissive policies that might allow anon access
DROP POLICY IF EXISTS "allow_all" ON public.painel_gastos;
DROP POLICY IF EXISTS "anon_read" ON public.painel_gastos;
DROP POLICY IF EXISTS "anon_write" ON public.painel_gastos;
DROP POLICY IF EXISTS "deny_anon" ON public.painel_gastos;

-- 3. Create explicit DENY policy for anon role
-- With RLS enabled and no permissive policies for anon,
-- anon is already blocked. But we add an explicit restrictive
-- policy for defense-in-depth.
CREATE POLICY "deny_anon_all"
  ON public.painel_gastos
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- 4. Verify: service_role bypasses RLS by default in Supabase
-- No policy needed for service_role — it has superuser-like access.

-- 5. (Optional) If you want authenticated users to read but not write:
-- CREATE POLICY "authenticated_read"
--   ON public.painel_gastos
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- ══════════════════════════════════════════════════════════════
-- Verification query — run after applying:
-- ══════════════════════════════════════════════════════════════
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'painel_gastos';
-- Expected: rowsecurity = true
--
-- SELECT * FROM pg_policies WHERE tablename = 'painel_gastos';
-- Expected: deny_anon_all policy visible
-- ══════════════════════════════════════════════════════════════
