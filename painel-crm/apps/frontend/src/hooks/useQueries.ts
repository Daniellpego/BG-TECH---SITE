'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import type { Lead, Opportunity, KpiData, PipelineData, RevenueData, Project, SLA, Proposal, Account } from '@/types';

// ── Leads ──────────────────────────────────
export function useLeads(filters?: { status?: string; temperature?: string }) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => api.getLeads(),
    select: (data) => {
      let leads = data.data;
      if (filters?.status) leads = leads.filter((l) => l.lead_status === filters.status);
      if (filters?.temperature) leads = leads.filter((l) => l.lead_temperature === filters.temperature);
      return leads;
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => api.getLead(id),
    enabled: !!id,
  });
}

export function useQualifyLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) =>
      api.runAgent('qualification', { leadId }),
    onSuccess: (_, leadId) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leads', leadId] });
    },
  });
}

// ── Opportunities / Pipeline ───────────────
export function useOpportunities() {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: () => api.getOpportunities(),
    select: (data) => data.data,
  });
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => api.getOpportunity(id),
    enabled: !!id,
  });
}

export function usePipeline() {
  return useQuery({
    queryKey: ['pipeline'],
    queryFn: () => api.getPipeline(),
    select: (data) => data.data,
  });
}

// ── Dashboard KPIs ─────────────────────────
export function useKpis() {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.getKpis(),
    refetchInterval: 60000, // refresh every minute
  });
}

export function useRevenue() {
  return useQuery({
    queryKey: ['revenue'],
    queryFn: () => api.getRevenue(),
    select: (data) => data.data,
  });
}

// ── Projects ───────────────────────────────
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
    select: (data) => data.data,
  });
}

// ── SLAs ───────────────────────────────────
export function useSlas() {
  return useQuery({
    queryKey: ['slas'],
    queryFn: () => api.getSlas(),
    select: (data) => data.data,
  });
}

// ── Proposals ──────────────────────────────
export function useProposals() {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: () => api.getProposals(),
    select: (data) => data.data,
  });
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: ['proposals', id],
    queryFn: () => api.getProposal(id),
    enabled: !!id,
  });
}

// ── Accounts ───────────────────────────────
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.getAccounts(),
    select: (data) => data.data,
  });
}

// ── Agents ─────────────────────────────────
export function useRunAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentType, params }: { agentType: string; params: Record<string, unknown> }) =>
      api.runAgent(agentType, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
