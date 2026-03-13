'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePeriod } from '@/providers/period-provider'
import type { Projecao, Receita, CustoFixo, Caixa } from '@/types/database'

export interface ProjecaoMes {
  mes: number
  label: string
  receita: number
  mrr: number
  custosFixos: number
  custosVariaveis: number
  resultado: number
  caixaAcumulado: number
}

export interface ProjecaoCalculada {
  cenario: Projecao
  meses: ProjecaoMes[]
  receita12m: number
  mrr12m: number
  lucroAcumulado: number
  breakEven: number
  runwayAtual: number
  mesBreakEven: string
}

export interface UseProjecoesResult {
  projecoes: ProjecaoCalculada[]
  isLoading: boolean
}

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export function useProjecoes(): UseProjecoesResult {
  const { month, year } = usePeriod()
  const supabase = createClient()

  // Fetch projecoes (scenarios)
  const { data: cenarios, isLoading: loadingCenarios } = useQuery({
    queryKey: ['projecoes-cenarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projecoes')
        .select('*')
        .order('taxa_crescimento_mensal', { ascending: true })

      if (error) throw error
      return data as Projecao[]
    },
  })

  // Fetch last month's MRR (recorrente + confirmado)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate()
  const prevEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`

  const { data: receitasPrevMonth, isLoading: loadingReceitas } = useQuery({
    queryKey: ['projecoes-receitas', prevStart, prevEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas')
        .select('*')
        .gte('data', prevStart)
        .lte('data', prevEnd)
        .eq('status', 'confirmado')

      if (error) throw error
      return data as Receita[]
    },
  })

  // Fetch active custos fixos
  const { data: custosFixos, isLoading: loadingCustos } = useQuery({
    queryKey: ['projecoes-custos-fixos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('*')
        .eq('status', 'ativo')

      if (error) throw error
      return data as CustoFixo[]
    },
  })

  // Fetch latest caixa
  const { data: caixaData, isLoading: loadingCaixa } = useQuery({
    queryKey: ['projecoes-caixa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caixa')
        .select('*')
        .order('data', { ascending: false })
        .limit(1)

      if (error) throw error
      return data as Caixa[]
    },
  })

  const isLoading = loadingCenarios || loadingReceitas || loadingCustos || loadingCaixa

  const projecoes = useMemo(() => {
    if (!cenarios) return []

    const currentMRR = (receitasPrevMonth ?? [])
      .filter((r) => r.recorrente)
      .reduce((s, r) => s + Number(r.valor_bruto), 0)

    const totalCustosFixos = (custosFixos ?? []).reduce(
      (s, c) => s + Number(c.valor_mensal),
      0
    )

    const caixaInicial = caixaData?.[0] ? Number(caixaData[0].saldo) : 0

    return cenarios.map((cenario) => {
      const mesesProj: ProjecaoMes[] = []
      let prevMRR = currentMRR
      let prevCaixa = caixaInicial
      let lucroAcumulado = 0

      const cfProjetados = cenario.custos_fixos_projetados != null
        ? Number(cenario.custos_fixos_projetados)
        : totalCustosFixos

      for (let i = 0; i < 12; i++) {
        const mesIndex = ((month - 1 + i + 1) % 12)
        const anoOffset = Math.floor((month + i) / 12)
        const mesLabel = `${MONTH_SHORT[mesIndex]}/${String((year + anoOffset) % 100).padStart(2, '0')}`

        // MRR grows by growth rate each month
        const mrrGrown = prevMRR * (1 + Number(cenario.taxa_crescimento_mensal) / 100)

        // First month: novos_clientes * ticket_medio added to MRR
        const newClientRevenue = i === 0
          ? Number(cenario.novos_clientes_mes) * Number(cenario.ticket_medio)
          : 0

        const mrr = mrrGrown + newClientRevenue
        const receita = mrr

        const custosFixosMes = cfProjetados
        const custosVariaveis = receita * Number(cenario.custo_variavel_percentual) / 100
        const resultado = receita - custosFixosMes - custosVariaveis
        const caixaAcumulado = prevCaixa + resultado

        lucroAcumulado += resultado

        mesesProj.push({
          mes: i + 1,
          label: mesLabel,
          receita,
          mrr,
          custosFixos: custosFixosMes,
          custosVariaveis,
          resultado,
          caixaAcumulado,
        })

        prevMRR = mrr
        prevCaixa = caixaAcumulado
      }

      const receita12m = mesesProj.reduce((s, m) => s + m.receita, 0)
      const mrr12m = mesesProj[11]?.mrr ?? 0

      // Break-even in clients: how many clients needed so revenue covers costs
      const ticketMedio = Number(cenario.ticket_medio)
      const margemContribuicao = ticketMedio * (1 - Number(cenario.custo_variavel_percentual) / 100)
      const breakEven = margemContribuicao > 0
        ? Math.ceil(cfProjetados / margemContribuicao)
        : 0

      // Runway: months of cash left at current burn rate
      const burnMensal = cfProjetados + (currentMRR * Number(cenario.custo_variavel_percentual) / 100) - currentMRR
      const runwayAtual = burnMensal > 0 ? Math.floor(caixaInicial / burnMensal) : 99

      // Month of break-even (first month with positive resultado)
      const mesBreakEvenIdx = mesesProj.findIndex((m) => m.resultado >= 0)
      const mesBreakEven = mesBreakEvenIdx >= 0 ? mesesProj[mesBreakEvenIdx]!.label : 'N/A'

      return {
        cenario,
        meses: mesesProj,
        receita12m,
        mrr12m,
        lucroAcumulado,
        breakEven,
        runwayAtual,
        mesBreakEven,
      } as ProjecaoCalculada
    })
  }, [cenarios, receitasPrevMonth, custosFixos, caixaData, month, year])

  return { projecoes, isLoading }
}

export interface ProjecaoInsert {
  nome: string
  taxa_crescimento_mensal: number
  novos_clientes_mes: number
  ticket_medio: number
  custos_fixos_projetados?: number | null
  custo_variavel_percentual: number
  meses_projecao: number
}

export function useCreateProjecao() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (projecao: ProjecaoInsert) => {
      const { data, error } = await supabase
        .from('projecoes')
        .insert(projecao as unknown as Record<string, unknown>)
        .select()
        .single()

      if (error) throw error
      return data as Projecao
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projecoes-cenarios'] })
    },
  })
}

export function useDeleteProjecao() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projecoes')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projecoes-cenarios'] })
    },
  })
}
