'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CircleDot, KanbanSquare, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Opportunity = {
  id: string;
  title?: string;
  value?: number;
  stage?: string;
  [key: string]: unknown;
};

type Account = {
  id: string;
  company_name: string;
};

type FormData = {
  title: string;
  account_id: string;
  value: string;
  stage: string;
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
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    account_id: '',
    value: '',
    stage: INITIAL_COLUMNS[0],
  });

  useEffect(() => {
    fetchOpportunities();
    fetchAccounts();
  }, []);

  async function fetchOpportunities() {
    const { data, error } = await supabase.from('crm_opportunities').select('*');

    if (!error && data) {
      setOpportunities(data as Opportunity[]);
    }

    setLoading(false);
  }

  async function fetchAccounts() {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .select('id, company_name');

      if (error) throw error;

      setAvailableAccounts((data as Account[]) || []);
    } catch (err) {
      console.error('Erro ao buscar contas:', err);
    }
  }

  async function handleCreateOpportunity(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim() || !formData.account_id || !formData.value) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('crm_opportunities').insert([
        {
          title: formData.title.trim(),
          account_id: formData.account_id,
          value: parseFloat(formData.value),
          stage: formData.stage,
        },
      ]);

      if (error) throw error;

      // Fecha modal e reseta form
      setShowModal(false);
      setFormData({
        title: '',
        account_id: '',
        value: '',
        stage: INITIAL_COLUMNS[0],
      });

      // Recarrega oportunidades
      await fetchOpportunities();
    } catch (err: any) {
      console.error('Erro ao criar oportunidade:', err);
      alert('Erro ao criar oportunidade: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMoveStage(oppId: string, currentStage: string) {
    try {
      const currentIndex = INITIAL_COLUMNS.indexOf(currentStage);
      
      // Se for a última etapa, não permite avançar
      if (currentIndex >= INITIAL_COLUMNS.length - 1) {
        alert('Esta oportunidade já está na última etapa');
        return;
      }

      const nextStage = INITIAL_COLUMNS[currentIndex + 1];

      const { error } = await supabase
        .from('crm_opportunities')
        .update({ stage: nextStage })
        .eq('id', oppId);

      if (error) throw error;

      await fetchOpportunities();
    } catch (err: any) {
      console.error('Erro ao mover oportunidade:', err);
      alert('Erro ao mover oportunidade: ' + (err.message || 'Erro desconhecido'));
    }
  }

  async function handleDeleteOpportunity(oppId: string) {
    try {
      if (!confirm('Tem certeza que deseja excluir esta oportunidade?')) {
        return;
      }

      const { error } = await supabase
        .from('crm_opportunities')
        .delete()
        .eq('id', oppId);

      if (error) throw error;

      await fetchOpportunities();
    } catch (err: any) {
      console.error('Erro ao deletar oportunidade:', err);
      alert('Erro ao deletar oportunidade: ' + (err.message || 'Erro desconhecido'));
    }
  }

  const groupedByStage = useMemo(() => {
    return columns.reduce<Record<string, Opportunity[]>>((accumulator, stage) => {
      accumulator[stage] = opportunities.filter((item) => item.stage === stage);
      return accumulator;
    }, {});
  }, [columns, opportunities]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-semibold text-slate-100">
              <KanbanSquare className="h-6 w-6 text-sky-300" />
              Pipeline de Vendas
            </h1>
            <p className="mt-2 text-sm text-slate-300">Visão Kanban com estilo glassmorphism para acompanhamento das oportunidades.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg text-white hover:from-sky-600 hover:to-sky-700 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nova Oportunidade
          </button>
        </div>
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
              {(groupedByStage[stage] ?? []).map((opportunity) => {
                const isLastStage = stage === INITIAL_COLUMNS[INITIAL_COLUMNS.length - 1];
                return (
                  <div
                    key={opportunity.id || `temp-${Math.random()}`}
                    className="rounded-xl border border-white/10 bg-[#03050a]/40 backdrop-blur-md overflow-hidden"
                  >
                    <div className="p-3">
                      <p className="text-sm font-medium text-slate-100">{opportunity.title || 'Sem Título'}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {typeof opportunity.value === 'number'
                          ? opportunity.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'Valor não informado'}
                      </p>
                    </div>

                    {/* Ação Rápida (Rodapé do Card) */}
                    <div className="border-t border-white/10 px-3 py-2 flex items-center justify-between bg-white/5">
                      <button
                        onClick={() => handleMoveStage(opportunity.id, stage)}
                        disabled={isLastStage}
                        title={isLastStage ? 'Oportunidade já está na última etapa' : 'Avançar para próxima etapa'}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                          isLastStage
                            ? 'bg-white/5 text-white/40 cursor-not-allowed'
                            : 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Avançar
                      </button>
                      <button
                        onClick={() => handleDeleteOpportunity(opportunity.id)}
                        title="Deletar oportunidade"
                        className="p-1.5 rounded text-white/60 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

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

      {/* Modal de Nova Oportunidade */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#03050a] p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Nova Oportunidade</h2>
                <p className="mt-1 text-sm text-white/60">Preencha os dados para criar uma nova oportunidade</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Título da Oportunidade *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Implementação ERP - Empresa XYZ"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-sky-400 focus:bg-white/10 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Conta */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Conta *
                  </label>
                  <select
                    required
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-sky-400 focus:bg-white/10 focus:outline-none transition-all"
                  >
                    <option value="" className="bg-slate-900">
                      Selecione uma conta...
                    </option>
                    {availableAccounts.map((account) => (
                      <option key={account.id} value={account.id} className="bg-slate-900">
                        {account.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 50000.00"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-sky-400 focus:bg-white/10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Etapa */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Etapa *
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-sky-400 focus:bg-white/10 focus:outline-none transition-all"
                >
                  {INITIAL_COLUMNS.map((stage) => (
                    <option key={stage} value={stage} className="bg-slate-900">
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-white hover:from-sky-600 hover:to-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Salvando...' : 'Criar Oportunidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
