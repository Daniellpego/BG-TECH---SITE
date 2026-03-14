'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Users, Target, DollarSign, TrendingUp, Flame, BarChart3,
  MessageCircle, Calendar, ArrowRight,
} from 'lucide-react'
import { PageTransition, StaggerContainer, StaggerItem, AnimatedNumber, MotionCard } from '@/components/motion'
import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/hooks/use-dashboard'
import { formatCurrency, formatTimeAgo, formatDate, formatWhatsAppUrl } from '@/lib/format'
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types/database'

export default function DashboardPage() {
  const {
    isLoading,
    totalLeads,
    leadsQuentes,
    pipelineValue,
    totalGanho,
    totalMRR,
    winRate,
    conversionRate,
    pipelineStages,
    recentLeads,
    followups,
  } = useDashboard()

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Visão Geral</h1>
            <p className="text-sm text-text-secondary mt-1">Resumo de vendas e pipeline</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageTitle title="Dashboard" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Visão Geral</h1>
          <p className="text-sm text-text-secondary mt-1">Resumo de vendas e pipeline</p>
        </div>

        {/* KPI Cards */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StaggerItem>
            <KpiCard
              icon={<Users className="h-5 w-5 text-brand-cyan" />}
              label="Total Leads"
              value={totalLeads}
              format={(n: number) => String(n)}
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              icon={<Flame className="h-5 w-5 text-status-negative" />}
              label="Leads Quentes"
              value={leadsQuentes}
              format={(n: number) => String(n)}
              color="text-status-negative"
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              icon={<Target className="h-5 w-5 text-status-warning" />}
              label="Pipeline"
              value={pipelineValue}
              format={formatCurrency}
              color="text-brand-cyan"
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              icon={<DollarSign className="h-5 w-5 text-status-positive" />}
              label="Ganho"
              value={totalGanho}
              format={formatCurrency}
              color="text-status-positive"
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              icon={<TrendingUp className="h-5 w-5 text-brand-blue" />}
              label="MRR"
              value={totalMRR}
              format={formatCurrency}
              color="text-brand-cyan"
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              icon={<BarChart3 className="h-5 w-5 text-status-positive" />}
              label="Win Rate"
              value={winRate}
              format={(n: number) => `${n.toFixed(0)}%`}
              color="text-status-positive"
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Mini Pipeline + Conversion */}
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StaggerItem className="lg:col-span-2">
            <div className="card-glass">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Mini Pipeline</h2>
                <Link href="/pipeline">
                  <Button variant="ghost" size="sm">
                    Ver Kanban <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {pipelineStages.map((stage) => (
                  <div key={stage.label} className="text-center">
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{ color: stage.color }}
                    >
                      {stage.count}
                    </div>
                    <p className="text-xs text-text-secondary">{stage.label}</p>
                    <div
                      className="h-1 rounded-full mt-2"
                      style={{ background: `${stage.color}30` }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          background: stage.color,
                          width: `${totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="card-glass h-full flex flex-col items-center justify-center">
              <p className="text-xs text-text-secondary mb-2">Taxa de Conversão</p>
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#153B5F"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray={`${conversionRate}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-status-positive">
                    {conversionRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-dark mt-2">Lead → Ganho</p>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Recent Leads + Follow-ups */}
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <StaggerItem>
            <div className="card-glass">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Leads Recentes</h2>
                <Link href="/leads">
                  <Button variant="ghost" size="sm">
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              {recentLeads.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-6">Nenhum lead recente</p>
              ) : (
                <div className="space-y-3">
                  {recentLeads.map((lead) => (
                    <Link key={lead.id} href={`/leads/${lead.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-bg-navy/50 hover:bg-bg-navy transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {lead.nome}
                            </p>
                            <p className="text-xs text-text-secondary truncate">
                              {lead.empresa ?? 'Sem empresa'} · {formatTimeAgo(lead.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-md"
                            style={{
                              color: LEAD_STATUS_COLORS[lead.status] ?? '#94A3B8',
                              background: `${LEAD_STATUS_COLORS[lead.status] ?? '#94A3B8'}20`,
                            }}
                          >
                            {LEAD_STATUS_LABELS[lead.status] ?? 'Não definido'}
                          </span>
                          {lead.whatsapp && (
                            <a
                              href={formatWhatsAppUrl(lead.whatsapp, lead.nome)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageCircle className="h-4 w-4 text-status-positive" />
                            </a>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Follow-ups */}
          <StaggerItem>
            <div className="card-glass">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Follow-ups Pendentes</h2>
                <Calendar className="h-4 w-4 text-status-warning" />
              </div>
              {followups.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-6">
                  Nenhum follow-up pendente
                </p>
              ) : (
                <div className="space-y-3">
                  {followups.map((lead) => (
                    <Link key={lead.id} href={`/leads/${lead.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-bg-navy/50 hover:bg-bg-navy transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {lead.nome}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {lead.empresa ?? 'Sem empresa'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-status-warning">
                            {lead.proximo_followup ? formatDate(lead.proximo_followup) : '-'}
                          </p>
                          <p className="text-xs text-text-dark">
                            {lead.proximo_followup ? formatTimeAgo(lead.proximo_followup) : ''}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>
        </StaggerContainer>
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
