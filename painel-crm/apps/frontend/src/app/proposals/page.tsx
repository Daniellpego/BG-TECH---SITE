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

  if (loading) return <div className="p-8 text-[var(--text-secondary)]">Carregando propostas...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Propostas</h1>
          <p className="text-[var(--text-secondary)]">{proposals.length} propostas no total</p>
        </div>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal) => (
          <Link
            key={proposal.id}
            href={`/proposals/${proposal.id}`}
            className="block bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] p-6 hover:border-[var(--primary)]/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-[var(--bg-hover)] rounded-xl">
                  <FileText className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text)]">{proposal.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Valor: R$ {(proposal.value || 0).toLocaleString('pt-BR')}
                  </p>
                  {proposal.valid_until && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
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
          <div className="text-center py-12 text-[var(--text-tertiary)]">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma proposta encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
