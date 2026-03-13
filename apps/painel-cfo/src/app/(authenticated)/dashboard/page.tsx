'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Repeat,
  Flame,
  Lock,
  ShoppingCart,
  Calculator,
  Wallet,
  Clock,
  HelpCircle,
  X,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { PageTransition } from '@/components/motion'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGroqAnalysis } from '@/hooks/use-groq'
import { useDashboard } from '@/hooks/use-dashboard'
import type { DashboardAlert, HealthStatus } from '@/hooks/use-dashboard'

// ── Health Banner ────────────────────────────────────────────────────
const HEALTH_CONFIG: Record<
  HealthStatus,
  { label: string; emoji: string; bg: string; text: string; border: string }
> = {
  saudavel: {
    label: 'SAUDÁVEL',
    emoji: '\uD83D\uDFE2',
    bg: 'bg-status-positive/10',
    text: 'text-status-positive',
    border: 'border-status-positive/30',
  },
  atencao: {
    label: 'ATENÇÃO',
    emoji: '\uD83D\uDFE1',
    bg: 'bg-status-warning/10',
    text: 'text-status-warning',
    border: 'border-status-warning/30',
  },
  critico: {
    label: 'CRÍTICO',
    emoji: '\uD83D\uDD34',
    bg: 'bg-status-negative/10',
    text: 'text-status-negative',
    border: 'border-status-negative/30',
  },
  sem_dados: {
    label: 'SEM DADOS',
    emoji: 'ℹ️',
    bg: 'bg-brand-blue/10',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/30',
  },
}

function HealthBanner({ status }: { status: HealthStatus }) {
  const config = HEALTH_CONFIG[status]
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 flex items-center gap-3',
        config.bg,
        config.border
      )}
    >
      <span className="text-xl">{config.emoji}</span>
      <span className={cn('font-semibold text-sm tracking-wide', config.text)}>
        {config.label}
      </span>
      <span className="text-text-secondary text-sm">
        {status === 'saudavel' && 'Finanças dentro dos parâmetros saudáveis'}
        {status === 'atencao' && 'Alguns indicadores requerem atenção'}
        {status === 'critico' && 'Indicadores críticos detectados — ação necessária'}
        {status === 'sem_dados' && 'Comece cadastrando receitas e custos para ver o status da operação'}
      </span>
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────
interface KPICardProps {
  label: string
  value: string
  variation: number | null
  icon: React.ReactNode
  tooltip: string
  invertVariation?: boolean
}

function KPICard({ label, value, variation, icon, tooltip, invertVariation }: KPICardProps) {
  const isPositive = variation !== null && (invertVariation ? variation < 0 : variation > 0)
  const isNegative = variation !== null && (invertVariation ? variation > 0 : variation < 0)

  return (
    <div className="card-glass p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-brand-cyan">{icon}</div>
          <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">
            {label}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-text-dark hover:text-text-secondary transition-colors">
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-xl font-bold text-text-primary">{value}</p>
      {variation !== null ? (
        <div className="flex items-center gap-1">
          {isPositive && <TrendingUp className="h-3.5 w-3.5 text-status-positive" />}
          {isNegative && <TrendingDown className="h-3.5 w-3.5 text-status-negative" />}
          {!isPositive && !isNegative && (
            <span className="h-3.5 w-3.5 text-text-dark">-</span>
          )}
          <span
            className={cn(
              'text-xs font-medium',
              isPositive && 'text-status-positive',
              isNegative && 'text-status-negative',
              !isPositive && !isNegative && 'text-text-dark'
            )}
          >
            {formatPercent(variation)} vs mês anterior
          </span>
        </div>
      ) : (
        <div className="h-5" />
      )}
    </div>
  )
}

