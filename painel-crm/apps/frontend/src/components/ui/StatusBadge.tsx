const STATUS_MAP: Record<string, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  qualified: { label: 'Qualificado', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  proposal: { label: 'Proposta', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  negotiation: { label: 'Negociação', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  closed_won: { label: 'Ganho', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  closed_lost: { label: 'Perdido', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  // Proposal statuses
  draft: { label: 'Rascunho', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  review: { label: 'Em Revisão', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  approved: { label: 'Aprovada', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  sent: { label: 'Enviada', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  accepted: { label: 'Aceita', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rejeitada', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  // Project statuses
  planning: { label: 'Planejamento', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  in_progress: { label: 'Em Andamento', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  on_hold: { label: 'Pausado', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  completed: { label: 'Concluído', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'Cancelado', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  // SLA tiers
  gold: { label: 'Gold', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  silver: { label: 'Silver', className: 'bg-slate-400/20 text-slate-300 border-slate-400/30' },
  bronze: { label: 'Bronze', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  // Contract
  active: { label: 'Ativo', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  expired: { label: 'Expirado', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
