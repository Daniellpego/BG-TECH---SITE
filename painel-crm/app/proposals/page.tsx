'use client';

import { useEffect, useState } from 'react';
import { Activity, Check, Download, FileSignature, FileText, Mail, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Proposal = {
  id: string;
  title: string;
  value: number;
  status: 'Rascunho' | 'Enviada' | 'Aprovada' | 'Recusada';
  sent_date: string;
  content?: string;
  crm_opportunities?: {
    id: string;
    title: string;
    crm_accounts: {
      company_name: string;
    }[];
  }[];
};

type Opportunity = {
  id: string;
  title: string;
  account_id: string;
  crm_accounts: {
    company_name: string;
  }[];
};

type FormData = {
  title: string;
  opportunity_id: string;
  value: string;
  status: 'Rascunho' | 'Enviada' | 'Aprovada' | 'Recusada';
  content: string;
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    opportunity_id: '',
    value: '',
    status: 'Rascunho',
    content: '',
  });

  useEffect(() => {
    fetchProposals();
    fetchOpportunities();
  }, []);

  async function fetchProposals() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('crm_proposals')
        .select(`
          id,
          title,
          value,
          status,
          sent_date,
          content,
          crm_opportunities (
            id,
            title,
            crm_accounts (
              company_name
            )
          )
        `)
        .order('sent_date', { ascending: false });

      if (supabaseError) throw supabaseError;

      setProposals((data as Proposal[]) || []);
    } catch (err: any) {
      console.error('Erro ao buscar propostas:', err);
      setError(err.message || 'Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  }

  async function fetchOpportunities() {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('id, title, account_id, crm_accounts(company_name)')
        .in('stage', ['Qualificação Técnica', 'Scoping Técnico', 'POC', 'Negociação Jurídica']);

      if (error) throw error;

      setOpportunities((data as Opportunity[]) || []);
    } catch (err) {
      console.error('Erro ao buscar oportunidades:', err);
    }
  }

  async function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim() || !formData.opportunity_id || !formData.value) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('crm_proposals').insert([
        {
          title: formData.title.trim(),
          opportunity_id: formData.opportunity_id,
          value: parseFloat(formData.value),
          status: formData.status,
          content: formData.content.trim() || null,
          sent_date: new Date().toISOString().split('T')[0],
        },
      ]);

      if (error) throw error;

      // Fecha modal e reseta form
      setIsModalOpen(false);
      setFormData({
        title: '',
        opportunity_id: '',
        value: '',
        status: 'Rascunho',
        content: '',
      });

      // Recarrega propostas
      await fetchProposals();
    } catch (err: any) {
      console.error('Erro ao criar proposta:', err);
      alert('Erro ao criar proposta: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(
    proposalId: string,
    newStatus: 'Aprovada' | 'Recusada'
  ) {
    try {
      const { error } = await supabase
        .from('crm_proposals')
        .update({ status: newStatus })
        .eq('id', proposalId);

      if (error) throw error;

      await fetchProposals();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status: ' + (err.message || 'Erro desconhecido'));
    }
  }

  async function handleDeleteProposal(proposalId: string) {
    if (!confirm('Tem certeza que deseja excluir esta proposta?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('crm_proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;

      await fetchProposals();
    } catch (err: any) {
      console.error('Erro ao deletar proposta:', err);
      alert('Erro ao deletar proposta: ' + (err.message || 'Erro desconhecido'));
    }
  }
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return {
          badge: 'bg-slate-500/20 text-slate-300',
          icon: FileSignature,
        };
      case 'Enviada':
        return {
          badge: 'bg-sky-500/20 text-sky-300',
          icon: Mail,
        };
      case 'Aprovada':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300',
          icon: Check,
        };
      case 'Recusada':
        return {
          badge: 'bg-rose-500/20 text-rose-300',
          icon: X,
        };
      default:
        return {
          badge: 'bg-slate-500/20 text-slate-300',
          icon: FileText,
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
              <FileText className="h-8 w-8 text-sky-400" />
              Propostas (CLM)
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Gestão do ciclo de vida de contratos e propostas
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-600"
          >
            <Plus className="h-5 w-5" />
            Gerar Proposta
          </button>
        </div>
      </header>

      {/* Estado de Carregamento */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl">
          <Activity className="mb-4 h-8 w-8 animate-spin text-sky-400" />
          <p className="text-slate-300">Carregando propostas...</p>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="text-sm font-medium text-rose-300">Erro: {error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && proposals.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl">
          <FileText className="mb-4 h-12 w-12 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-300">
            Nenhuma proposta cadastrada
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Clique em "Gerar Proposta" para começar
          </p>
        </div>
      )}

      {/* Tabela de Propostas */}
      {!loading && !error && proposals.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <table className="w-full">
              {/* Cabeçalho da Tabela */}
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                    Proposta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                    Valor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                    Data
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    Ações
                  </th>
                </tr>
              </thead>

              {/* Corpo da Tabela */}
              <tbody className="divide-y divide-white/10">
                {proposals.map((proposal) => {
                  const statusStyle = getStatusStyle(proposal.status);
                  const StatusIcon = statusStyle.icon;
                  const clientName =
                    proposal.crm_opportunities?.[0]?.crm_accounts?.[0]?.company_name ||
                    'Cliente não informado';

                  return (
                    <tr
                      key={proposal.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-100">
                          {clientName}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300">
                          {proposal.title}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-bold text-emerald-400">
                          {formatCurrency(proposal.value)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <span
                            className={`inline-block rounded-lg px-3 py-1 text-xs font-semibold ${statusStyle.badge}`}
                          >
                            {proposal.status}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-400">
                          {formatDate(proposal.sent_date)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {proposal.status === 'Enviada' && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(proposal.id, 'Aprovada')
                                }
                                className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20"
                                title="Aprovar"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(proposal.id, 'Recusada')
                                }
                                className="rounded-lg bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                                title="Recusar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            className="rounded-lg bg-white/10 p-2 text-slate-300 transition hover:bg-sky-500/20 hover:text-sky-300"
                            title="Baixar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProposal(proposal.id)}
                            className="rounded-lg bg-white/10 p-2 text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-300"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Resumo de Estatísticas */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Total de Propostas
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-100">
                {proposals.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Aprovadas
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">
                {proposals.filter((p) => p.status === 'Aprovada').length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Pendentes
              </p>
              <p className="mt-2 text-2xl font-bold text-sky-400">
                {proposals.filter((p) => p.status === 'Enviada').length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Valor Total
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">
                {formatCurrency(
                  proposals.reduce((sum, p) => sum + p.value, 0)
                )}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Modal de Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#03050a] p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Nova Proposta
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Preencha os dados para gerar uma nova proposta comercial
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-6">
              {/* Título */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Título da Proposta *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Implementação de Sistema ERP"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 transition-all focus:border-sky-400 focus:bg-white/10 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Oportunidade */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Oportunidade Origem *
                  </label>
                  <select
                    required
                    value={formData.opportunity_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        opportunity_id: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white transition-all focus:border-sky-400 focus:bg-white/10 focus:outline-none"
                  >
                    <option value="" className="bg-[#03050a]">
                      Selecione uma oportunidade
                    </option>
                    {opportunities.map((opp) => (
                      <option
                        key={opp.id}
                        value={opp.id}
                        className="bg-[#03050a]"
                      >
                        {opp.title} -{' '}
                        {opp.crm_accounts[0]?.company_name || 'Sem cliente'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valor */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Valor (R$) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 85000.00"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 transition-all focus:border-sky-400 focus:bg-white/10 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Status Inicial
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as
                        | 'Rascunho'
                        | 'Enviada'
                        | 'Aprovada'
                        | 'Recusada',
                    })
                  }
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white transition-all focus:border-sky-400 focus:bg-white/10 focus:outline-none"
                >
                  <option value="Rascunho" className="bg-[#03050a]">
                    Rascunho
                  </option>
                  <option value="Enviada" className="bg-[#03050a]">
                    Enviada
                  </option>
                  <option value="Aprovada" className="bg-[#03050a]">
                    Aprovada
                  </option>
                  <option value="Recusada" className="bg-[#03050a]">
                    Recusada
                  </option>
                </select>
              </div>

              {/* Conteúdo/Escopo */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Conteúdo / Escopo
                </label>
                <textarea
                  rows={6}
                  placeholder="Descreva o escopo da proposta, requisitos técnicos, prazos e condições comerciais..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 transition-all focus:border-sky-400 focus:bg-white/10 focus:outline-none"
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Criar Proposta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
