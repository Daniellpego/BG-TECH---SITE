'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { usePeriod } from '@/providers/period-provider'
import type { Lead, Deal } from '@/types/database'

export function useDashboard() {
  const { startDate, endDate } = usePeriod()
  const supabase = createClient()

  const leadsQuery = useQuery({
    queryKey: ['dashboard-leads', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Lead[]
    },
  })

  const dealsQuery = useQuery({
    queryKey: ['dashboard-deals', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Deal[]
    },
  })

  const followupsQuery = useQuery({
    queryKey: ['dashboard-followups'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .not('proximo_followup', 'is', null)
        .lte('proximo_followup', today ?? '')
        .not('status', 'in', '(fechado_ganho,fechado_perdido)')
        .order('proximo_followup', { ascending: true })
        .limit(10)

      if (error) throw error
      return data as Lead[]
    },
  })

  const recentLeadsQuery = useQuery({
    queryKey: ['dashboard-recent-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      return data as Lead[]
    },
  })

  const leads = leadsQuery.data ?? []
  const deals = dealsQuery.data ?? []

  const novos = leads.filter((l) => l.status === 'novo').length
  const qualificados = leads.filter((l) => l.status === 'qualificado').length
  const emReuniao = leads.filter((l) => l.status === 'reuniao').length
  const propostas = leads.filter((l) => l.status === 'proposta').length
  const ganhos = leads.filter((l) => l.status === 'fechado_ganho').length
  const perdidos = leads.filter((l) => l.status === 'fechado_perdido').length

  const totalLeads = leads.length
  const leadsQuentes = leads.filter((l) => l.temperatura === 'quente').length
  const pipelineValue = leads
    .filter((l) => !['fechado_ganho', 'fechado_perdido'].includes(l.status))
    .reduce((sum, l) => sum + (l.valor_estimado || 0), 0)

  const dealsGanhos = deals.filter((d) => d.status === 'ganho')
  const totalGanho = dealsGanhos.reduce((sum, d) => sum + (d.valor || 0), 0)
  const totalMRR = dealsGanhos.reduce((sum, d) => sum + (d.mrr || 0), 0)

  const dealsTotal = deals.filter((d) => d.status !== 'aberto').length
  const winRate = dealsTotal > 0 ? (dealsGanhos.length / dealsTotal) * 100 : 0

  const conversionRate = totalLeads > 0 ? (ganhos / totalLeads) * 100 : 0

  // Pipeline mini stats
  const pipelineStages = [
    { label: 'Novo', count: novos, color: '#94A3B8' },
    { label: 'Qualificado', count: qualificados, color: '#00C8F0' },
    { label: 'Reunião', count: emReuniao, color: '#F59E0B' },
    { label: 'Proposta', count: propostas, color: '#2B7AB5' },
    { label: 'Ganho', count: ganhos, color: '#10B981' },
    { label: 'Perdido', count: perdidos, color: '#EF4444' },
  ]

  return {
    isLoading: leadsQuery.isLoading || dealsQuery.isLoading,
    totalLeads,
    leadsQuentes,
    pipelineValue,
    totalGanho,
    totalMRR,
    winRate,
    conversionRate,
    pipelineStages,
    recentLeads: recentLeadsQuery.data ?? [],
    followups: followupsQuery.data ?? [],
    leads,
  }
}
