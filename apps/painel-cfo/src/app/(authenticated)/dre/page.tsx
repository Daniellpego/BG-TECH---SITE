'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useEffect } from 'react'
import { FileText, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { useDRE, type DRELine } from '@/hooks/use-dre'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
} from 'recharts'

function DRETableSkeleton() {
  return (
    <div className="card-glass space-y-3">
      <Skeleton className="h-5 w-48 mb-4" />
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="card-glass">
      <Skeleton className="h-5 w-48 mb-4" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

function formatDREValue(value: number): string {
  return formatCurrency(Math.abs(value))
}

function formatDREPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function DRERow({ line }: { line: DRELine }) {
  if (line.type === 'separator') {
    return (
      <tr>
        <td colSpan={4} className="py-1">
          <div className="border-t border-brand-blue-deep/40" />
        </td>
      </tr>
    )
  }

  const isNegativeHeader =
    line.label.startsWith('(-)') || line.label.includes('CUSTOS') || line.label.includes('IMPOSTOS')
  const isPositiveHeader = line.label === 'RECEITA BRUTA'
  const isSubtotal = line.type === 'subtotal'
  const isTotal = line.type === 'total'
  const isSub = line.type === 'sub'

  const valuePositive = line.month >= 0
  const ytdPositive = line.ytd >= 0

  return (
    <tr
      className={cn(
        'transition-colors',
        isTotal && 'bg-brand-blue-deep/40',
        isSubtotal && 'bg-brand-blue-deep/20',
        isSub && 'hover:bg-bg-hover/50'
      )}
    >
      {/* Label */}
      <td
        className={cn(
          'py-2 pr-4',
          line.indent && 'pl-8',
          !line.indent && 'pl-3',
          isTotal && 'text-lg font-bold text-text-primary',
          isSubtotal && 'font-semibold text-text-primary',
          isPositiveHeader && 'font-bold text-status-positive',
          isNegativeHeader && !isSubtotal && !isTotal && 'font-semibold text-status-negative',
          isSub && 'text-sm text-text-secondary'
        )}
      >
        {line.label}
      </td>

      {/* Mes Selecionado */}
      <td
        className={cn(
          'py-2 px-4 text-right font-mono whitespace-nowrap',
          isTotal && 'text-lg font-bold',
          isSubtotal && 'font-semibold',
          isSub && 'text-sm',
          isTotal || isSubtotal
            ? valuePositive
              ? 'text-status-positive'
              : 'text-status-negative'
            : isNegativeHeader
              ? 'text-status-negative'
              : isPositiveHeader
                ? 'text-status-positive'
                : 'text-text-primary'
        )}
      >
        {isNegativeHeader && !isSubtotal && !isTotal && line.month > 0 ? '-' : ''}
        {formatDREValue(line.month)}
      </td>

      {/* Acumulado Ano */}
      <td
        className={cn(
          'py-2 px-4 text-right font-mono whitespace-nowrap',
          isTotal && 'text-lg font-bold',
          isSubtotal && 'font-semibold',
          isSub && 'text-sm',
          isTotal || isSubtotal
            ? ytdPositive
              ? 'text-status-positive'
              : 'text-status-negative'
            : 'text-text-secondary'
        )}
      >
        {isNegativeHeader && !isSubtotal && !isTotal && line.ytd > 0 ? '-' : ''}
        {formatDREValue(line.ytd)}
      </td>

      {/* % Receita */}
      <td
        className={cn(
          'py-2 pl-4 pr-3 text-right font-mono whitespace-nowrap',
          isTotal && 'text-lg font-bold',
          isSubtotal && 'font-semibold',
          isSub && 'text-sm text-text-dark',
          isTotal || isSubtotal
            ? valuePositive
              ? 'text-status-positive'
              : 'text-status-negative'
            : 'text-text-dark'
        )}
      >
        {formatDREPercent(line.percent)}
      </td>
    </tr>
  )
}

function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip-brand shadow-xl">
      <p className="mb-2 text-sm font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function DREPage() {
  useEffect(() => { document.title = 'DRE | BG Tech CFO' }, [])

  const { lines, current, chartData, isLoading, isChartLoading } = useDRE()

  const last6 = useMemo(() => chartData.slice(-6), [chartData])

  const kpis = useMemo(() => {
    if (isLoading) return null
    return {
      receitaBruta: current.receitaBruta,
      margemBruta: current.pctMargemBruta,
      resultadoLiquido: current.resultadoLiquido,
      margemLiquida: current.pctMargemLiquida,
    }
  }, [current, isLoading])

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-brand-cyan" />
        <h1 className="text-2xl font-bold text-text-primary">DRE Simplificada</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-glass">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-32" />
            </div>
          ))
        ) : (
          <>
            <div className="card-glass">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-status-positive" />
                <span className="text-xs text-text-secondary">Receita Bruta</span>
              </div>
              <p className="text-lg font-bold text-status-positive">
                {formatCurrency(kpis!.receitaBruta)}
              </p>
            </div>
            <div className="card-glass">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-brand-cyan" />
                <span className="text-xs text-text-secondary">Margem Bruta</span>
              </div>
              <p
                className={cn(
                  'text-lg font-bold',
                  kpis!.margemBruta >= 0 ? 'text-status-positive' : 'text-status-negative'
                )}
              >
                {formatDREPercent(kpis!.margemBruta)}
              </p>
            </div>
            <div className="card-glass">
              <div className="flex items-center gap-2 mb-1">
                {kpis!.resultadoLiquido >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-status-positive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-status-negative" />
                )}
                <span className="text-xs text-text-secondary">Resultado Liq.</span>
              </div>
              <p
                className={cn(
                  'text-lg font-bold',
                  kpis!.resultadoLiquido >= 0
                    ? 'text-status-positive'
                    : 'text-status-negative'
                )}
              >
                {formatCurrency(kpis!.resultadoLiquido)}
              </p>
            </div>
            <div className="card-glass">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-brand-cyan" />
                <span className="text-xs text-text-secondary">Margem Liq.</span>
              </div>
              <p
                className={cn(
                  'text-lg font-bold',
                  kpis!.margemLiquida >= 0 ? 'text-status-positive' : 'text-status-negative'
                )}
              >
                {formatDREPercent(kpis!.margemLiquida)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* DRE Table */}
      {isLoading ? (
        <DRETableSkeleton />
      ) : current.receitaBruta === 0 && current.resultadoLiquido === 0 && current.cfTotal === 0 ? (
        <div className="card-glass flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-5xl">📋</span>
          <h2 className="text-lg font-semibold text-text-primary">DRE sem dados no período</h2>
          <p className="text-sm text-text-secondary text-center max-w-md">
            Cadastre receitas e custos para visualizar a Demonstração de Resultado
          </p>
        </div>
      ) : (
        <div className="card-glass overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-brand-blue-deep/60">
                <th className="py-3 pl-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Conta
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Mês Atual
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Acumulado Ano
                </th>
                <th className="py-3 pl-4 pr-3 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  % Receita
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <DRERow key={`${line.label}-${i}`} line={line} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita vs Custos - last 6 months */}
        {isChartLoading ? (
          <ChartSkeleton />
        ) : last6.length === 0 ? (
          <div className="card-glass flex items-center justify-center h-72 text-text-dark text-sm">
            Adicione dados para visualizar o gráfico
          </div>
        ) : (
          <div className="card-glass">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Receita vs Custos (6 meses)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={last6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    axisLine={{ stroke: '#153B5F' }}
                  />
                  <YAxis
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={{ stroke: '#153B5F' }}
                    tickFormatter={(v: number) =>
                      `${(v / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: '#94A3B8' }}
                  />
                  <Bar
                    dataKey="receitaBruta"
                    name="Receita"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="custosVariaveis"
                    name="Custos Var."
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="custosFixos"
                    name="Custos Fixos"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Line
                    type="monotone"
                    dataKey="margemBruta"
                    name="Margem Bruta"
                    stroke="#00C8F0"
                    strokeWidth={2}
                    dot={{ fill: '#00C8F0', r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Resultado Líquido - last 12 months */}
        {isChartLoading ? (
          <ChartSkeleton />
        ) : chartData.length === 0 ? (
          <div className="card-glass flex items-center justify-center h-72 text-text-dark text-sm">
            Adicione dados para visualizar o gráfico
          </div>
        ) : (
          <div className="card-glass">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Resultado Líquido (12 meses)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    axisLine={{ stroke: '#153B5F' }}
                  />
                  <YAxis
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={{ stroke: '#153B5F' }}
                    tickFormatter={(v: number) =>
                      `${(v / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: '#94A3B8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resultadoLiquido"
                    name="Resultado Liq."
                    stroke="#00C8F0"
                    strokeWidth={2.5}
                    dot={{ fill: '#00C8F0', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#00C8F0', stroke: '#0A1628', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="receitaBruta"
                    name="Receita"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  )
}
