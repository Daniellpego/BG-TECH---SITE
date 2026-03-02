'use client';

import { Check, Download, FileSignature, FileText, Mail, Plus, X } from 'lucide-react';

type Proposal = {
  id: string;
  client_name: string;
  project_name: string;
  value: number;
  status: 'Rascunho' | 'Enviada' | 'Aprovada' | 'Recusada';
  sent_date: string;
};

const mockProposals: Proposal[] = [
  {
    id: '1',
    client_name: 'Tech Solutions Inc.',
    project_name: 'Implementação de CRM Agêntico',
    value: 85000,
    status: 'Aprovada',
    sent_date: '2026-02-15',
  },
  {
    id: '2',
    client_name: 'Digital Marketing Co.',
    project_name: 'Sistema de Automação de Marketing',
    value: 54000,
    status: 'Enviada',
    sent_date: '2026-02-20',
  },
  {
    id: '3',
    client_name: 'Innovation Labs',
    project_name: 'Dashboard de Análise de Dados',
    value: 42500,
    status: 'Rascunho',
    sent_date: '2026-02-28',
  },
  {
    id: '4',
    client_name: 'Enterprise Solutions',
    project_name: 'Integração de Sistemas Legados',
    value: 125000,
    status: 'Recusada',
    sent_date: '2026-01-30',
  },
];

export default function ProposalsPage() {
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
          <button className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-600">
            <Plus className="h-5 w-5" />
            Gerar Proposta
          </button>
        </div>
      </header>

      {/* Tabela de Propostas */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <table className="w-full">
          {/* Cabeçalho da Tabela */}
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                Cliente
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                Projeto
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                Valor
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                Data de Envio
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                Ações
              </th>
            </tr>
          </thead>

          {/* Corpo da Tabela */}
          <tbody className="divide-y divide-white/10">
            {mockProposals.map((proposal) => {
              const statusStyle = getStatusStyle(proposal.status);
              const StatusIcon = statusStyle.icon;

              return (
                <tr
                  key={proposal.id}
                  className="transition hover:bg-white/[0.03]"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-100">
                      {proposal.client_name}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-300">
                      {proposal.project_name}
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
                      <button
                        className="rounded-lg bg-white/10 p-2 text-slate-300 transition hover:bg-sky-500/20 hover:text-sky-300"
                        title="Baixar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-lg bg-white/10 p-2 text-slate-300 transition hover:bg-sky-500/20 hover:text-sky-300"
                        title="Enviar por Email"
                      >
                        <Mail className="h-4 w-4" />
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
            {mockProposals.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Aprovadas
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {mockProposals.filter((p) => p.status === 'Aprovada').length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Pendentes
          </p>
          <p className="mt-2 text-2xl font-bold text-sky-400">
            {mockProposals.filter((p) => p.status === 'Enviada').length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Valor Total
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {formatCurrency(mockProposals.reduce((sum, p) => sum + p.value, 0))}
          </p>
        </div>
      </div>
    </section>
  );
}
