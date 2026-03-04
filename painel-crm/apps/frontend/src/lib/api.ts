import type {
  Account,
  Opportunity,
  Project,
  SLA,
  Proposal,
  KpiData,
  PipelineData,
  RevenueData,
  Contract,
  AgentLog,
  Lead,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('crm_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }

  return res.json();
}

// ── Auth ────────────────────────────────────────────────
export async function login(email: string, password: string) {
  return request<{ token: string; user: { id: string; name: string; email: string; role: string } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
}

// ── Accounts ────────────────────────────────────────────
export async function getAccounts() {
  return request<{ data: Account[] }>('/accounts');
}

export async function getAccount(id: string) {
  return request<Account>(`/accounts/${id}`);
}

// ── Opportunities ───────────────────────────────────────
export async function getOpportunities() {
  return request<{ data: Opportunity[] }>('/opportunities');
}

export async function getOpportunity(id: string) {
  return request<Opportunity>(`/opportunities/${id}`);
}

// ── Projects ────────────────────────────────────────────
export async function getProjects() {
  return request<{ data: Project[] }>('/projects');
}

export async function getProject(id: string) {
  return request<Project>(`/projects/${id}`);
}

// ── SLAs ────────────────────────────────────────────────
export async function getSlas() {
  return request<{ data: SLA[] }>('/slas');
}

export async function getSla(id: string) {
  return request<SLA>(`/slas/${id}`);
}

// ── Proposals ───────────────────────────────────────────
export async function getProposals() {
  return request<{ data: Proposal[] }>('/proposals');
}

export async function getProposal(id: string) {
  return request<Proposal>(`/proposals/${id}`);
}

export async function updateProposal(id: string, data: Partial<Proposal>) {
  return request<Proposal>(`/proposals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ── Contracts ───────────────────────────────────────────
export async function getContracts() {
  return request<{ data: Contract[] }>('/contracts');
}

export async function getContract(id: string) {
  return request<Contract>(`/contracts/${id}`);
}

// ── KPIs / Dashboard ────────────────────────────────────
export async function getKpis() {
  return request<KpiData>('/kpis');
}

export async function getPipeline() {
  return request<{ data: PipelineData[] }>('/kpis/pipeline');
}

export async function getRevenue() {
  return request<{ data: RevenueData[] }>('/kpis/revenue');
}

// ── Agents ──────────────────────────────────────────────
export async function runAgent(agentType: string, params: Record<string, unknown>) {
  return request<AgentLog>('/agents/run', {
    method: 'POST',
    body: JSON.stringify({ agent_type: agentType, params }),
  });
}

// ── Leads ───────────────────────────────────────────────
export async function getLeads() {
  return request<{ data: Lead[] }>('/leads');
}

export async function getLead(id: string) {
  return request<Lead>(`/leads/${id}`);
}

export async function runLeadToProposal(opportunityId: string) {
  return request<{ opportunity: Opportunity; proposal: Proposal; logs: AgentLog[] }>(
    '/agents/lead-to-proposal',
    {
      method: 'POST',
      body: JSON.stringify({ opportunity_id: opportunityId }),
    }
  );
}
