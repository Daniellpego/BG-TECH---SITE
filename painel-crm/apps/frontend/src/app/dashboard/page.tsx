'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Target,
  TrendingUp,
  BarChart3,
  FolderKanban,
  Repeat,
  AlertTriangle,
} from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import { AnimatedKpiCard } from '@/components/ui/AnimatedKpiCard';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/PageTransition';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import PipelineChart from '@/components/charts/PipelineChart';
import RevenueChart from '@/components/charts/RevenueChart';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { KpiData, Opportunity, SLA } from '@/types';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [recentOpps, setRecentOpps] = useState<Opportunity[]>([]);
  const [expiringSlas, setExpiringSlas] = useState<SLA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [kpiRes, oppsRes, slasRes] = await Promise.all([
          api.getKpis(),
          api.getOpportunities(),
          api.getSlas(),
        ]);
        setKpis(kpiRes);

        // Last 5 opportunities sorted by date
        const sorted = (oppsRes.data || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentOpps(sorted);

        // SLAs expiring in < 90 days
        const now = new Date();
        const ninety = 90 * 24 * 60 * 60 * 1000;
        const expiring = (slasRes.data || []).filter((s) => {
          const renewal = new Date(s.renewal_date);
          return renewal.getTime() - now.getTime() < ninety && s.is_active;
        });
        setExpiringSlas(expiring);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated, isLoading, router]);

  if (loading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">Visão executiva do CRM</p>
      </div>

      {/* KPI Cards (animated) */}
      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StaggerItem>
          <AnimatedKpiCard
            title="Pipeline Total"
            value={kpis?.total_pipeline_value ?? 0}
            prefix="R$ "
            change={12.5}
            icon={<DollarSign className="h-5 w-5" />}
            delay={0}
          />
        </StaggerItem>
        <StaggerItem>
          <AnimatedKpiCard
            title="Oportunidades"
            value={kpis?.opportunities_count ?? 0}
            change={8.2}
            icon={<Target className="h-5 w-5" />}
            delay={100}
          />
        </StaggerItem>
        <StaggerItem>
          <AnimatedKpiCard
            title="Win Rate"
            value={Math.round(kpis?.win_rate ?? 0)}
            suffix="%"
            change={3.1}
            icon={<TrendingUp className="h-5 w-5" />}
            delay={200}
          />
        </StaggerItem>
        <StaggerItem>
          <AnimatedKpiCard
            title="Ticket Médio"
            value={kpis?.avg_deal_size ?? 0}
            prefix="R$ "
            change={-2.4}
            icon={<BarChart3 className="h-5 w-5" />}
            delay={300}
          />
        </StaggerItem>
        <StaggerItem>
          <AnimatedKpiCard
            title="Projetos Ativos"
            value={kpis?.active_projects ?? 0}
            change={0}
            icon={<FolderKanban className="h-5 w-5" />}
            delay={400}
          />
        </StaggerItem>
        <StaggerItem>
          <AnimatedKpiCard
            title="MRR"
            value={kpis?.mrr ?? 0}
            prefix="R$ "
            change={5.7}
            icon={<Repeat className="h-5 w-5" />}
            delay={500}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PipelineChart data={kpis?.pipeline_by_stage || []} />
        <RevenueChart data={kpis?.revenue_by_month || []} />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Opportunities */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Oportunidades Recentes</h2>
          <DataTable
            columns={[
              { key: 'title', header: 'Título' },
              { key: 'account_name', header: 'Conta' },
              {
                key: 'stage',
                header: 'Estágio',
                render: (row) => <StatusBadge status={row.stage as string} />,
              },
              {
                key: 'value',
                header: 'Valor',
                render: (row) => fmt(row.value as number),
              },
            ]}
            data={recentOpps as unknown as Record<string, unknown>[]}
            onRowClick={(row) => router.push(`/opportunities/${row.id}`)}
            keyExtractor={(row) => row.id as string}
          />
        </div>

        {/* Expiring SLAs */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">SLAs Expirando</h2>
          {expiringSlas.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center text-sm text-[var(--text-tertiary)]">
              Nenhum SLA próximo do vencimento
            </div>
          ) : (
            <div className="space-y-3">
              {expiringSlas.map((sla) => {
                const daysLeft = Math.ceil(
                  (new Date(sla.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={sla.id}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">{sla.account_name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Renova em {daysLeft} dias •{' '}
                          <StatusBadge status={sla.tier} />
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
