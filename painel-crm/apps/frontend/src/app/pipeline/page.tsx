'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Opportunity } from '@/types';

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'border-slate-500' },
  { key: 'qualified', label: 'Qualificado', color: 'border-blue-500' },
  { key: 'proposal', label: 'Proposta', color: 'border-purple-500' },
  { key: 'negotiation', label: 'Negociação', color: 'border-amber-500' },
  { key: 'closed_won', label: 'Ganho', color: 'border-emerald-500' },
  { key: 'closed_lost', label: 'Perdido', color: 'border-red-500' },
] as const;

export default function PipelinePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated) return;

    api
      .getOpportunities()
      .then((res) => setOpportunities(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, isLoading, router]);

  if (loading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const byStage = STAGES.map((s) => ({
    ...s,
    items: opportunities.filter((o) => o.stage === s.key),
    total: opportunities
      .filter((o) => o.stage === s.key)
      .reduce((sum, o) => sum + o.value, 0),
  }));

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        <p className="text-sm text-slate-400">Visão Kanban das oportunidades</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {byStage.map((stage) => (
          <div key={stage.key} className="min-w-[280px] flex-1">
            {/* Column Header */}
            <div className={`mb-3 rounded-lg border-t-2 ${stage.color} bg-slate-800/50 px-4 py-3`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">{stage.label}</h3>
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
                  {stage.items.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{fmt(stage.total)}</p>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {stage.items.map((opp) => (
                <div
                  key={opp.id}
                  className="cursor-pointer rounded-lg border border-slate-700/50 bg-slate-800/70 p-4 transition-colors hover:border-slate-600/50 hover:bg-slate-800"
                  onClick={() => setExpanded(expanded === opp.id ? null : opp.id)}
                >
                  <p className="text-sm font-medium text-white">{opp.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{opp.account_name}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-semibold text-cyan-400">
                      <DollarSign className="h-3.5 w-3.5" />
                      {fmt(opp.value)}
                    </span>
                    <span className="text-xs text-slate-500">{opp.probability}%</span>
                  </div>

                  {/* Expanded details */}
                  {expanded === opp.id && (
                    <div className="mt-3 border-t border-slate-700/50 pt-3 space-y-2">
                      {opp.owner_name && (
                        <p className="text-xs text-slate-400">
                          Responsável: <span className="text-slate-300">{opp.owner_name}</span>
                        </p>
                      )}
                      {opp.expected_close_date && (
                        <p className="text-xs text-slate-400">
                          Fechamento esperado:{' '}
                          <span className="text-slate-300">
                            {new Date(opp.expected_close_date).toLocaleDateString('pt-BR')}
                          </span>
                        </p>
                      )}
                      {opp.source && (
                        <p className="text-xs text-slate-400">
                          Origem: <span className="text-slate-300">{opp.source}</span>
                        </p>
                      )}
                      <button
                        className="mt-2 w-full rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/opportunities/${opp.id}`);
                        }}
                      >
                        Ver Detalhes →
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {stage.items.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-700/50 p-6 text-center text-xs text-slate-600">
                  Nenhuma oportunidade
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
