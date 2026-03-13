'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { CalendarRange, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { useBalanco } from '@/hooks/use-balanco'
import { usePeriod } from '@/providers/period-provider'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const TIPO_LABELS: Record<string, string> = {
  setup: 'Setup',
  mensalidade: 'Mensalidade',
  projeto_avulso: 'Projeto Avulso',
  consultoria: 'Consultoria',
  mvp: 'MVP',
  outro: 'Outro',
}

const CATEGORIA_LABELS: Record<string, string> = {
  custos_fixos: 'Custos Fixos',
  marketing: 'Marketing',
  operacional: 'Operacional',
  comercial: 'Comercial',
  impostos_variaveis: 'Impostos',
  freelancer: 'Freelancer',
  api_consumo: 'API/Consumo',
  outro: 'Outro',
}

const YEAR_OPTIONS = [2025, 2026, 2027]

export default function BalancoAnualPage() {
  useEffect(() => { document.title = 'Balanço Anual | BG Tech CFO' }, [])

  const { year, setYear } = usePeriod()
  const { meses, faturamentoAno, gastosAno, saldoAno, isLoading } = useBalanco()
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null)

  const now = new Date()
  const currentMonth = now.getFullYear() === year ? now.getMonth() + 1 : -1

  const toggleMonth = (mes: number) => {
    setExpandedMonth((prev) => (prev === mes ? null : mes))
  }

  const hasData = (m: { entradas: number; saidas: number }) =>
    m.entradas > 0 || m.saidas > 0

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-6 w-6 text-brand-cyan" />
          <h1 className="text-2xl font-bold text-text-primary">Balanço Anual</h1>
        </div>

        {/* Year Selector */}
        <div className="flex gap-2">
          {YEAR_OPTIONS.map((y) => (
            <Button
              key={y}
              variant={year === y ? 'default' : 'outline'}
              size="sm"
              onClick={() => setYear(y)}
              className={cn(
                year === y
                  ? 'bg-brand-cyan text-bg-navy hover:bg-brand-cyan-light'
                  : 'border-brand-blue-deep/30 text-text-secondary hover:text-text-primary hover:border-brand-cyan/50'
              )}
            >
              {y}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Faturamento do Ano */}
        <div className="card-glass">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-8 w-36" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-status-positive" />
                <span className="text-xs text-text-secondary">Faturamento do Ano</span>
              </div>
              <p className="text-xl font-bold text-status-positive">
                {formatCurrency(faturamentoAno)}
              </p>
            </>
          )}
        </div>

        {/* Gastos do Ano */}
        <div className="card-glass">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-8 w-36" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-status-negative" />
                <span className="text-xs text-text-secondary">Gastos do Ano</span>
              </div>
              <p className="text-xl font-bold text-status-negative">
                {formatCurrency(gastosAno)}
              </p>
            </>
          )}
        </div>

        {/* Saldo Anual */}
        <div className="card-glass">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-8 w-36" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className={cn('h-4 w-4', saldoAno >= 0 ? 'text-status-positive' : 'text-status-negative')} />
                <span className="text-xs text-text-secondary">Saldo Anual</span>
              </div>
              <p className={cn('text-xl font-bold', saldoAno >= 0 ? 'text-status-positive' : 'text-status-negative')}>
                {formatCurrency(saldoAno)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && faturamentoAno === 0 && gastosAno === 0 && (
        <div className="card-glass flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-5xl">📅</span>
          <h2 className="text-lg font-semibold text-text-primary">Nenhum dado no ano de {year}</h2>
          <p className="text-sm text-text-secondary text-center max-w-md">
            Cadastre receitas e custos para visualizar o balanco anual
          </p>
        </div>
      )}

      {/* Month Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {meses.map((m) => {
          const isCurrentMonth = m.mes === currentMonth
          const isFuture = year > now.getFullYear() || (year === now.getFullYear() && m.mes > currentMonth)
          const noData = !hasData(m) && (isFuture || !isCurrentMonth)
          const isExpanded = expandedMonth === m.mes

          return (
            <div
              key={m.mes}
              className={cn(
                'card-glass transition-all cursor-pointer',
                isExpanded && 'sm:col-span-2 lg:col-span-2 xl:col-span-2',
                isCurrentMonth && 'ring-1 ring-brand-cyan/40',
                !noData && m.saldo >= 0 && 'border-l-2 border-l-status-positive/50',
                !noData && m.saldo < 0 && 'border-l-2 border-l-status-negative/50',
                noData && 'opacity-60'
              )}
              onClick={() => !noData && toggleMonth(m.mes)}
            >
              {/* Month Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">{MONTH_NAMES[m.mes - 1]}</h3>
                  {isCurrentMonth && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-brand-cyan/20 text-brand-cyan">
                      ATUAL
                    </span>
                  )}
                </div>
                {!noData && (
                  isExpanded
                    ? <ChevronUp className="h-4 w-4 text-text-secondary" />
                    : <ChevronDown className="h-4 w-4 text-text-secondary" />
                )}
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-28" />
                </div>
              ) : noData ? (
                <p className="text-xs text-text-dark">Sem dados</p>
              ) : (
                <>
                  {/* Summary */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Entradas</span>
                      <span className="text-sm font-medium text-status-positive">
                        +{formatCurrency(m.entradas)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Saídas</span>
                      <span className="text-sm font-medium text-status-negative">
                        -{formatCurrency(m.saidas)}
                      </span>
                    </div>
                    <div className="border-t border-brand-blue-deep/20 pt-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-secondary">Saldo</span>
                        <span className={cn(
                          'text-sm font-bold',
                          m.saldo >= 0 ? 'text-status-positive' : 'text-status-negative'
                        )}>
                          {formatCurrency(m.saldo)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-brand-blue-deep/20 pt-4">
                      {/* Receitas por Tipo */}
                      {Object.keys(m.receitasPorTipo).length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-status-positive mb-2">
                            Entradas por tipo
                          </h4>
                          <div className="space-y-1">
                            {Object.entries(m.receitasPorTipo)
                              .sort(([, a], [, b]) => b - a)
                              .map(([tipo, valor]) => (
                                <div key={tipo} className="flex items-center justify-between">
                                  <span className="text-xs text-text-secondary">
                                    {TIPO_LABELS[tipo] ?? tipo}
                                  </span>
                                  <span className="text-xs font-medium text-status-positive">
                                    {formatCurrency(valor)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Gastos por Categoria */}
                      {Object.keys(m.gastosPorCategoria).length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-status-negative mb-2">
                            Saídas por categoria
                          </h4>
                          <div className="space-y-1">
                            {Object.entries(m.gastosPorCategoria)
                              .sort(([, a], [, b]) => b - a)
                              .map(([cat, valor]) => (
                                <div key={cat} className="flex items-center justify-between">
                                  <span className="text-xs text-text-secondary">
                                    {CATEGORIA_LABELS[cat] ?? cat}
                                  </span>
                                  <span className="text-xs font-medium text-status-negative">
                                    {formatCurrency(valor)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </PageTransition>
  )
}
