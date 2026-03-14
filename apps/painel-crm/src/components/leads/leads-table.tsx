'use client'

import Link from 'next/link'
import { MessageCircle, Eye, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatTimeAgo, formatWhatsAppUrl, formatPhone } from '@/lib/format'
import type { Lead } from '@/types/database'
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, ORIGENS_LABELS, ORIGENS_COLORS } from '@/types/database'

interface LeadsTableProps {
  leads: Lead[] | undefined
  isLoading: boolean
}

function StatusBadge({ status }: { status: Lead['status'] }) {
  const label = LEAD_STATUS_LABELS[status] ?? 'Não definido'
  const color = LEAD_STATUS_COLORS[status] ?? '#94A3B8'
  return (
    <span
      className="text-xs font-semibold px-2.5 py-0.5 rounded-md"
      style={{ color, background: `${color}20` }}
    >
      {label}
    </span>
  )
}

function OrigemBadge({ origem }: { origem: string }) {
  const label = ORIGENS_LABELS[origem] ?? origem ?? 'Não definido'
  const color = ORIGENS_COLORS[origem] ?? '#94A3B8'
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-md"
      style={{ color, background: `${color}20` }}
    >
      {label}
    </span>
  )
}

function TemperaturaBadge({ temp }: { temp: string | null }) {
  if (!temp) return null
  const config: Record<string, { label: string; class: string }> = {
    quente: { label: 'Quente', class: 'badge-negative' },
    morno: { label: 'Morno', class: 'badge-warning' },
    frio: { label: 'Frio', class: 'badge-blue' },
  }
  const c = config[temp] ?? { label: temp, class: 'badge-cyan' }
  return <span className={c.class}>{c.label}</span>
}

export function LeadsTable({ leads, isLoading }: LeadsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    )
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="card-glass text-center py-12">
        <p className="text-text-secondary">Nenhum lead encontrado</p>
        <p className="text-sm text-text-dark mt-1">Crie um novo lead ou ajuste os filtros</p>
      </div>
    )
  }

  return (
    <div className="card-glass p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3 hidden sm:table-cell">Empresa</th>
              <th className="text-left p-3 hidden md:table-cell">WhatsApp</th>
              <th className="text-left p-3 hidden lg:table-cell">Origem</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3 hidden lg:table-cell">Temp.</th>
              <th className="text-right p-3 hidden md:table-cell">Valor</th>
              <th className="text-left p-3 hidden xl:table-cell">Criado</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="table-row">
                <td className="p-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{lead.nome}</p>
                    <p className="text-xs text-text-secondary sm:hidden">{lead.empresa}</p>
                  </div>
                </td>
                <td className="p-3 hidden sm:table-cell">
                  <p className="text-sm text-text-secondary">{lead.empresa ?? '-'}</p>
                </td>
                <td className="p-3 hidden md:table-cell">
                  {lead.whatsapp ? (
                    <a
                      href={formatWhatsAppUrl(lead.whatsapp, lead.nome)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-cyan hover:underline flex items-center gap-1"
                    >
                      {formatPhone(lead.whatsapp)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-text-dark">-</span>
                  )}
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <OrigemBadge origem={lead.origem} />
                </td>
                <td className="p-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <TemperaturaBadge temp={lead.temperatura} />
                </td>
                <td className="p-3 text-right hidden md:table-cell">
                  <span className="text-sm text-brand-cyan font-medium">
                    {(lead.valor_estimado || 0) > 0 ? formatCurrency(lead.valor_estimado) : '-'}
                  </span>
                </td>
                <td className="p-3 hidden xl:table-cell">
                  <span className="text-xs text-text-secondary">
                    {formatTimeAgo(lead.created_at)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {lead.whatsapp && (
                      <a
                        href={formatWhatsAppUrl(lead.whatsapp, lead.nome)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MessageCircle className="h-4 w-4 text-status-positive" />
                        </Button>
                      </a>
                    )}
                    <Link href={`/leads/${lead.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
