'use client'

import { useState } from 'react'
import {
  LineChart as LineChartIcon,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useProjecoes, type ProjecaoCalculada } from '@/hooks/use-projecoes'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion'

const SCENARIO_CONFIG: Record<string, { emoji: string; color: string; chartColor: string }> = {
  Conservador: { emoji: '\uD83D\uDFE2', color: 'text-status-positive', chartColor: '#10B981' },
  Realista: { emoji: '\uD83D\uDFE1', color: 'text-status-warning', chartColor: '#F59E0B' },
  Agressivo: { emoji: '\uD83D\uDD35', color: 'text-brand-cyan', chartColor: '#00C8F0' },
}

const DEFAULT_CONFIG = { emoji: '\uD83D\uDFE1', color: 'text-status-warning', chartColor: '#F59E0B' }

function getScenarioConfig(nome: string): { emoji: string; color: string; chartColor: string } {
  if (nome.toLowerCase().includes('conservador')) return SCENARIO_CONFIG['Conservador'] ?? DEFAULT_CONFIG
  if (nome.toLowerCase().includes('realista')) return SCENARIO_CONFIG['Realista'] ?? DEFAULT_CONFIG
  if (nome.toLowerCase().includes('agressivo')) return SCENARIO_CONFIG['Agressivo'] ?? DEFAULT_CONFIG
  return DEFAULT_CONFIG
}

const QUARTERS = [
  { label: 'Q1', meses: [1, 2, 3] },
  { label: 'Q2', meses: [4, 5, 6] },
  { label: 'Q3', meses: [7, 8, 9] },
  { label: 'Q4', meses: [10, 11, 12] },
]

function KPICard({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string
  value: string
  icon: React.ElementType
  color: string
  isLoading: boolean
}) {
  return (
    <div className="card-glass">
      {isLoading ? (
        <>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-7 w-28" />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <Icon className={cn('h-4 w-4', color)} />
            <span className="text-xs text-text-secondary">{label}</span>
          </div>
          <p className={cn('text-lg font-bold', color)}>{value}</p>
        </>
      )}
    </div>
  )
}