function KPICardSkeleton() {
  return (
    <div className="card-glass p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

// ── Alert Card ───────────────────────────────────────────────────────
function AlertCard({
  alert,
  onDismiss,
}: {
  alert: DashboardAlert
  onDismiss: (id: string) => void
}) {
  const borderColor =
    alert.type === 'critical'
      ? 'border-status-negative/40'
      : alert.type === 'warning'
        ? 'border-status-warning/40'
        : 'border-brand-blue/40'

  const bgColor =
    alert.type === 'critical'
      ? 'bg-status-negative/5'
      : alert.type === 'warning'
        ? 'bg-status-warning/5'
        : 'bg-brand-blue/5'

  return (
    <div className={cn('rounded-xl border p-4 flex items-start gap-3', borderColor, bgColor)}>
      <span className="text-lg shrink-0 mt-0.5">{alert.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{alert.description}</p>
        {alert.action && (
          <p className="text-xs text-brand-cyan mt-1 font-medium">{alert.action}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        className="text-text-dark hover:text-text-secondary transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Custom Recharts Tooltip ──────────────────────────────────────────
function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload) return null
  return (
    <div className="tooltip-brand shadow-lg">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  useEffect(() => { document.title = 'Painel Geral | BG Tech CFO' }, [])

  const {
    kpis,
    variations,
    chartData,
    costDistribution,
    alerts,
    healthStatus,
    isLoading,
    error,
  } = useDashboard()

  const { analyze, isLoading: aiLoading, error: aiError } = useGroqAnalysis()
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [aiSummary, setAiSummary] = useState<string | null>(null)

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id))

  function handleDismiss(id: string) {
    setDismissedAlerts((prev) => new Set(prev).add(id))
  }

  async function handleGenerateAI() {
    const result = await analyze({
      prompt: 'Analise os dados financeiros deste mês e gere um resumo executivo com insights e recomendações acionáveis. Responda em português.',
      context: {
        receitaTotal: kpis.receitaTotal,
        mrr: kpis.mrr,
        burnRate: kpis.burnRate,
        custosFixos: kpis.custosFixos,
        custosVariaveis: kpis.custosVariaveis,
        resultadoLiquido: kpis.resultadoLiquido,
        caixaDisponivel: kpis.caixaDisponivel,
        runway: kpis.runway,
        margem: kpis.margem,
        variacaoReceita: variations.receitaTotal,
        variacaoMrr: variations.mrr,
        historico6m: chartData,
        distribuicaoCustos: costDistribution,
        alertas: alerts.map((a) => a.title),
        statusSaude: healthStatus,
      },
      systemPrompt:
        'Você é o CFO virtual da BG Tech. Analise os dados financeiros e gere um resumo executivo conciso com: 1) Visão geral da saúde financeira, 2) Top 3 pontos de atenção, 3) Recomendações acionáveis. Use formatação markdown. Seja direto e objetivo.',
    })
    if (result) {
      setAiSummary(result)
    }
  }

  // ── KPI definitions ───────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Receita Total',
      value: formatCurrency(kpis.receitaTotal),
      variation: variations.receitaTotal,
      icon: <TrendingUp className="h-4 w-4" />,
      tooltip: 'Soma de todas as receitas confirmadas no período selecionado',
    },
    {
      label: 'MRR',
      value: formatCurrency(kpis.mrr),
      variation: variations.mrr,
      icon: <Repeat className="h-4 w-4" />,
      tooltip: 'Monthly Recurring Revenue — apenas receitas recorrentes confirmadas',
    },
    {
      label: 'Burn Rate',
      value: formatCurrency(kpis.burnRate),
      variation: variations.burnRate,
      icon: <Flame className="h-4 w-4" />,
      tooltip: 'Gasto total mensal — custos fixos + variáveis + impostos. Menor é melhor.',
      invertVariation: true,
    },
    {
      label: 'Custos Fixos',
      value: formatCurrency(kpis.custosFixos),
      variation: variations.custosFixos,
      icon: <Lock className="h-4 w-4" />,
      tooltip: 'Despesas fixas mensais ativas — ferramentas, contabilidade, etc.',
    },
    {
      label: 'Custos Variáveis',
      value: formatCurrency(kpis.custosVariaveis),
      variation: variations.custosVariaveis,
      icon: <ShoppingCart className="h-4 w-4" />,
      tooltip: 'Gastos que variam com vendas — marketing, freelancers, taxas',
      invertVariation: true,
    },
    {
      label: 'Resultado Líquido',
      value: formatCurrency(kpis.resultadoLiquido),
      variation: variations.resultadoLiquido,
      icon: <Calculator className="h-4 w-4" />,
      tooltip: 'Receita Bruta - Custos Variáveis - Custos Fixos - Impostos',
    },
    {
      label: 'Caixa Disponível',
      value: formatCurrency(kpis.caixaDisponivel),
      variation: variations.caixaDisponivel,
      icon: <Wallet className="h-4 w-4" />,
      tooltip: 'Saldo atual em conta bancária — atualizado manualmente',
    },
    {
      label: 'Runway',
      value: kpis.runway >= 99 ? '99+ meses' : `${kpis.runway.toFixed(1)} meses`,
      variation: variations.runway,
      icon: <Clock className="h-4 w-4" />,
      tooltip: 'Quanto tempo a empresa sobrevive sem novas receitas — Caixa ÷ Burn Rate',
    },
  ]

  // ── Render ────────────────────────────────────────────────────────
  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-brand-cyan" />
        <h1 className="text-2xl font-bold text-text-primary">Painel Geral</h1>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-status-negative/30 bg-status-negative/10 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-status-negative shrink-0" />
          <p className="text-sm text-status-negative">
            Erro ao carregar dados: {error.message}
          </p>
        </div>
      )}

      {/* Section 1 — Health Banner */}
      {isLoading ? (
        <Skeleton className="h-12 w-full rounded-xl" />
      ) : (
        <HealthBanner status={healthStatus} />
      )}

      {/* Welcome onboarding when no data */}
      {healthStatus === 'sem_dados' && !isLoading && (
        <div className="card-glass p-6 space-y-4">
          <p className="text-lg font-semibold text-text-primary">👋 Bem-vindo ao Painel CFO!</p>
          <p className="text-sm text-text-secondary">Comece cadastrando seus dados financeiros:</p>
          <div className="flex flex-wrap gap-3">
            <a href="/custos-fixos" className="text-sm text-brand-cyan hover:underline">1. Custos Fixos →</a>
            <a href="/receitas" className="text-sm text-brand-cyan hover:underline">2. Receitas →</a>
            <a href="/gastos-variaveis" className="text-sm text-brand-cyan hover:underline">3. Gastos Variáveis →</a>
          </div>
        </div>
      )}

      {/* Section 2 — KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <KPICardSkeleton key={i} />)
          : kpiCards.map((card) => <KPICard key={card.label} {...card} />)}
      </div>

      {/* Section 3 — Smart Alerts */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Alertas Inteligentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onDismiss={handleDismiss} />
            ))}
          </div>
        </div>
      )}

      {/* Section 4 — Revenue vs Expenses Chart */}
      <div className="card-glass p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
          Receita vs Despesas (6 meses)
        </h2>
        {isLoading ? (
          <Skeleton className="h-72 w-full rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-72 text-text-dark text-sm">
            Adicione receitas e despesas para visualizar o gráfico
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                axisLine={{ stroke: '#153B5F' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <RechartsTooltip content={<ChartTooltipContent />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#94A3B8' }}
              />
              <Bar
                dataKey="receita"
                name="Receita"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="custos"
                name="Custos"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Line
                type="monotone"
                dataKey="resultado"
                name="Resultado"
                stroke="#00C8F0"
                strokeWidth={2}
                dot={{ fill: '#00C8F0', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 5 — Cost Distribution */}
      <div className="card-glass p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
          Distribuição de Custos
        </h2>
        {isLoading ? (
          <Skeleton className="h-72 w-full rounded-lg" />
        ) : costDistribution.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-text-dark text-sm">
            Nenhum custo registrado no período
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={costDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {costDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#0F1D32',
                    border: '1px solid #153B5F',
                    borderRadius: '8px',
                    fontSize: 12,
                    color: '#F0F4F8',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center lg:flex-col lg:gap-2 lg:min-w-[180px]">
              {costDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-text-secondary whitespace-nowrap">
                    {item.name}
                  </span>
                  <span className="text-xs text-text-primary font-medium">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 6 — AI Summary */}
      <div className="card-glass p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-cyan" />
            Análise IA
          </h2>
          <Button
            onClick={handleGenerateAI}
            disabled={aiLoading || isLoading}
            className="text-xs"
            variant="outline"
            size="sm"
          >
            {aiLoading ? 'Analisando...' : 'Gerar análise do mês'}
          </Button>
        </div>

        {aiError && (
          <div className="rounded-lg bg-status-warning/10 border border-status-warning/30 px-3 py-2 mb-3">
            <p className="text-xs text-status-warning">
              {aiError.includes('non-2xx') || aiError.includes('Edge Function')
                ? 'Configure a GROQ_API_KEY nas variáveis de ambiente do Supabase para ativar a análise por IA'
                : `Não foi possível gerar a análise agora. Tente novamente em instantes.`}
            </p>
          </div>
        )}

        {aiSummary ? (
          <div className="prose prose-sm prose-invert max-w-none text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
            {aiSummary}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-text-dark text-sm">
            Clique em &quot;Gerar análise do mês&quot; para obter insights da IA
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  )
}
