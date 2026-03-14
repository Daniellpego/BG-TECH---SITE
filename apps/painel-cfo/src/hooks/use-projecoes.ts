'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePeriod } from '@/providers/period-provider'
import type { Projecao, CustoFixo, Caixa } from '@/types/database'

export interface ProjecaoMes {
  mes: number
  label: string
  receitaSetup: number
  receitaMRR: number
  receita: number
  clientesNovos: number
  clientesAtivos: number
  mensalidadeMes: number
  custosFixos: number
  custosVariaveis: number
  resultado: number
  caixaAcumulado: number
}

export interface ProjecaoCalculada {
  cenario: Projecao
  meses: ProjecaoMes[]
  receita12m: number
  receitaSetup12m: number
  receitaMRR12m: number
  mrr12m: number
  clientesAtivos12m: number
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

  const isLoading = loadingCenarios || loadingCustos || loadingCaixa

  const projecoes = useMemo(() => {
    if (!cenarios) return []

    const totalCustosFixos = (custosFixos ?? []).reduce(
      (s, c) => s + Number(c.valor_mensal),
      0
    )

    const caixaInicial = caixaData?.[0] ? Number(caixaData[0].saldo) : 0

    return cenarios.map((cenario) => {
      const mesesProj: ProjecaoMes[] = []
      let prevCaixa = caixaInicial
      let lucroAcumulado = 0

      const cfProjetados = cenario.custos_fixos_projetados != null
        ? Number(cenario.custos_fixos_projetados)
        : totalCustosFixos

      const novosClientesMes = Number(cenario.novos_clientes_mes)
      const setupPorCliente = Number(cenario.setup_por_cliente ?? 0)
      const mensalidadePorCliente = Number(cenario.ticket_medio) // ticket_medio = mensalidade
      const custoVarPct = Number(cenario.custo_variavel_percentual) / 100
      const taxaCrescimento = Number(cenario.taxa_crescimento_mensal) / 100

      // Nova lógica: Setup cobrado UMA VEZ no mês de entrada
      // Mensalidade começa no mês SEGUINTE ao fechamento
      // Clientes ativos = soma de clientes dos meses ANTERIORES

      for (let i = 0; i < 12; i++) {
        const mesIndex = ((month - 1 + i + 1) % 12)
        const anoOffset = Math.floor((month + i) / 12)
        const mesLabel = `${MONTH_SHORT[mesIndex]}/${String((year + anoOffset) % 100).padStart(2, '0')}`

        // Novos clientes neste mês — FIXO, não cresce com a taxa
        const clientesNovosMes = novosClientesMes

        // Clientes ativos = soma de clientes de TODOS os meses anteriores
        // (não conta os novos deste mês — mensalidade começa no mês seguinte)
        const clientesAtivos = mesesProj.reduce((s, m) => s + m.clientesNovos, 0)

        // Mensalidade cresce pela taxa de crescimento mensal
        const mensalidadeMes = mensalidadePorCliente * Math.pow(1 + taxaCrescimento, i)

        // Receita de Setup: cobrado UMA VEZ, VALOR FIXO (não cresce)
        const receitaSetup = clientesNovosMes * setupPorCliente

        // Receita de Mensalidade (MRR): clientes ativos × mensalidade do mês
        const receitaMRR = clientesAtivos * mensalidadeMes

        // Receita total do mês
        const receita = receitaSetup + receitaMRR

        const custosFixosMes = cfProjetados
        const custosVariaveis = receita * custoVarPct
        const resultado = receita - custosFixosMes - custosVariaveis
        const caixaAcumulado = prevCaixa + resultado

        lucroAcumulado += resultado

        mesesProj.push({
          mes: i + 1,
          label: mesLabel,
          receitaSetup,
          receitaMRR,
          receita,
          clientesNovos: clientesNovosMes,
          clientesAtivos,
          mensalidadeMes,
          custosFixos: custosFixosMes,
          custosVariaveis,
          resultado,
          caixaAcumulado,
        })

        prevCaixa = caixaAcumulado
      }

      const receita12m = mesesProj.reduce((s, m) => s + m.receita, 0)
      const receitaSetup12m = mesesProj.reduce((s, m) => s + m.receitaSetup, 0)
      const receitaMRR12m = mesesProj.reduce((s, m) => s + m.receitaMRR, 0)

      // MRR no mês 12 (apenas mensalidades)
      const mrr12m = mesesProj[11]?.receitaMRR ?? 0

      // Total de clientes ativos no mês 12
      // = soma de todos os clientes novos de todos os 12 meses
      const clientesAtivos12m = mesesProj.reduce((s, m) => s + m.clientesNovos, 0)

      // Break-even: quantos clientes ativos necessários pra cobrir custos fixos
      const margemContribuicao = mensalidadePorCliente * (1 - custoVarPct)
      const breakEven = margemContribuicao > 0
        ? Math.ceil(cfProjetados / margemContribuicao)
        : 0

      // Runway: meses de caixa ao ritmo atual
      const burnMensal = cfProjetados
      const runwayAtual = burnMensal > 0 ? Math.floor(caixaInicial / burnMensal) : 99

      // Mês de break-even (primeiro mês com resultado positivo)
      const mesBreakEvenIdx = mesesProj.findIndex((m) => m.resultado >= 0)
      const mesBreakEven = mesBreakEvenIdx >= 0 ? mesesProj[mesBreakEvenIdx]!.label : 'N/A'

      return {
        cenario,
        meses: mesesProj,
        receita12m,
        receitaSetup12m,
        receitaMRR12m,
        mrr12m,
        clientesAtivos12m,
        lucroAcumulado,
        breakEven,
        runwayAtual,
        mesBreakEven,
      } as ProjecaoCalculada
    })
  }, [cenarios, custosFixos, caixaData, month, year])

  return { projecoes, isLoading }
}

export interface ProjecaoInsert {
  nome: string
  taxa_crescimento_mensal: number
  novos_clientes_mes: number
  ticket_medio: number
  setup_por_cliente?: number
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

export function useUpdateProjecao() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjecaoInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from('projecoes')
        .update(updates as unknown as Record<string, unknown>)
        .eq('id', id)
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
