'use client'

import { useState } from 'react'
import { Pencil, Trash2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteReceita } from '@/hooks/use-receitas'
import type { Receita, ReceitaTipo, ReceitaStatus } from '@/types/database'

const STATUS_CONFIG: Record<ReceitaStatus, { label: string; color: string }> = {
  previsto: { label: 'Previsto', color: 'bg-status-warning/20 text-status-warning' },
  confirmado: { label: 'Confirmado', color: 'bg-status-positive/20 text-status-positive' },
  cancelado: { label: 'Cancelado', color: 'bg-status-negative/20 text-status-negative' },
}

const TIPO_LABELS: Record<ReceitaTipo, string> = {
  setup: 'Setup',
  mensalidade: 'Mensalidade',
  projeto_avulso: 'Projeto Avulso',
  consultoria: 'Consultoria',
  mvp: 'MVP',
  outro: 'Outro',
}

interface ReceitasTableProps {
  receitas: Receita[] | undefined
  isLoading: boolean
  onEdit: (receita: Receita) => void
}

export function ReceitasTable({ receitas, isLoading, onEdit }: ReceitasTableProps) {
  const deleteMutation = useDeleteReceita()
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = receitas?.filter((r) => {
    if (filterTipo !== 'all' && r.tipo !== filterTipo) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    return true
  }) ?? []

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
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(TIPO_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
              <th className="text-left py-3 px-4 text-text-secondary font-medium">Data</th>
              <th className="text-left py-3 px-4 text-text-secondary font-medium">Cliente</th>
              <th className="text-left py-3 px-4 text-text-secondary font-medium">Tipo</th>
              <th className="text-right py-3 px-4 text-text-secondary font-medium">Valor Bruto</th>
              <th className="text-right py-3 px-4 text-text-secondary font-medium hidden sm:table-cell">Taxas</th>
              <th className="text-right py-3 px-4 text-text-secondary font-medium hidden md:table-cell">Líquido</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium">Status</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-secondary">
                  Nenhuma receita encontrada neste período.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-brand-blue-deep/10 hover:bg-bg-hover/50 cursor-pointer transition-colors"
                  onClick={() => onEdit(r)}
                >
                  <td className="py-3 px-4 text-text-primary">{formatDate(r.data)}</td>
                  <td className="py-3 px-4 text-text-primary font-medium">
                    {r.cliente}
                    {r.recorrente && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-blue/20 text-brand-cyan">
                        <RefreshCw className="h-2.5 w-2.5" /> REC
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">{TIPO_LABELS[r.tipo]}</td>
                  <td className="py-3 px-4 text-right text-status-positive font-medium">
                    {formatCurrency(r.valor_bruto)}
                  </td>
                  <td className="py-3 px-4 text-right text-text-secondary hidden sm:table-cell">
                    {formatCurrency(r.taxas)}
                  </td>
                  <td className="py-3 px-4 text-right text-text-primary font-medium hidden md:table-cell">
                    {formatCurrency(r.valor_liquido)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'inline-block text-[11px] font-semibold px-2 py-1 rounded-full',
                      STATUS_CONFIG[r.status].color
                    )}>
                      {STATUS_CONFIG[r.status].label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(r)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={deleteConfirm === r.id ? 'destructive' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
