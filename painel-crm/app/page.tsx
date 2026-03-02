'use client';

import { useEffect, useState } from 'react';
import { Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type DashboardData = {
  activeOpportunitiesCount: number;
  pipelineValue: number;
  closedWonCount: number;
  avgCycleDays: number;
};

export default function VisaoExecutiva() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    activeOpportunitiesCount: 0,
    pipelineValue: 0,
    closedWonCount: 0,
    avgCycleDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Buscar todas as oportunidades com campos necessários
        const { data: opportunities, error } = await supabase
          .from('crm_opportunities')
          .select('id, value, stage, created_at, updated_at');

        if (error) {
          console.error('Erro ao buscar oportunidades:', error);
          setLoading(false);
          return;
        }

        if (opportunities) {
          // 1. Oportunidades Abertas (não Closed Won e não Closed Lost)
          const activeOpportunities = opportunities.filter(
            (op) => op.stage !== 'Closed Won' && op.stage !== 'Closed Lost'
          );

          // 2. Valor do Pipeline (soma dos valores das oportunidades abertas)
          const totalPipelineValue = activeOpportunities.reduce(
            (sum, op) => sum + (op.value || 0),
            0
          );

          // 3. Oportunidades Fechadas Ganhas
          const closedWonOpportunities = opportunities.filter(
            (op) => op.stage === 'Closed Won'
          );

          // 4. Ciclo Médio de Vendas (média de dias entre created_at e updated_at para Closed Won)
          let avgCycleDays = 0;
          if (closedWonOpportunities.length > 0) {
            const totalDays = closedWonOpportunities.reduce((sum, op) => {
              if (op.created_at && op.updated_at) {
                const createdDate = new Date(op.created_at);
                const updatedDate = new Date(op.updated_at);
                const diffInMs = updatedDate.getTime() - createdDate.getTime();
                const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                return sum + diffInDays;
              }
              return sum;
            }, 0);

            avgCycleDays = Math.round(totalDays / closedWonOpportunities.length);
          }

          setDashboardData({
            activeOpportunitiesCount: activeOpportunities.length,
            pipelineValue: totalPipelineValue,
            closedWonCount: closedWonOpportunities.length,
            avgCycleDays: avgCycleDays,
          });
        }
      } catch (err) {
        console.error('Erro ao conectar Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Formatar valor em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const kpis = [
    {
      label: 'Sales Velocity (Mensal)',
      value: loading ? '...' : 'R$ --',
      trend: 'Requer 30 dias de dados',
      icon: Zap,
      color: 'text-slate-400',
      bgColor: 'bg-slate-400/10',
      trendColor: 'bg-slate-500/20 text-slate-400',
    },
    {
      label: 'Oportunidades Abertas',
      value: loading ? '...' : String(dashboardData.activeOpportunitiesCount),
      trend: loading
        ? 'Carregando...'
        : `${formatCurrency(dashboardData.pipelineValue)} Pipeline`,
      icon: Target,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
      trendColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      label: 'Ciclo Médio de Vendas',
      value: loading
        ? '...'
        : dashboardData.avgCycleDays > 0
        ? `${dashboardData.avgCycleDays} Dias`
        : 'Sem dados',
      trend:
        dashboardData.closedWonCount > 0
          ? `${dashboardData.closedWonCount} Closed Won`
          : 'Aguardando vendas',
      icon: Clock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      trendColor:
        dashboardData.avgCycleDays > 0
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-slate-500/20 text-slate-400',
    },
    {
      label: 'CAC Estimado',
      value: loading ? '...' : 'R$ --',
      trend: 'Integração Futura',
      icon: TrendingUp,
      color: 'text-slate-400',
      bgColor: 'bg-slate-400/10',
      trendColor: 'bg-slate-500/20 text-slate-400',
    },
  ];

  return (
    <section className="animate-in fade-in duration-500">
      {/* Banner de Boas-vindas */}
      <div className="mb-8 flex items-center gap-5 rounded-r-xl border-b border-l-4 border-l-sky-500 border-b-white/10 bg-gradient-to-r from-sky-500/15 to-black/50 p-5 animate-in slide-in-from-top-4 duration-500">
        <div className="flex-shrink-0 rounded-full bg-sky-500/20 p-3">
          <TrendingUp className="h-8 w-8 text-sky-400" />
        </div>
        <div>
          <h2 className="mb-1 text-2xl font-black text-white">
            Bem vindo, Brayan, o CSO mais baladeiro de Londrina! 🚀
          </h2>
          <p className="text-sm font-semibold text-sky-400">
            Seu cockpit de vendas da BG Tech está 100% sincronizado e pronto para bater a meta.
          </p>
        </div>
      </div>

      {/* Cabeçalho */}
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
                <span
                  className={`inline-block rounded px-2 py-1 text-xs font-medium ${kpi.trendColor}`}
                >
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
