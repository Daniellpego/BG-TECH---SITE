'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteCustoFixo } from '@/hooks/use-custos-fixos'
import type { CustoFixo, CustoFixoStatus } from '@/types/database'

const STATUS_CONFIG: Record<CustoFixoStatus, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'bg-status-positive/20 text-status-positive' },
  suspenso: { label: 'Suspenso', color: 'bg-status-warning/20 text-status-warning' },
  cancelado: { label: 'Cancelado', color: 'bg-status-negative/20 text-status-negative' },
}

const CATEGORIA_CONFIG: Record<string, { label: string; emoji: string }> = {
  ferramentas: { label: 'Ferramentas', emoji: '\uD83D\uDD27' },
  contabilidade: { label: 'Contabilidade', emoji: '\uD83D\uDCCA' },
  marketing: { label: 'Marketing', emoji: '\uD83D\uDCE2' },
  infraestrutura: { label: 'Infraestrutura', emoji: '\uD83C\uDFD7\uFE0F' },
  administrativo: { label: 'Administrativo', emoji: '\uD83D\uDCCB' },
  pro_labore: { label: 'Pró-labore', emoji: '\uD83D\uDCB0' },
  impostos_fixos: { label: 'Impostos', emoji: '\uD83E\uDDFE' },
  outro: { label: 'Outro', emoji: '\uD83D\uDCE6' },
}

const RECORRENCIA_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
  outro: 'Outro',
}

interface CustosFixosTableProps {
  custosFixos: CustoFixo[] | undefined
  isLoading: boolean
  onEdit: (custoFixo: CustoFixo) => void
}

export function CustosFixosTable({ custosFixos, isLoading, onEdit }: CustosFixosTableProps) {
  const deleteMutation = useDeleteCustoFixo()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = custosFixos
    ?.filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      return true
    })
    .sort((a, b) => Number(b.valor_mensal) - Number(a.valor_mensal)) ?? []

  function handleDelete(id: string) {
    if (deleteConfirm === id) {
      deleteMutation.mutate(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="card-glass space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="card-glass overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-blue-deep/20">
              <th className="text-left py-3 px-4 text-text-secondary font-medium">Nome</th>
              <th className="text-left py-3 px-4 text-text-secondary font-medium">Categoria</th>
              <th className="text-right py-3 px-4 text-text-secondary font-medium">Valor Mensal</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium hidden sm:table-cell">Vencimento</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium hidden md:table-cell">Recorrência</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium hidden md:table-cell">Obrigatório</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium">Status</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-secondary">
                  Nenhum custo fixo encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const catConfig = CATEGORIA_CONFIG[c.categoria] ?? { label: c.categoria, emoji: '' }
                return (
                  <tr
                    key={c.id}
                    className="border-b border-brand-blue-deep/10 hover:bg-bg-hover/50 cursor-pointer transition-colors"
                    onClick={() => onEdit(c)}
                  >
                    <td className="py-3 px-4 text-text-primary font-medium">{c.nome}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-brand-blue/20 text-brand-cyan">
                        <span>{catConfig.emoji}</span> {catConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-status-negative font-medium">
                      {formatCurrency(Number(c.valor_mensal))}
                    </td>
                    <td className="py-3 px-4 text-center text-text-secondary hidden sm:table-cell">
                      {c.dia_vencimento ? `Dia ${c.dia_vencimento}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-text-secondary hidden md:table-cell">
                      {RECORRENCIA_LABELS[c.recorrencia] ?? c.recorrencia}
                    </td>
                    <td className="py-3 px-4 text-center hidden md:table-cell">
                      {c.obrigatorio ? (
                        <span className="inline-block text-[11px] font-semibold px-2 py-1 rounded-full bg-status-warning/20 text-status-warning">Sim</span>
                      ) : (
                        <span className="inline-block text-[11px] font-semibold px-2 py-1 rounded-full bg-bg-hover text-text-secondary">Não</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn(
                        'inline-block text-[11px] font-semibold px-2 py-1 rounded-full',
                        STATUS_CONFIG[c.status].color
                      )}>
                        {STATUS_CONFIG[c.status].label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={deleteConfirm === c.id ? 'destructive' : 'ghost'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
