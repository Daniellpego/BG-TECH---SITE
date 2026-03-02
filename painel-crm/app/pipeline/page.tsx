'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleDot, KanbanSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Opportunity = {
  id: string;
  title?: string;
  value?: number;
  stage?: string;
  [key: string]: unknown;
};

const INITIAL_COLUMNS = [
  'Qualificação Técnica',
  'Scoping Técnico',
  'POC',
  'Negociação Jurídica',
  'Closed Won',
  'Closed Lost',
];

export default function PipelinePage() {
  const [columns] = useState<string[]>(INITIAL_COLUMNS);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunities() {
      const { data, error } = await supabase.from('crm_opportunities').select('*');

      if (!error && data) {
        setOpportunities(data as Opportunity[]);
      }

      setLoading(false);
    }

    fetchOpportunities();
  }, []);

  const groupedByStage = useMemo(() => {
    return columns.reduce<Record<string, Opportunity[]>>((accumulator, stage) => {
      accumulator[stage] = opportunities.filter((item) => item.stage === stage);
      return accumulator;
    }, {});
  }, [columns, opportunities]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-slate-100">
          <KanbanSquare className="h-6 w-6 text-sky-300" />
          Pipeline de Vendas
        </h1>
        <p className="mt-2 text-sm text-slate-300">Visão Kanban com estilo glassmorphism para acompanhamento das oportunidades.</p>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((stage) => (
          <article
            key={stage}
            className="min-h-[520px] min-w-[280px] rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-sm font-semibold text-slate-200">{stage}</h2>
              <span className="rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-300">
                {groupedByStage[stage]?.length ?? 0}
              </span>
            </div>

            <div className="space-y-3">
              {(groupedByStage[stage] ?? []).map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="rounded-xl border border-white/10 bg-[#03050a]/40 p-3 backdrop-blur-md"
                >
                  <p className="text-sm font-medium text-slate-100">{opportunity.title || 'Oportunidade sem título'}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {typeof opportunity.value === 'number'
                      ? opportunity.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'Valor não informado'}
                  </p>
                </div>
              ))}

              {!loading && (groupedByStage[stage]?.length ?? 0) === 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 p-3 text-xs text-slate-400">
                  <CircleDot className="h-4 w-4" />
                  Sem oportunidades nesta etapa
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
