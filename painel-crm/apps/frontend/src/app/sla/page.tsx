'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { SLA } from '@/types';

export default function SlaPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [slas, setSlas] = useState<SLA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated) return;

    api
      .getSlas()
      .then((res) => setSlas(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, isLoading, router]);

  if (loading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  const now = new Date();

  function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const expiring = slas.filter((s) => s.is_active && daysUntil(s.renewal_date) < 90 && daysUntil(s.renewal_date) > 0);
  const active = slas.filter((s) => s.is_active);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">SLAs</h1>
        <p className="text-sm text-[var(--text-secondary)]">Gestão de acordos de nível de serviço</p>
      </div>

      {/* Alert for expiring SLAs */}
      {expiring.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400">
              {expiring.length} SLA(s) expirando nos próximos 90 dias
            </h2>
          </div>
          <div className="space-y-2">
            {expiring.map((sla) => (
              <div key={sla.id} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{sla.account_name}</span>
                <span className="text-amber-400 text-xs">{daysUntil(sla.renewal_date)} dias restantes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLA Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {active.map((sla) => {
          const days = daysUntil(sla.renewal_date);
          const isExpiring = days < 90 && days > 0;

          return (
            <div
              key={sla.id}
              className={`rounded-2xl border p-5 transition-colors ${
                isExpiring
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-base font-semibold text-[var(--text)]">{sla.account_name}</p>
                  <StatusBadge status={sla.tier} className="mt-1" />
                </div>
                <ShieldCheck className={`h-5 w-5 ${isExpiring ? 'text-amber-400' : 'text-emerald-400'}`} />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-[var(--bg)] p-3">
                  <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] mb-1">
                    <Clock className="h-3 w-3" />
                    Resposta
                  </div>
                  <p className="text-sm font-semibold text-[var(--text)]">{sla.response_time_hours}h</p>
                </div>
                <div className="rounded-xl bg-[var(--bg)] p-3">
                  <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] mb-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Resolução
                  </div>
                  <p className="text-sm font-semibold text-[var(--text)]">{sla.resolution_time_hours}h</p>
                </div>
                <div className="rounded-xl bg-[var(--bg)] p-3">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Uptime</p>
                  <p className="text-sm font-semibold text-[var(--text)]">{sla.uptime_target}%</p>
                </div>
                <div className="rounded-xl bg-[var(--bg)] p-3">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Valor Mensal</p>
                  <p className="text-sm font-semibold text-[var(--primary)]">{fmtCurrency(sla.monthly_value)}</p>
                </div>
              </div>

              {/* SLA Metrics */}
              {sla.metrics && sla.metrics.length > 0 && (
                <div className="mb-4 space-y-2">
                  {sla.metrics.map((m, i) => {
                    const pct = m.target > 0 ? (m.actual / m.target) * 100 : 0;
                    const met = m.actual >= m.target;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-secondary)]">{m.metric}</span>
                          <span className={met ? 'text-emerald-400' : 'text-red-400'}>
                            {m.actual} / {m.target}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-700">
                          <div
                            className={`h-full rounded-full ${met ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Renewal */}
              <div className="border-t border-[var(--border)] pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-tertiary)]">Renovação</span>
                  <span className={isExpiring ? 'text-amber-400 font-semibold' : 'text-[var(--text-secondary)]'}>
                    {new Date(sla.renewal_date).toLocaleDateString('pt-BR')}
                    {isExpiring && ` (${days}d)`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {active.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-12 text-center text-[var(--text-tertiary)]">
          Nenhum SLA ativo encontrado.
        </div>
      )}
    </div>
  );
}
