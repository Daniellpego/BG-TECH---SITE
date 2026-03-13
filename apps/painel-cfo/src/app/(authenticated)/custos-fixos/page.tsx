'use client'

import { useState, useMemo } from 'react'
import { Wallet, Plus, DollarSign, Calendar, Percent, Flame } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useCustosFixos } from '@/hooks/use-custos-fixos'
import { useReceitas } from '@/hooks/use-receitas'
import { CustoFixoForm } from '@/components/custos-fixos/custo-fixo-form'
import { CustosFixosTable } from '@/components/custos-fixos/custos-fixos-table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion'
import type { CustoFixo } from '@/types/database'

const CATEGORIA_COLORS: Record<string, string> = {
  ferramentas: '#06b6d4',
  contabilidade: '#8b5cf6',
  marketing: '#f59e0b',
  infraestrutura: '#10b981',
  administrativo: '#6366f1',
  pro_labore: '#ec4899',
  impostos_fixos: '#ef4444',
  outro: '#94a3b8',
}

const CATEGORIA_LABELS: Record<string, string> = {
  ferramentas: 'Ferramentas',
  contabilidade: 'Contabilidade',
  marketing: 'Marketing',
  infraestrutura: 'Infraestrutura',
  administrativo: 'Administrativo',
  pro_labore: 'Pró-labore',
  impostos_fixos: 'Impostos Fixos',
  outro: 'Outro',
}

interface PieTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>
}

function CustomTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item) return null
  return (
    <div className="tooltip-brand shadow-lg">
      <p className="text-xs text-text-secondary">{item.name}</p>
      <p className="text-sm font-bold text-text-primary">{formatCurrency(item.value)}</p>
      <p className="text-xs text-text-secondary">{(item.payload.percent * 100).toFixed(1)}%</p>
    </div>
  )
}

export default function CustosFixosPage() {
  const { data: custosFixos, isLoading } = useCustosFixos()
  const { data: receitas } = useReceitas()
  const [formOpen, setFormOpen] = useState(false)
  const [editCustoFixo, setEditCustoFixo] = useState<CustoFixo | null>(null)

  const kpis = useMemo(() => {
    const ativos = custosFixos?.filter((c) => c.status === 'ativo') ?? []
    const totalMensal = ativos.reduce((s, c) => s + Number(c.valor_mensal), 0)
    const totalAnual = totalMensal * 12

    const receitasConfirmadas = receitas?.filter((r) => r.status === 'confirmado') ?? []
    const receitaMes = receitasConfirmadas.reduce((s, r) => s + Number(r.valor_bruto), 0)
    const percentFaturamento = receitaMes > 0 ? (totalMensal / receitaMes) * 100 : 0

    const burnRateFixo = totalMensal

    return { totalMensal, totalAnual, percentFaturamento, burnRateFixo }
  }, [custosFixos, receitas])

  const pieData = useMemo(() => {
    const ativos = custosFixos?.filter((c) => c.status === 'ativo') ?? []
    const grouped: Record<string, number> = {}

    ativos.forEach((c) => {
      grouped[c.categoria] = (grouped[c.categoria] ?? 0) + Number(c.valor_mensal)
    })

    return Object.entries(grouped)
      .map(([categoria, valor]) => ({
        name: CATEGORIA_LABELS[categoria] ?? categoria,
        value: valor,
        color: CATEGORIA_COLORS[categoria] ?? '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value)
  }, [custosFixos])

  function handleEdit(custoFixo: CustoFixo) {
    setEditCustoFixo(custoFixo)
    setFormOpen(true)
  }

  function handleNew() {
    setEditCustoFixo(null)
    setFormOpen(true)
  }

  const cards = [
    { label: 'Custos Fixos/Mês', value: formatCurrency(kpis.totalMensal), icon: DollarSign, color: 'text-status-negative' },
    { label: 'Total Anual', value: formatCurrency(kpis.totalAnual), icon: Calendar, color: 'text-status-negative' },
    { label: '% do Faturamento', value: formatPercent(kpis.percentFaturamento), icon: Percent, color: kpis.percentFaturamento <= 50 ? 'text-status-positive' : 'text-status-negative' },
    { label: 'Burn Rate Fixo', value: formatCurrency(kpis.burnRateFixo), icon: Flame, color: 'text-status-warning' },
  ]

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-brand-cyan" />
          <h1 className="text-2xl font-bold text-text-primary">Custos Fixos</h1>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4" />
          Novo Custo Fixo
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="card-glass">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-7 w-28" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <card.icon className={cn('h-4 w-4', card.color)} />
                  <span className="text-xs text-text-secondary">{card.label}</span>
                </div>
                <p className={cn('text-lg font-bold', card.color)}>{card.value}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Chart + Table grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="card-glass lg:col-span-1">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Distribuição por Categoria</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-text-secondary text-sm">Nenhum custo ativo</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-text-secondary">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Table */}
        <div className="lg:col-span-2">
          <CustosFixosTable custosFixos={custosFixos} isLoading={isLoading} onEdit={handleEdit} />
        </div>
      </div>

      {/* Form Modal */}
      <CustoFixoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        custoFixo={editCustoFixo}
      />
    </div>
    </PageTransition>
  )
}
