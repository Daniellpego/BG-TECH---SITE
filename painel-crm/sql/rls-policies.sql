-- ============================================================================
-- RLS (Row Level Security) Policies for CRM BG Tech
-- Compatible with Supabase and standard PostgreSQL
-- ============================================================================

-- Função helper: extrai tenant_id do JWT (Supabase auth.uid() → users.tenant_id)
-- Para uso com Supabase Auth:
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS TEXT AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()::text
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- TENANTS — sem RLS (admin only via aplicação)
-- ============================================================================

-- ============================================================================
-- USERS
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_tenant_select" ON users
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "users_tenant_insert" ON users
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "users_tenant_update" ON users
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- ACCOUNTS
-- ============================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_tenant_select" ON accounts
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "accounts_tenant_insert" ON accounts
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "accounts_tenant_update" ON accounts
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "accounts_tenant_delete" ON accounts
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- CONTACTS
-- ============================================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_tenant_select" ON contacts
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "contacts_tenant_insert" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "contacts_tenant_update" ON contacts
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "contacts_tenant_delete" ON contacts
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- OPPORTUNITIES
-- ============================================================================
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunities_tenant_select" ON opportunities
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "opportunities_tenant_insert" ON opportunities
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "opportunities_tenant_update" ON opportunities
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "opportunities_tenant_delete" ON opportunities
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- RESOURCES
-- ============================================================================
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_tenant_select" ON resources
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "resources_tenant_insert" ON resources
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "resources_tenant_update" ON resources
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- PROJECTS
-- ============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_tenant_select" ON projects
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "projects_tenant_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "projects_tenant_update" ON projects
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- SLAs
-- ============================================================================
ALTER TABLE slas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slas_tenant_select" ON slas
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "slas_tenant_insert" ON slas
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "slas_tenant_update" ON slas
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- PROPOSALS
-- ============================================================================
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_tenant_select" ON proposals
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "proposals_tenant_insert" ON proposals
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "proposals_tenant_update" ON proposals
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- CONTRACTS
-- ============================================================================
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_tenant_select" ON contracts
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "contracts_tenant_insert" ON contracts
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "contracts_tenant_update" ON contracts
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- AGENT LOGS
-- ============================================================================
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_logs_tenant_select" ON agent_logs
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "agent_logs_tenant_insert" ON agent_logs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- VERIFICATION: Test queries to confirm RLS isolation
-- ============================================================================
-- Run as user from tenant-001:
--   SELECT * FROM accounts; -- should only see ACME Corp's accounts
-- Run as user from tenant-002:
--   SELECT * FROM accounts; -- should only see Globex's accounts
-- Cross-tenant access should return 0 rows.
