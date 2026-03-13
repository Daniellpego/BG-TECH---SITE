'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { Receipt, Plus, DollarSign, TrendingDown, TrendingUp, Megaphone, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { usePeriod } from '@/providers/period-provider'
import { useGastosVariaveis, useGastosVariaveisMesAnterior } from '@/hooks/use-gastos-variaveis'
import { GastoVariavelForm } from '@/components/gastos-variaveis/gasto-variavel-form'
import { GastosVariaveisTable } from '@/components/gastos-variaveis/gastos-variaveis-table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion'
import type { GastoVariavel, Receita } from '@/types/database'

function useReceitasConfirmadas() {
  const { startDate, endDate } = usePeriod()
  const supabase = createClient()

  return useQuery({
    queryKey: ['receitas-confirmadas-gv', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas')
        .select('*')
        .gte('data', startDate)
        .lte('data', endDate)
        .eq('status', 'confirmado')

      if (error) throw error
      return data as Receita[]
    },
  })
}

export default function GastosVariaveisPage() {
  const { data: gastos, isLoading } = useGastosVariaveis()
  const { data: gastosPrev } = useGastosVariaveisMesAnterior()
  const { data: receitasConfirmadas } = useReceitasConfirmadas()
  const [formOpen, setFormOpen] = useState(false)
  const [editGasto, setEditGasto] = useState<GastoVariavel | null>(null)

  const kpis = useMemo(() => {
    const all = gastos ?? []
    const allPrev = gastosPrev ?? []
    const receitas = receitasConfirmadas ?? []

    const totalMes = all.reduce((s, g) => s + Number(g.valor), 0)
    const totalPrev = allPrev.reduce((s, g) => s + Number(g.valor), 0)
    const faturamento = receitas.reduce((s, r) => s + Number(r.valor_bruto), 0)
    const percentFaturamento = faturamento > 0 ? (totalMes / faturamento) * 100 : 0
    const crescimento = totalPrev > 0 ? ((totalMes - totalPrev) / totalPrev) * 100 : 0

    const gastoMarketing = all
      .filter((g) => g.tipo === 'marketing')
      .reduce((s, g) => s + Number(g.valor), 0)

    const clientesUnicos = new Set(receitas.map((r) => r.cliente)).size
    const cac = clientesUnicos > 0 ? gastoMarketing / clientesUnicos : null

    return { totalMes, percentFaturamento, crescimento, gastoMarketing, cac }
  }, [gastos, gastosPrev, receitasConfirmadas])

  function handleEdit(gasto: GastoVariavel) {
    setEditGasto(gasto)
    setFormOpen(true)
  }

  function handleNew() {
    setEditGasto(null)
    setFormOpen(true)
  }

  const gastosMarketing = useMemo(() => gastos?.filter((g) => g.tipo === 'marketing'), [gastos])
  const gastosOperacional = useMemo(() => gastos?.filter((g) => g.tipo === 'operacional'), [gastos])
  const gastosImpostos = useMemo(() => gastos?.filter((g) => g.tipo === 'impostos'), [gastos])

  const cards = [
    {
      label: 'Total Gastos Mês',
      value: formatCurrency(kpis.totalMes),
      icon: DollarSign,
      color: 'text-status-negative',
    },
    {
      label: '% sobre Faturamento',
      value: `${kpis.percentFaturamento.toFixed(1)}%`,
      icon: TrendingDown,
      color: kpis.percentFaturamento > 40 ? 'text-status-negative' : 'text-status-warning',
    },
    {
      label: 'Crescimento vs Mês Anterior',
      value: formatPercent(kpis.crescimento),
      icon: TrendingUp,
      color: kpis.crescimento <= 0 ? 'text-status-positive' : 'text-status-negative',
    },
    {
      label: 'Gasto Marketing do Mês',
      value: formatCurrency(kpis.gastoMarketing),
      icon: Megaphone,
      color: 'text-purple-400',
    },
    {
      label: 'CAC',
      value: kpis.cac !== null ? formatCurrency(kpis.cac) : 'N/A',
      icon: Target,
      color: 'text-brand-cyan',
    },
  ]

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-brand-cyan" />
          <h1 className="text-2xl font-bold text-text-primary">Gastos Variáveis</h1>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4" />
          Novo Gasto
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* Tabs by tipo */}
      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          <TabsTrigger value="impostos">Impostos</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <GastosVariaveisTable gastos={gastos} isLoading={isLoading} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="marketing">
          <GastosVariaveisTable gastos={gastosMarketing} isLoading={isLoading} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="operacional">
          <GastosVariaveisTable gastos={gastosOperacional} isLoading={isLoading} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="impostos">
          <GastosVariaveisTable gastos={gastosImpostos} isLoading={isLoading} onEdit={handleEdit} />
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      <GastoVariavelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        gasto={editGasto}
      />
    </div>
    </PageTransition>
  )
}