function QuarterlyBreakdown({ proj }: { proj: ProjecaoCalculada }) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {QUARTERS.map((q, qi) => {
        const qMeses = proj.meses.filter((m) => q.meses.includes(m.mes))
        const qReceita = qMeses.reduce((s, m) => s + m.receita, 0)
        const qResultado = qMeses.reduce((s, m) => s + m.resultado, 0)
        const qCaixa = qMeses[qMeses.length - 1]?.caixaAcumulado ?? 0
        const isExpanded = expandedQ === qi

        return (
          <div key={q.label} className="card-glass">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setExpandedQ(isExpanded ? null : qi)}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-brand-cyan">{q.label}</span>
                <span className="text-xs text-text-secondary">
                  Receita: <span className="text-status-positive font-medium">{formatCurrency(qReceita)}</span>
                </span>
                <span className="text-xs text-text-secondary">
                  Resultado: <span className={cn('font-medium', qResultado >= 0 ? 'text-status-positive' : 'text-status-negative')}>{formatCurrency(qResultado)}</span>
                </span>
                <span className="text-xs text-text-secondary hidden sm:inline">
                  Caixa: <span className={cn('font-medium', qCaixa >= 0 ? 'text-status-positive' : 'text-status-negative')}>{formatCurrency(qCaixa)}</span>
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-text-secondary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-secondary" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-3">
                {qMeses.map((m) => (
                  <div
                    key={m.mes}
                    className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-lg bg-bg-navy/50 border border-brand-blue-deep/10"
                  >
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">Mes</span>
                      <p className="text-sm font-semibold text-text-primary">{m.label}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">Receita</span>
                      <p className="text-sm font-medium text-status-positive">{formatCurrency(m.receita)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">Custos Fixos</span>
                      <p className="text-sm font-medium text-status-negative">{formatCurrency(m.custosFixos)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">Custos Var.</span>
                      <p className="text-sm font-medium text-status-negative">{formatCurrency(m.custosVariaveis)}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-text-dark uppercase">Resultado</span>
                      <p className={cn('text-sm font-bold', m.resultado >= 0 ? 'text-status-positive' : 'text-status-negative')}>
                        {formatCurrency(m.resultado)}
                      </p>
                      <span className="text-[10px] text-text-dark uppercase">Caixa</span>
                      <p className={cn('text-sm font-bold', m.caixaAcumulado >= 0 ? 'text-brand-cyan' : 'text-status-negative')}>
                        {formatCurrency(m.caixaAcumulado)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ProjecaoCharts({ proj }: { proj: ProjecaoCalculada }) {
  const config = getScenarioConfig(proj.cenario.nome)

  const chartData = proj.meses.map((m) => ({
    name: m.label,
    receita: Math.round(m.receita),
    custos: Math.round(m.custosFixos + m.custosVariaveis),
    caixa: Math.round(m.caixaAcumulado),
    resultado: Math.round(m.resultado),
  }))

  return (
    <div className="space-y-6">
      {/* Receita vs Custos */}
      <div className="card-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Receita Projetada vs Custos</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F1D32',
                  border: '1px solid #153B5F',
                  borderRadius: '8px',
                  color: '#F0F4F8',
                  fontSize: '12px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Line
                type="monotone"
                dataKey="receita"
                name="Receita"
                stroke={config.chartColor}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="custos"
                name="Custos"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Caixa Acumulado */}
      <div className="card-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Caixa Acumulado (12 meses)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F1D32',
                  border: '1px solid #153B5F',
                  borderRadius: '8px',
                  color: '#F0F4F8',
                  fontSize: '12px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <ReferenceLine y={0} stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" />
              <defs>
                <linearGradient id="caixaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={config.chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="caixa"
                name="Caixa"
                stroke={config.chartColor}
                strokeWidth={2}
                fill="url(#caixaGradient)"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function ScenarioContent({ proj, isLoading }: { proj: ProjecaoCalculada; isLoading: boolean }) {
  const config = getScenarioConfig(proj.cenario.nome)

  const kpis = [
    { label: 'Receita projetada 12m', value: formatCurrency(proj.receita12m), icon: DollarSign, color: 'text-status-positive' },
    { label: 'MRR em 12m', value: formatCurrency(proj.mrr12m), icon: TrendingUp, color: 'text-brand-cyan' },
    { label: 'Lucro acumulado', value: formatCurrency(proj.lucroAcumulado), icon: BarChart3, color: proj.lucroAcumulado >= 0 ? 'text-status-positive' : 'text-status-negative' },
    { label: 'Break-even (clientes)', value: String(proj.breakEven), icon: Users, color: 'text-brand-cyan' },
    { label: 'Runway atual', value: proj.runwayAtual >= 99 ? 'Positivo' : `${proj.runwayAtual} meses`, icon: Clock, color: proj.runwayAtual >= 6 ? 'text-status-positive' : 'text-status-negative' },
    { label: 'Mes break-even', value: proj.mesBreakEven, icon: Target, color: config.color },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Quarterly Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Detalhamento trimestral</h2>
        <QuarterlyBreakdown proj={proj} />
      </div>

      {/* Charts */}
      <ProjecaoCharts proj={proj} />
    </div>
  )
}

export default function ProjecoesPage() {
  const { projecoes, isLoading } = useProjecoes()

  // Default tab to Realista or first available
  const defaultTab = projecoes.find((p) =>
    p.cenario.nome.toLowerCase().includes('realista')
  )?.cenario.id ?? projecoes[0]?.cenario.id ?? 'loading'

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LineChartIcon className="h-6 w-6 text-brand-cyan" />
        <h1 className="text-2xl font-bold text-text-primary">Projecoes</h1>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton Tabs */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
          {/* Skeleton KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-glass space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            ))}
          </div>
          {/* Skeleton Charts */}
          <Skeleton className="h-64 w-full" />
        </div>
      ) : projecoes.length === 0 ? (
        <div className="card-glass flex flex-col items-center justify-center h-64 gap-3">
          <LineChartIcon className="h-10 w-10 text-text-dark" />
          <p className="text-text-secondary text-sm">
            Nenhum cenario de projecao cadastrado.
          </p>
          <p className="text-text-dark text-xs">
            Crie cenarios na tabela &quot;projecoes&quot; do Supabase (Conservador, Realista, Agressivo).
          </p>
        </div>
      ) : (
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {projecoes.map((p) => {
              const config = getScenarioConfig(p.cenario.nome)
              return (
                <TabsTrigger key={p.cenario.id} value={p.cenario.id}>
                  <span className="mr-1.5">{config.emoji}</span>
                  {p.cenario.nome}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {projecoes.map((p) => (
            <TabsContent key={p.cenario.id} value={p.cenario.id}>
              <ScenarioContent proj={p} isLoading={isLoading} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
    </PageTransition>
  )
}
