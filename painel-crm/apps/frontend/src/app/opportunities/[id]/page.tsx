'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  FileText,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Opportunity, Proposal, AgentLog } from '@/types';

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState<string | null>(null);
  const [agentResult, setAgentResult] = useState<AgentLog | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated || !id) return;

    async function load() {
      try {
        const [oppRes, proposalsRes] = await Promise.all([
          api.getOpportunity(id),
          api.getProposals(),
        ]);
        setOpp(oppRes);
        setProposals((proposalsRes.data || []).filter((p) => p.opportunity_id === id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isAuthenticated, authLoading, router]);

  async function runAgentAction(agentType: string) {
    if (!id) return;
    setAgentRunning(agentType);
    setAgentResult(null);
    try {
      const result = await api.runAgent(agentType, { opportunity_id: id });
      setAgentResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAgentRunning(null);
    }
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Oportunidade não encontrada
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">{opp.title}</h1>
          <p className="text-sm text-slate-400">{opp.account_name}</p>
        </div>
        <StatusBadge status={opp.stage} className="text-sm px-3 py-1" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-300">Detalhes</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Valor" value={fmt(opp.value)} />
              <InfoField label="Moeda" value={opp.currency} />
              <InfoField label="Probabilidade" value={`${opp.probability}%`} />
              <InfoField label="Origem" value={opp.source || '—'} />
              <InfoField label="Responsável" value={opp.owner_name || '—'} />
              <InfoField
                label="Fechamento Esperado"
                value={
                  opp.expected_close_date
                    ? new Date(opp.expected_close_date).toLocaleDateString('pt-BR')
                    : '—'
                }
              />
            </div>
            {opp.description && (
              <div className="mt-4 border-t border-slate-700/50 pt-4">
                <p className="text-xs font-medium text-slate-400 mb-1">Descrição</p>
                <p className="text-sm text-slate-300">{opp.description}</p>
              </div>
            )}
          </div>

          {/* Qualification Data */}
          {opp.qualification_data && Object.keys(opp.qualification_data).length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-300">Dados de Qualificação</h2>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
                {JSON.stringify(opp.qualification_data, null, 2)}
              </pre>
            </div>
          )}

          {/* Linked Proposals */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-300">
              Propostas Vinculadas ({proposals.length})
            </h2>
            {proposals.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma proposta vinculada</p>
            ) : (
              <div className="space-y-3">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-700/30 bg-slate-900/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => router.push(`/proposals/${p.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{p.title}</p>
                      <p className="text-xs text-slate-400">{fmt(p.value)}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agent Result */}
          {agentResult && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
              <h2 className="mb-3 text-sm font-semibold text-cyan-400">Resultado do Agente</h2>
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={agentResult.status} />
                {agentResult.duration_ms && (
                  <span className="text-xs text-slate-500">
                    {(agentResult.duration_ms / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
                {JSON.stringify(agentResult.output_data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-300">Ações de IA</h2>
            <div className="space-y-2">
              <AgentButton
                label="Qualificar Lead"
                icon={<Brain className="h-4 w-4" />}
                loading={agentRunning === 'qualification'}
                onClick={() => runAgentAction('qualification')}
              />
              <AgentButton
                label="Gerar Proposta"
                icon={<FileText className="h-4 w-4" />}
                loading={agentRunning === 'proposal_generation'}
                onClick={() => runAgentAction('proposal_generation')}
              />
              <AgentButton
                label="Avaliar Risco"
                icon={<ShieldAlert className="h-4 w-4" />}
                loading={agentRunning === 'risk_assessment'}
                onClick={() => runAgentAction('risk_assessment')}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-300">Informações</h2>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-500">ID</p>
                <p className="text-slate-300 font-mono">{opp.id}</p>
              </div>
              <div>
                <p className="text-slate-500">Criado em</p>
                <p className="text-slate-300">
                  {new Date(opp.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Atualizado em</p>
                <p className="text-slate-300">
                  {new Date(opp.updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm text-slate-200">{value}</p>
    </div>
  );
}

function AgentButton({
  label,
  icon,
  loading,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center gap-2 rounded-lg border border-slate-600/50 bg-slate-700/30 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700/60 hover:text-white disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}
