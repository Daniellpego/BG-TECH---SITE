'use client';

import { useEffect, useState } from 'react';
import { Activity, Building2, CheckCircle2, Clock, Plus, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SLA = {
  id: string;
  monthly_value: number;
  start_date: string;
  end_date: string;
  status: string;
  crm_accounts: {
    company_name: string;
  } | null;
};

export default function SLAsPage() {
  const [slas, setSlas] = useState<SLA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSLAs();
  }, []);

  async function fetchSLAs() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('crm_slas')
        .select(
          'id, monthly_value, start_date, end_date, status, crm_accounts(company_name)'
        );

      if (supabaseError) throw supabaseError;

      setSlas((data as unknown as SLA[]) || []);
    } catch (err: any) {
      console.error('Erro ao buscar SLAs:', err);
      setError(err.message || 'Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  }

  const calculateDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return daysRemaining;
  };

  const getStatusStyle = (daysRemaining: number) => {
    if (daysRemaining > 90) {
      return {
        badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        dot: 'bg-emerald-500',
        label: 'Saudável',
        icon: CheckCircle2,
      };
    } else if (daysRemaining >= 30) {
      return {
        badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
        dot: 'bg-yellow-500',
        label: 'Atenção',
        icon: Clock,
      };
    } else {
      return {
        badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        dot: 'bg-rose-500',
        label: 'Crítico',
        icon: ShieldAlert,
      };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <section className="animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <header className="mb-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-100">
              <Activity className="h-8 w-8 text-sky-400" />
              Contratos & SLAs
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Radar de renovação e análise de saúde contratual
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-600">
            <Plus className="h-5 w-5" />
            Novo Contrato
          </button>
        </div>
      </header>

      {/* Estado de Carregamento */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl">
          <Activity className="mb-4 h-8 w-8 animate-spin text-sky-400" />
          <p className="text-slate-300">Carregando contratos...</p>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="text-sm font-medium text-rose-300">Erro: {error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && slas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl">
          <Activity className="mb-4 h-12 w-12 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-300">
            Nenhum contrato ativo
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Clique em "Novo Contrato" para cadastrar
          </p>
        </div>
      )}

      {/* Lista de Contratos */}
      {!loading && !error && slas.length > 0 && (
        <div className="space-y-4">
          {slas.map((sla) => {
            const daysRemaining = calculateDaysRemaining(sla.end_date);
            const statusStyle = getStatusStyle(daysRemaining);
            const StatusIcon = statusStyle.icon;

            return (
              <article
                key={sla.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-sky-400/30 hover:bg-white/[0.08]"
              >
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  {/* Informações Principais */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-sky-400" />
                      <h3 className="text-lg font-bold text-slate-100">
                        {sla.crm_accounts?.company_name || 'Cliente Desconhecido'}
                      </h3>
                    </div>

                    {/* Detalhes do Contrato */}
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                          Valor Mensal
                        </p>
                        <p className="mt-1 text-sm font-bold text-emerald-400">
                          {formatCurrency(sla.monthly_value)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                          Início
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {formatDate(sla.start_date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                          Término
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {formatDate(sla.end_date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                          Status Contrato
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {sla.status || 'Ativo'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Badge de Dias Restantes */}
                  <div className="flex w-full flex-shrink-0 flex-col items-center sm:w-auto">
                    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${statusStyle.badge}`}>
                      <StatusIcon className="h-5 w-5" />
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {daysRemaining > 0 ? daysRemaining : 0}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-widest">
                          {daysRemaining > 0 ? 'Dias' : 'Vencido'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {statusStyle.label}
                    </p>
                  </div>
                </div>

                {/* Indicador Visual de Progresso */}
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full transition-all duration-500 ${statusStyle.dot === 'bg-emerald-500' ? 'bg-emerald-500' : statusStyle.dot === 'bg-yellow-500' ? 'bg-yellow-500' : 'bg-rose-500'}`}
                    style={{
                      width: `${Math.min(100, ((sla.start_date ? new Date(sla.start_date).getTime() : new Date().getTime()) + (sla.end_date ? new Date(sla.end_date).getTime() - (sla.start_date ? new Date(sla.start_date).getTime() : 0) : 0) - new Date().getTime()) / ((sla.end_date ? new Date(sla.end_date).getTime() : new Date().getTime()) - (sla.start_date ? new Date(sla.start_date).getTime() : 0)) * 100) || 0}%`,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
