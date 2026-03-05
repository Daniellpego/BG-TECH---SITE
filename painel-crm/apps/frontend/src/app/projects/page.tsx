'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Project } from '@/types';

export default function ProjectsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated) return;

    api
      .getProjects()
      .then((res) => setProjects(res.data || []))
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

  const fmt = (v: number) => `${v.toFixed(1)}%`;
  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Projetos</h1>
        <p className="text-sm text-[var(--text-secondary)]">Gestão de projetos e entregas</p>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: 'Projeto' },
          { key: 'account_name', header: 'Conta' },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <StatusBadge status={row.status as string} />,
          },
          {
            key: 'estimated_margin',
            header: 'Margem Est.',
            render: (row) => (
              <span className="text-emerald-400">{fmt(row.estimated_margin as number)}</span>
            ),
          },
          {
            key: 'real_margin',
            header: 'Margem Real',
            render: (row) => {
              const val = row.real_margin as number;
              const est = row.estimated_margin as number;
              const color = val >= est ? 'text-emerald-400' : 'text-red-400';
              return <span className={color}>{fmt(val)}</span>;
            },
          },
          {
            key: 'hours',
            header: 'Horas (real/orçado)',
            render: (row) => {
              const actual = row.actual_hours as number;
              const budget = row.estimated_hours as number;
              const pct = budget > 0 ? (actual / budget) * 100 : 0;
              const barColor = pct > 100 ? 'bg-red-500' : pct > 85 ? 'bg-amber-500' : 'bg-cyan-500';
              return (
                <div className="min-w-[120px]">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">
                      {actual}h / {budget}h
                    </span>
                    <span className="text-[var(--text-tertiary)]">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            },
          },
          {
            key: 'milestones',
            header: 'Milestones',
            sortable: false,
            render: (row) => {
              const milestones = (row.milestones as Project['milestones']) || [];
              const completed = milestones.filter((m) => m.status === 'completed').length;
              return (
                <span className="text-xs text-[var(--text-secondary)]">
                  {completed}/{milestones.length} concluídos
                </span>
              );
            },
          },
        ]}
        data={projects as unknown as Record<string, unknown>[]}
        keyExtractor={(row) => row.id as string}
        emptyMessage="Nenhum projeto encontrado."
      />
    </div>
  );
}
