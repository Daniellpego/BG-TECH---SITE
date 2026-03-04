'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Proposal } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { CheckCircle, AlertTriangle, FileText, Shield } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import * as api from '@/lib/api';

export default function ProposalDetailPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      api.getProposals()
        .then((res) => {
          const match = res.data?.find((p: Proposal) => p.id === params.id);
          setProposal(match ?? null);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <div className="p-8 text-slate-400">Carregando...</div>;
  if (!proposal) return <div className="p-8 text-red-400">Proposta não encontrada</div>;

  const verification = proposal.verification_log as any;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{proposal.title}</h1>
          <p className="text-slate-400">Proposta #{proposal.id.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={proposal.status} />
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">
            Aprovar
          </button>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
            Enviar ao Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Conteúdo da Proposta
            </h2>
            <div
              className="prose prose-invert max-w-none text-slate-300"
              dangerouslySetInnerHTML={{ __html: proposal.content || '<p>Sem conteúdo</p>' }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Detalhes</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Valor Estimado</p>
                <p className="text-lg font-bold text-white">
                  R$ {(proposal.value || 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Válida até</p>
                <p className="text-sm text-white">
                  {proposal.valid_until
                    ? new Date(proposal.valid_until).toLocaleDateString('pt-BR')
                    : 'Não definida'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Criada em</p>
                <p className="text-sm text-white">
                  {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Verification */}
          {verification && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Verificação ({verification.score}%)
              </h3>
              <div className="space-y-2">
                {verification.checks?.map((check: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {check.status === 'pass' ? (
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    )}
                    <span className={check.status === 'pass' ? 'text-slate-300' : 'text-yellow-300'}>
                      {check.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          {proposal.risk_score != null && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Risco</h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {proposal.risk_score}
                </p>
                <p className="text-xs text-slate-500">Risk Score (0-100)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
