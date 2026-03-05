const STATUS_MAP: Record<string, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border)]' },
  qualified: { label: 'Qualificado', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  proposal: { label: 'Proposta', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  negotiation: { label: 'Negociação', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  closed_won: { label: 'Ganho', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  closed_lost: { label: 'Perdido', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  // Proposal statuses
  draft: { label: 'Rascunho', className: 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border)]' },
  review: { label: 'Em Revisão', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  approved: { label: 'Aprovada', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  sent: { label: 'Enviada', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  accepted: { label: 'Aceita', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  rejected: { label: 'Rejeitada', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  // Project statuses
  planning: { label: 'Planejamento', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  in_progress: { label: 'Em Andamento', className: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  on_hold: { label: 'Pausado', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  completed: { label: 'Concluído', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  cancelled: { label: 'Cancelado', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  // SLA tiers
  gold: { label: 'Gold', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  silver: { label: 'Silver', className: 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border)]' },
  bronze: { label: 'Bronze', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  // Contract
  active: { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  expired: { label: 'Expirado', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    className: 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] border-[var(--border)]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
