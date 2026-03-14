'use client'

export const dynamic = 'force-dynamic'

import { useMemo } from 'react'
import {
  Users, Target, DollarSign, TrendingUp, Flame, BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area,
} from 'recharts'
import { PageTransition, StaggerContainer, StaggerItem, AnimatedNumber, MotionCard } from '@/components/motion'
import { PageTitle } from '@/components/page-title'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/hooks/use-dashboard'
import { formatCurrency } from '@/lib/format'
import {
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS,
  ORIGENS_LABELS, ORIGENS_COLORS,
} from '@/types/database'
import type { LeadStatus } from '@/types/database'

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: '#131F35',
    border: '1px solid #153B5F',
    borderRadius: '8px',
    color: '#F0F4F8',
    fontSize: '12px',
  },
}

export default function AnalyticsPage() {
  const {
    isLoading,
    totalLeads,
    leadsQuentes,
    pipelineValue,
    totalGanho,
    totalMRR,
    winRate,
    leads,
  } = useDashboard()

  const statusData = useMemo(() => {
    if (!leads.length) return []
    const counts: Record<string, number> = {}
    for (const lead of leads) {
      const key = lead.status || 'nao_informado'
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts).map(([status, count]) => ({
      name: LEAD_STATUS_LABELS[status as LeadStatus] ?? (status === 'nao_informado' ? 'Não informado' : status),
      value: count,
      fill: LEAD_STATUS_COLORS[status as LeadStatus] ?? '#94A3B8',
    }))
  }, [leads])

  const origemData = useMemo(() => {
    if (!leads.length) return []
    const counts: Record<string, number> = {}
    for (const lead of leads) {
      const key = lead.origem || 'nao_informado'
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts).map(([origem, count]) => ({
      name: ORIGENS_LABELS[origem] ?? (origem === 'nao_informado' ? 'Não informado' : origem),
      value: count,
      fill: ORIGENS_COLORS[origem] ?? '#94A3B8',
    }))
  }, [leads])

  const temperaturaData = useMemo(() => {
    if (!leads.length) return []
    const frio = leads.filter((l) => l.temperatura === 'frio').length
    const morno = leads.filter((l) => l.temperatura === 'morno').length
    const quente = leads.filter((l) => l.temperatura === 'quente').length
    return [
      { name: 'Frio', value: frio, fill: '#3B82F6' },
      { name: 'Morno', value: morno, fill: '#F59E0B' },
      { name: 'Quente', value: quente, fill: '#EF4444' },
    ]
  }, [leads])

  const weeklyData = useMemo(() => {
    if (!leads.length) return []
    const weeks: Record<string, number> = {}
    for (const lead of leads) {
      const date = new Date(lead.created_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const key = `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`
      weeks[key] = (weeks[key] ?? 0) + 1
    }
    return Object.entries(weeks)
      .map(([week, count]) => ({ week, leads: count }))
      .slice(-8)
  }, [leads])

  const valorPorOrigem = useMemo(() => {
    if (!leads.length) return []
    const values: Record<string, number> = {}
    for (const lead of leads) {
      const key = lead.origem || 'nao_informado'
      values[key] = (values[key] ?? 0) + (lead.valor_estimado || 0)
    }
    return Object.entries(values).map(([origem, valor]) => ({
      name: ORIGENS_LABELS[origem] ?? (origem === 'nao_informado' ? 'Não informado' : origem),
      valor,
    }))
  }, [leads])

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
            <p className="text-sm text-text-secondary mt-1">Métricas e relatórios de vendas</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageTitle title="Analytics" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Métricas e relatórios de vendas</p>
        </div>

        {/* KPIs */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StaggerItem>
            <KpiCard icon={<Users className="h-5 w-5 text-brand-cyan" />} label="Total Leads" value={totalLeads} format={(n: number) => String(n)} />
          </StaggerItem>
          <StaggerItem>
            <KpiCard icon={<Flame className="h-5 w-5 text-status-negative" />} label="Quentes" value={leadsQuentes} format={(n: number) => String(n)} color="text-status-negative" />
          </StaggerItem>
          <StaggerItem>
            <KpiCard icon={<Target className="h-5 w-5 text-status-warning" />} label="Pipeline" value={pipelineValue} format={formatCurrency} color="text-brand-cyan" />
          </StaggerItem>
          <StaggerItem>
            <KpiCard icon={<DollarSign className="h-5 w-5 text-status-positive" />} label="Ganho" value={totalGanho} format={formatCurrency} color="text-status-positive" />
          </StaggerItem>
          <StaggerItem>
            <KpiCard icon={<TrendingUp className="h-5 w-5 text-brand-blue" />} label="MRR" value={totalMRR} format={formatCurrency} color="text-brand-cyan" />
          </StaggerItem>
          <StaggerItem>
            <KpiCard icon={<BarChart3 className="h-5 w-5 text-status-positive" />} label="Win Rate" value={winRate} format={(n: number) => `${n.toFixed(0)}%`} color="text-status-positive" />
          </StaggerItem>
        </StaggerContainer>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="card-glass">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {statusData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.fill }} />
                  <span className="text-xs text-text-secondary">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Origem Distribution */}
          <div className="card-glass">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Leads por Origem</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={origemData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {origemData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Temperatura Distribution */}
          <div className="card-glass">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Temperatura dos Leads</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={temperaturaData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {temperaturaData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              {temperaturaData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.fill }} />
                  <span className="text-xs text-text-secondary">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="card-glass">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Leads por Semana</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
                <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#00C8F0"
                  fill="#00C8F020"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Valor por Origem */}
          <div className="card-glass lg:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Valor Estimado por Origem</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={valorPorOrigem}>
                <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  {...CHART_TOOLTIP_STYLE}
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
                <Bar dataKey="valor" fill="#00C8F0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function KpiCard({
  icon,
  label,
  value,
  format,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  format: (n: number) => string
  color?: string
}) {
  return (
    <MotionCard className="card-glass">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-bg-navy/50">{icon}</div>
      </div>
      <p className={`text-xl font-bold ${color ?? 'text-text-primary'}`}>
        <AnimatedNumber value={value} format={format} />
      </p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </MotionCard>
  )
}
