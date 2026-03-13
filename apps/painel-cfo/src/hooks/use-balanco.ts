'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { usePeriod } from '@/providers/period-provider'
import type { Receita, CustoFixo, GastoVariavel } from '@/types/database'

export interface BalancoMes {
  mes: number
  entradas: number
  saidas: number
  custosFixos: number
  gastosVariaveis: number
  saldo: number
  receitasPorTipo: Record<string, number>
  gastosPorCategoria: Record<string, number>
}

export interface BalancoAnual {
  meses: BalancoMes[]
  faturamentoAno: number
  gastosAno: number
  saldoAno: number
  isLoading: boolean
}

export function useBalanco(): BalancoAnual {
  const { year } = usePeriod()
  const supabase = createClient()

  const { data: receitas, isLoading: loadingReceitas } = useQuery({
    queryKey: ['balanco-receitas', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas')
        .select('*')
        .gte('data', `${year}-01-01`)
        .lte('data', `${year}-12-31`)
        .eq('status', 'confirmado')
        .order('data', { ascending: true })

      if (error) throw error
      return data as Receita[]
    },
  })

  const { data: custosFixos, isLoading: loadingCustos } = useQuery({
    queryKey: ['balanco-custos-fixos', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('*')
        .eq('status', 'ativo')

      if (error) throw error
      return data as CustoFixo[]
    },
  })

  const { data: gastosVariaveis, isLoading: loadingGastos } = useQuery({
    queryKey: ['balanco-gastos-variaveis', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_variaveis')
        .select('*')
        .gte('data', `${year}-01-01`)
        .lte('data', `${year}-12-31`)
        .eq('status', 'confirmado')
        .order('data', { ascending: true })

      if (error) throw error
      return data as GastoVariavel[]
    },
  })

  const isLoading = loadingReceitas || loadingCustos || loadingGastos

  const totalCustosFixosMensal = (custosFixos ?? []).reduce(
    (sum, c) => sum + Number(c.valor_mensal),
    0
  )

  const meses: BalancoMes[] = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1

    const receitasMes = (receitas ?? []).filter((r) => {
      const m = new Date(r.data).getMonth() + 1
      return m === mes
    })

    const gastosMes = (gastosVariaveis ?? []).filter((r) => {
      const m = new Date(r.data).getMonth() + 1
      return m === mes
    })

    const entradas = receitasMes.reduce((s, r) => s + Number(r.valor_bruto), 0)
    const totalGastosVar = gastosMes.reduce((s, g) => s + Number(g.valor), 0)
    const saidas = totalCustosFixosMensal + totalGastosVar
    const saldo = entradas - saidas

    const receitasPorTipo: Record<string, number> = {}
    for (const r of receitasMes) {
      receitasPorTipo[r.tipo] = (receitasPorTipo[r.tipo] ?? 0) + Number(r.valor_bruto)
    }

    const gastosPorCategoria: Record<string, number> = {}
    for (const g of gastosMes) {
      gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] ?? 0) + Number(g.valor)
    }
    if (totalCustosFixosMensal > 0) {
      gastosPorCategoria['custos_fixos'] = totalCustosFixosMensal
    }

    return {
      mes,
      entradas,
      saidas,
      custosFixos: totalCustosFixosMensal,
      gastosVariaveis: totalGastosVar,
      saldo,
      receitasPorTipo,
      gastosPorCategoria,
    }
  })

  const faturamentoAno = meses.reduce((s, m) => s + m.entradas, 0)
  const gastosAno = meses.reduce((s, m) => s + m.saidas, 0)
  const saldoAno = faturamentoAno - gastosAno

  return { meses, faturamentoAno, gastosAno, saldoAno, isLoading }
}
