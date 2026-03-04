'use client';

import { useEffect, useState } from 'react';
import { getProposals } from '@/lib/api';
import { Proposal } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { FileText, Plus, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProposals().then((r: any) => setProposals(r.data || r)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-400">Carregando propostas...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Propostas</h1>
          <p className="text-slate-400">{proposals.length} propostas no total</p>
        </div>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal) => (
          <Link
            key={proposal.id}
            href={`/proposals/${proposal.id}`}
            className="block bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{proposal.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Valor: R$ {(proposal.value || 0).toLocaleString('pt-BR')}
                  </p>
                  {proposal.valid_until && (
                    <p className="text-xs text-slate-500 mt-1">
                      Válida até: {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              <StatusBadge status={proposal.status} />
            </div>
          </Link>
        ))}

        {proposals.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma proposta encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
