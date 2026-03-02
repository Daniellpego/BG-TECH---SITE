'use client';

import { Clock, Target, TrendingUp, Zap } from 'lucide-react';

export default function VisaoExecutiva() {
  const kpis = [
    {
      label: 'Sales Velocity (Mensal)',
      value: 'R$ 84.500',
      trend: '+12%',
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      label: 'Oportunidades Abertas',
      value: '24',
      trend: 'R$ 320k Pipeline',
      icon: Target,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
    },
    {
      label: 'Ciclo Médio de Vendas',
      value: '42 Dias',
      trend: '-3 dias',
      icon: Clock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      label: 'CAC Estimado',
      value: 'R$ 1.250',
      trend: 'vs LTV R$ 15k',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  return (
    <section className="animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Visão Executiva
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Métricas consolidadas de Engenharia de Receita
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {kpi.label}
                  </p>
                </div>
                <div className={`rounded-lg ${kpi.bgColor} p-2`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>

              <p className="text-3xl font-bold text-slate-100">{kpi.value}</p>

              <div className="mt-3">
                <span className="inline-block rounded bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300">
                  {kpi.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
