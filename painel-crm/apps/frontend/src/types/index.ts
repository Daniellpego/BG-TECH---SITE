// ── Tenant / Multi-tenancy ──────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'professional' | 'enterprise';
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── User ────────────────────────────────────────────────
export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'sales' | 'delivery' | 'viewer';
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

// ── Account ─────────────────────────────────────────────
export interface Account {
  id: string;
  tenant_id: string;
  name: string;
  cnpj?: string;
  segment?: string;
  tier?: 'enterprise' | 'mid_market' | 'smb';
  website?: string;
  address?: string;
  health_score?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Contact ─────────────────────────────────────────────
export interface Contact {
  id: string;
  account_id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  is_decision_maker: boolean;
  created_at: string;
}

// ── Opportunity ─────────────────────────────────────────
export interface Opportunity {
  id: string;
  tenant_id: string;
  account_id: string;
  account_name?: string;
  title: string;
  description?: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  currency: string;
  probability: number;
  expected_close_date?: string;
  owner_id?: string;
  owner_name?: string;
  qualification_data?: Record<string, unknown>;
  source?: string;
  created_at: string;
  updated_at: string;
}

// ── Resource ────────────────────────────────────────────
export interface Resource {
  id: string;
  tenant_id: string;
  name: string;
  role: string;
  skills: string[];
  cost_rate: number;
  bill_rate: number;
  availability: number;
  is_active: boolean;
}

// ── Project ─────────────────────────────────────────────
export interface Project {
  id: string;
  tenant_id: string;
  account_id: string;
  account_name?: string;
  opportunity_id?: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  estimated_hours: number;
  actual_hours: number;
  estimated_margin: number;
  real_margin: number;
  budget: number;
  milestones?: Milestone[];
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  name: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

// ── SLA ─────────────────────────────────────────────────
export interface SLA {
  id: string;
  tenant_id: string;
  account_id: string;
  account_name?: string;
  tier: 'gold' | 'silver' | 'bronze';
  response_time_hours: number;
  resolution_time_hours: number;
  uptime_target: number;
  monthly_value: number;
  renewal_date: string;
  is_active: boolean;
  metrics?: SLAMetric[];
  created_at: string;
  updated_at: string;
}

export interface SLAMetric {
  metric: string;
  target: number;
  actual: number;
  period: string;
}

// ── Proposal ────────────────────────────────────────────
export interface Proposal {
  id: string;
  tenant_id: string;
  opportunity_id: string;
  opportunity_title?: string;
  account_name?: string;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'approved' | 'sent' | 'accepted' | 'rejected';
  value: number;
  currency: string;
  valid_until?: string;
  risk_score?: number;
  verification_log?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ── Contract ────────────────────────────────────────────
export interface Contract {
  id: string;
  tenant_id: string;
  account_id: string;
  account_name?: string;
  proposal_id?: string;
  title: string;
  type: 'project' | 'sla' | 'hybrid';
  status: 'draft' | 'active' | 'expired' | 'cancelled';
  value: number;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

// ── Agent Log ───────────────────────────────────────────
export interface AgentLog {
  id: string;
  tenant_id: string;
  agent_type: string;
  action: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  status: 'running' | 'completed' | 'failed';
  duration_ms?: number;
  created_at: string;
}

// ── KPI / Charts ────────────────────────────────────────
export interface KpiData {
  total_pipeline_value: number;
  opportunities_count: number;
  win_rate: number;
  avg_deal_size: number;
  active_projects: number;
  mrr: number;
  pipeline_by_stage: PipelineData[];
  revenue_by_month: RevenueData[];
}

export interface PipelineData {
  stage: string;
  count: number;
  value: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  target?: number;
}
