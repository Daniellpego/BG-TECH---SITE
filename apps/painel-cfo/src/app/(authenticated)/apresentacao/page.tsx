'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, TrendingUp, DollarSign, BarChart3, Timer, Flame, PiggyBank, ArrowRight } from 'lucide-react'
import { usePeriod } from '@/providers/period-provider'
import { useDashboard } from '@/hooks/use-dashboard'
import { useDRE } from '@/hooks/use-dre'
import { useTax } from '@/providers/tax-provider'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const HEALTH_MAP = {
  saudavel: { label: 'Saudável', color: 'bg-status-positive', text: 'text-status-positive' },
  atencao: { label: 'Atenção', color: 'bg-status-warning', text: 'text-status-warning' },
  critico: { label: 'Crítico', color: 'bg-status-negative', text: 'text-status-negative' },
  sem_dados: { label: 'Sem Dados', color: 'bg-brand-cyan', text: 'text-brand-cyan' },
} as const

export default function ApresentacaoPage() {
  const router = useRouter()
  const { month, year } = usePeriod()
  const dashboard = useDashboard()
  const dre = useDRE()
  const { simplesEnabled, aliquota } = useTax()

  // Apply Simples Nacional overlay
  const impostoSimples = simplesEnabled ? dashboard.kpis.receitaTotal * (aliquota / 100) : 0
  const kpis = {
    ...dashboard.kpis,
    resultadoLiquido: dashboard.kpis.resultadoLiquido - impostoSimples,
    burnRate: dashboard.kpis.burnRate + impostoSimples,
    runway: (dashboard.kpis.burnRate + impostoSimples) > 0
      ? dashboard.kpis.caixaDisponivel / (dashboard.kpis.burnRate + impostoSimples)
      : dashboard.kpis.caixaDisponivel > 0 ? 99 : 0,
    margem: dashboard.kpis.receitaTotal > 0
      ? ((dashboard.kpis.resultadoLiquido - impostoSimples) / dashboard.kpis.receitaTotal) * 100
      : 0,
  }
  const { healthStatus } = dashboard
  const health = HEALTH_MAP[healthStatus]

  // Dynamic title
  useEffect(() => { document.title = 'Apresentação | BG Tech CFO' }, [])

  // Escape key to exit
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.push('/relatorios')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  // Try fullscreen on mount
  useEffect(() => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch {}
  }, [])

  const isLoading = dashboard.isLoading || dre.isLoading

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-bg-navy flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary text-sm">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-bg-navy overflow-auto">
      {/* Close button */}
      <button
        onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
          router.push('/relatorios')
        }}
        className="fixed top-6 right-6 z-[101] h-10 w-10 flex items-center justify-center rounded-full bg-bg-card border border-brand-blue-deep/30 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="max-w-6xl mx-auto px-8 py-12 space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo collapsed={false} />
            <div className="h-8 w-px bg-brand-blue-deep/30" />
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Painel CFO</h1>
              <p className="text-lg text-text-secondary">{MONTH_NAMES[month - 1]} {year}</p>
            </div>
          </div>
          <div className={cn('px-5 py-2.5 rounded-full flex items-center gap-2', health.color + '/20')}>
            <div className={cn('h-3 w-3 rounded-full', health.color)} />
            <span className={cn('text-lg font-semibold', health.text)}>{health.label}</span>
          </div>
        </div>

        {/* KPI Grid - 3 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <KPICard
            icon={TrendingUp}
            label="Receita Bruta"
            value={formatCurrency(kpis.receitaTotal)}
            color="text-brand-cyan"
          />
          <KPICard
            icon={DollarSign}
            label="MRR"
            value={formatCurrency(kpis.mrr)}
            sub="Receita recorrente mensal"
            color="text-brand-cyan"
          />
          <KPICard
            icon={BarChart3}
            label="Resultado Líquido"
            value={formatCurrency(kpis.resultadoLiquido)}
            color={kpis.resultadoLiquido >= 0 ? 'text-status-positive' : 'text-status-negative'}
            sub={`Margem: ${kpis.margem.toFixed(1)}%`}
          />
          <KPICard
            icon={PiggyBank}
            label="Caixa Disponível"
            value={formatCurrency(kpis.caixaDisponivel)}
            color="text-text-primary"
          />
          <KPICard
            icon={Flame}
            label="Burn Rate"
            value={formatCurrency(kpis.burnRate)}
            sub="Gasto mensal total"
            color="text-status-negative"
          />
          <KPICard
            icon={Timer}
            label="Runway"
            value={`${kpis.runway.toFixed(1)} meses`}
            sub={kpis.runway >= 6 ? 'Saudável' : kpis.runway >= 3 ? 'Atenção' : 'Crítico'}
            color={kpis.runway >= 6 ? 'text-status-positive' : kpis.runway >= 3 ? 'text-status-warning' : 'text-status-negative'}
          />
        </div>

        {/* DRE Cascade */}
        <div className="bg-bg-card border border-brand-blue-deep/20 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-text-primary mb-6">DRE — Cascata do Mês</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <CascadeItem label="Receita Bruta" value={dre.current.receitaBruta} />
            <ArrowRight className="h-5 w-5 text-brand-blue-deep shrink-0 hidden sm:block" />
            <CascadeItem label="(-) Custos Var." value={-dre.current.custosVariaveisTotal} negative />
            <ArrowRight className="h-5 w-5 text-brand-blue-deep shrink-0 hidden sm:block" />
            <CascadeItem label="Margem Bruta" value={dre.current.margemBruta} highlight />
            <ArrowRight className="h-5 w-5 text-brand-blue-deep shrink-0 hidden sm:block" />
            <CascadeItem label="(-) Custos Fixos" value={-dre.current.cfTotal} negative />
            <ArrowRight className="h-5 w-5 text-brand-blue-deep shrink-0 hidden sm:block" />
            <CascadeItem label="(-) Impostos" value={-dre.current.impostos} negative />
            {simplesEnabled && (
              <>
                <ArrowRight className="h-5 w-5 text-brand-blue-deep shrink-0 hidden sm:block" />
                <CascadeItem label={`(-) Simples ${aliquota}%`} value={-impostoSimples} negative />
              </>
            )}
            <ArrowRight className="h-5 w-5 text-brand-blue-deep shrink-0 hidden sm:block" />
            <CascadeItem label="Resultado Líquido" value={dre.current.resultadoLiquido - impostoSimples} highlight final />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-dark">
          Pressione ESC para sair — Painel CFO BG Tech
        </p>
      </div>
    </div>
  )
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-bg-card border border-brand-blue-deep/20 rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-5 w-5', color)} />
        <span className="text-sm text-text-secondary font-medium">{label}</span>
      </div>
      <p className={cn('text-3xl font-bold', color)}>{value}</p>
      {sub && <p className="text-xs text-text-secondary">{sub}</p>}
    </div>
  )
}

function CascadeItem({
  label,
  value,
  negative,
  highlight,
  final: isFinal,
}: {
  label: string
  value: number
  negative?: boolean
  highlight?: boolean
  final?: boolean
}) {
  const valueColor = isFinal
    ? value >= 0 ? 'text-status-positive' : 'text-status-negative'
    : negative
      ? 'text-status-negative'
      : highlight
        ? 'text-brand-cyan'
        : 'text-text-primary'

  return (
    <div className={cn(
      'text-center px-4 py-3 rounded-xl',
      isFinal ? 'bg-brand-cyan/10 border-2 border-brand-cyan/30' : 'bg-bg-navy/50'
    )}>
      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">{label}</p>
      <p className={cn('text-lg font-bold', valueColor)}>
        {formatCurrency(Math.abs(value))}
      </p>
    </div>
  )
}
