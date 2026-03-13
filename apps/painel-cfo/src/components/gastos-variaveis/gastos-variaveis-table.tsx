'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteGastoVariavel } from '@/hooks/use-gastos-variaveis'
import type { GastoVariavel, GastoVariavelCategoria, GastoVariavelTipo, GastoVariavelStatus } from '@/types/database'

const STATUS_CONFIG: Record<GastoVariavelStatus, { label: string; color: string }> = {
  previsto: { label: 'Previsto', color: 'bg-status-warning/20 text-status-warning' },
  confirmado: { label: 'Confirmado', color: 'bg-status-positive/20 text-status-positive' },
}

const CATEGORIA_LABELS: Record<GastoVariavelCategoria, string> = {
  marketing: 'Marketing',
  operacional: 'Operacional',
  comercial: 'Comercial',
  impostos_variaveis: 'Impostos Variáveis',
  freelancer: 'Freelancer',
  api_consumo: 'API / Consumo',
  outro: 'Outro',
}

const TIPO_CONFIG: Record<GastoVariavelTipo, { label: string; badge: string }> = {
  marketing: { label: 'Marketing', badge: 'bg-purple-500/20 text-purple-400' },
  operacional: { label: 'Operacional', badge: 'bg-blue-500/20 text-blue-400' },
  comercial: { label: 'Comercial', badge: 'bg-amber-500/20 text-amber-400' },
  impostos: { label: 'Impostos', badge: 'bg-red-500/20 text-red-400' },
}

const TIPO_EMOJI: Record<GastoVariavelTipo, string> = {
  marketing: '\uD83D\uDCE2',
  operacional: '\u2699\uFE0F',
  comercial: '\uD83D\uDCBC',
  impostos: '\uD83E\uDDFE',
}

interface GastosVariaveisTableProps {
  gastos: GastoVariavel[] | undefined
  isLoading: boolean
  onEdit: (gasto: GastoVariavel) => void
}

export function GastosVariaveisTable({ gastos, isLoading, onEdit }: GastosVariaveisTableProps) {
  const deleteMutation = useDeleteGastoVariavel()
  const [filterCategoria, setFilterCategoria] = useState<string>('all')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = gastos?.filter((g) => {
    if (filterCategoria !== 'all' && g.categoria !== filterCategoria) return false
    if (filterTipo !== 'all' && g.tipo !== filterTipo) return false
    if (filterStatus !== 'all' && g.status !== filterStatus) return false
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
        <div className="w-44">
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
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
              <th className="text-left py-3 px-4 text-text-secondary font-medium">Descrição</th>
              <th className="text-left py-3 px-4 text-text-secondary font-medium hidden md:table-cell">Cliente</th>
              <th className="text-left py-3 px-4 text-text-secondary font-medium hidden sm:table-cell">Categoria</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium">Tipo</th>
              <th className="text-right py-3 px-4 text-text-secondary font-medium">Valor</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium">Status</th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-secondary">
                  Nenhum gasto variável encontrado neste período.
                </td>
              </tr>
            ) : (
              filtered.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-brand-blue-deep/10 hover:bg-bg-hover/50 cursor-pointer transition-colors"
                  onClick={() => onEdit(g)}
                >
                  <td className="py-3 px-4 text-text-primary">{formatDate(g.data)}</td>
                  <td className="py-3 px-4 text-text-primary font-medium">{g.descricao}</td>
                  <td className="py-3 px-4 text-text-secondary hidden md:table-cell">{g.cliente ?? '—'}</td>
                  <td className="py-3 px-4 text-text-secondary hidden sm:table-cell">{CATEGORIA_LABELS[g.categoria]}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full',
                      TIPO_CONFIG[g.tipo].badge
                    )}>
                      {TIPO_EMOJI[g.tipo]} {TIPO_CONFIG[g.tipo].label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-status-negative font-medium">
                    {formatCurrency(g.valor)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'inline-block text-[11px] font-semibold px-2 py-1 rounded-full',
                      STATUS_CONFIG[g.status].color
                    )}>
                      {STATUS_CONFIG[g.status].label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(g)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={deleteConfirm === g.id ? 'destructive' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(g.id)}
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
