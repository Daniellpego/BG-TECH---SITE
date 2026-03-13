'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { usePeriod } from '@/providers/period-provider'
import type { Receita, CustoFixo, GastoVariavel } from '@/types/database'

export interface DRELine {
  label: string
  month: number
  ytd: number
  percent: number
  percentYtd: number
  type: 'header' | 'sub' | 'subtotal' | 'total' | 'separator'
  indent?: boolean
}

export interface DREMonthData {
  month: string
  monthLabel: string
  receitaBruta: number
  custosVariaveis: number
  margemBruta: number
  custosFixos: number
  resultadoOperacional: number
  impostos: number
  resultadoLiquido: number
}

function sumBy<T>(arr: T[], fn: (item: T) => number): number {
  return arr.reduce((sum, item) => sum + fn(item), 0)
}

function pct(value: number, base: number): number {
  if (base === 0) return 0
  return (value / base) * 100
}

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

function computeMonthDRE(
  receitas: Receita[],
  custosFixos: CustoFixo[],
  gastosVariaveis: GastoVariavel[]
) {
  const confirmed = receitas.filter((r) => r.status === 'confirmado')
  const confirmedGastos = gastosVariaveis.filter((g) => g.status === 'confirmado')
  const activeCustos = custosFixos.filter((c) => c.status === 'ativo')

  const receitaBruta = sumBy(confirmed, (r) => Number(r.valor_bruto))
  const receitaSetup = sumBy(
    confirmed.filter((r) => r.tipo === 'setup'),
    (r) => Number(r.valor_bruto)
  )
  const receitaMensalidades = sumBy(
    confirmed.filter((r) => r.tipo === 'mensalidade'),
    (r) => Number(r.valor_bruto)
  )
  const receitaProjetos = sumBy(
    confirmed.filter((r) =>
      ['projeto_avulso', 'consultoria', 'mvp', 'outro'].includes(r.tipo)
    ),
    (r) => Number(r.valor_bruto)
  )

  // Custos variaveis (excluindo impostos)
  const custosVariaveisItems = confirmedGastos.filter((g) => g.tipo !== 'impostos')
  const custosVariaveisTotal = sumBy(custosVariaveisItems, (g) => Number(g.valor))
  const cvMarketing = sumBy(
    custosVariaveisItems.filter((g) => g.categoria === 'marketing'),
    (g) => Number(g.valor)
  )
  const cvComercial = sumBy(
    custosVariaveisItems.filter((g) => g.categoria === 'comercial'),
    (g) => Number(g.valor)
  )
  const cvFreelancer = sumBy(
    custosVariaveisItems.filter((g) => g.categoria === 'freelancer'),
    (g) => Number(g.valor)
  )
  const cvApiConsumo = sumBy(
    custosVariaveisItems.filter((g) => g.categoria === 'api_consumo'),
    (g) => Number(g.valor)
  )
  const cvOutro = sumBy(
    custosVariaveisItems.filter(
      (g) => !['marketing', 'comercial', 'freelancer', 'api_consumo'].includes(g.categoria)
    ),
    (g) => Number(g.valor)
  )

  const margemBruta = receitaBruta - custosVariaveisTotal
  const pctMargemBruta = pct(margemBruta, receitaBruta)

  // Custos fixos by category
  const cfTotal = sumBy(activeCustos, (c) => Number(c.valor_mensal))
  const cfFerramentas = sumBy(
    activeCustos.filter((c) => c.categoria === 'ferramentas'),
    (c) => Number(c.valor_mensal)
  )
  const cfContabilidade = sumBy(
    activeCustos.filter((c) => c.categoria === 'contabilidade'),
    (c) => Number(c.valor_mensal)
  )
  const cfMarketing = sumBy(
    activeCustos.filter((c) => c.categoria === 'marketing'),
    (c) => Number(c.valor_mensal)
  )
  const cfInfra = sumBy(
    activeCustos.filter((c) => c.categoria === 'infraestrutura'),
    (c) => Number(c.valor_mensal)
  )
  const cfAdmin = sumBy(
    activeCustos.filter((c) => c.categoria === 'administrativo'),
    (c) => Number(c.valor_mensal)
  )
  const cfProLabore = sumBy(
    activeCustos.filter((c) => c.categoria === 'pro_labore'),
    (c) => Number(c.valor_mensal)
  )
  const cfImpostosFixos = sumBy(
    activeCustos.filter((c) => c.categoria === 'impostos_fixos'),
    (c) => Number(c.valor_mensal)
  )
  const cfOutro = sumBy(
    activeCustos.filter((c) => c.categoria === 'outro'),
    (c) => Number(c.valor_mensal)
  )

  const resultadoOperacional = margemBruta - cfTotal

  const impostos = sumBy(
    confirmedGastos.filter((g) => g.tipo === 'impostos'),
    (g) => Number(g.valor)
  )

  const resultadoLiquido = resultadoOperacional - impostos
  const pctMargemLiquida = pct(resultadoLiquido, receitaBruta)

  return {
    receitaBruta,
    receitaSetup,
    receitaMensalidades,
    receitaProjetos,
    custosVariaveisTotal,
    cvMarketing,
    cvComercial,
    cvFreelancer,
    cvApiConsumo,
    cvOutro,
    margemBruta,
    pctMargemBruta,
    cfTotal,
    cfFerramentas,
    cfContabilidade,
    cfMarketing,
    cfInfra,
    cfAdmin,
    cfProLabore,
    cfImpostosFixos,
    cfOutro,
    resultadoOperacional,
    impostos,
    resultadoLiquido,
    pctMargemLiquida,
  }
}

export function useDRE() {
  const { month, year, startDate, endDate } = usePeriod()
  const supabase = createClient()

  // Current month data
  const receitasQuery = useQuery({
    queryKey: ['dre-receitas', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas')
        .select('*')
        .gte('data', startDate)
        .lte('data', endDate)
      if (error) throw error
      return data as Receita[]
    },
  })

  const custosFixosQuery = useQuery({
    queryKey: ['dre-custos-fixos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('*')
      if (error) throw error
      return data as CustoFixo[]
    },
  })

  const gastosVariaveisQuery = useQuery({
    queryKey: ['dre-gastos-variaveis', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_variaveis')
        .select('*')
        .gte('data', startDate)
        .lte('data', endDate)
      if (error) throw error
      return data as GastoVariavel[]
    },
  })

  // YTD data (all months from January to selected month)
  const ytdStart = `${year}-01-01`
  const receitasYtdQuery = useQuery({
    queryKey: ['dre-receitas-ytd', ytdStart, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas')
        .select('*')
        .gte('data', ytdStart)
        .lte('data', endDate)
      if (error) throw error
      return data as Receita[]
    },
  })

  const gastosVariaveisYtdQuery = useQuery({
    queryKey: ['dre-gastos-variaveis-ytd', ytdStart, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_variaveis')
        .select('*')
        .gte('data', ytdStart)
        .lte('data', endDate)
      if (error) throw error
      return data as GastoVariavel[]
    },
  })

  // Last 12 months for charts
  const chartQuery = useQuery({
    queryKey: ['dre-chart', month, year],
    queryFn: async () => {
      const months: DREMonthData[] = []
      // Build date range for last 12 months
      let m = month
      let y = year
      const ranges: { m: number; y: number; start: string; end: string }[] = []
      for (let i = 0; i < 12; i++) {
        const { start, end } = getMonthRange(y, m)
        ranges.unshift({ m, y, start, end })
        m--
        if (m === 0) {
          m = 12
          y--
        }
      }

      const first = ranges[0]!
      const last = ranges[ranges.length - 1]!

      const [recRes, gvRes] = await Promise.all([
        supabase
          .from('receitas')
          .select('*')
          .gte('data', first.start)
          .lte('data', last.end),
        supabase
          .from('gastos_variaveis')
          .select('*')
          .gte('data', first.start)
          .lte('data', last.end),
      ])

      if (recRes.error) throw recRes.error
      if (gvRes.error) throw gvRes.error

      const allReceitas = recRes.data as Receita[]
      const allGastos = gvRes.data as GastoVariavel[]
      const allCustos = custosFixosQuery.data ?? []

      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
      ]

      for (const range of ranges) {
        const monthReceitas = allReceitas.filter(
          (r) => r.data >= range.start && r.data <= range.end
        )
        const monthGastos = allGastos.filter(
          (g) => g.data >= range.start && g.data <= range.end
        )
        const dre = computeMonthDRE(monthReceitas, allCustos, monthGastos)

        months.push({
          month: `${range.y}-${String(range.m).padStart(2, '0')}`,
          monthLabel: `${monthNames[range.m - 1]}/${String(range.y).slice(-2)}`,
          receitaBruta: dre.receitaBruta,
          custosVariaveis: dre.custosVariaveisTotal,
          margemBruta: dre.margemBruta,
          custosFixos: dre.cfTotal,
          resultadoOperacional: dre.resultadoOperacional,
          impostos: dre.impostos,
          resultadoLiquido: dre.resultadoLiquido,
        })
      }

      return months
    },
    enabled: !!custosFixosQuery.data,
  })

  const isLoading =
    receitasQuery.isLoading ||
    custosFixosQuery.isLoading ||
    gastosVariaveisQuery.isLoading ||
    receitasYtdQuery.isLoading ||
    gastosVariaveisYtdQuery.isLoading

  const receitas = receitasQuery.data ?? []
  const custosFixos = custosFixosQuery.data ?? []
  const gastosVariaveis = gastosVariaveisQuery.data ?? []
  const receitasYtd = receitasYtdQuery.data ?? []
  const gastosVariaveisYtd = gastosVariaveisYtdQuery.data ?? []

  const current = computeMonthDRE(receitas, custosFixos, gastosVariaveis)
  const ytdRaw = computeMonthDRE(receitasYtd, custosFixos, gastosVariaveisYtd)
  // YTD custos fixos: multiply by number of months elapsed
  const ytd = {
    ...ytdRaw,
    cfTotal: ytdRaw.cfTotal * month,
    cfFerramentas: ytdRaw.cfFerramentas * month,
    cfContabilidade: ytdRaw.cfContabilidade * month,
    cfMarketing: ytdRaw.cfMarketing * month,
    cfInfra: ytdRaw.cfInfra * month,
    cfAdmin: ytdRaw.cfAdmin * month,
    cfProLabore: ytdRaw.cfProLabore * month,
    cfImpostosFixos: ytdRaw.cfImpostosFixos * month,
    cfOutro: ytdRaw.cfOutro * month,
    margemBruta: ytdRaw.receitaBruta - ytdRaw.custosVariaveisTotal,
    resultadoOperacional:
      ytdRaw.receitaBruta - ytdRaw.custosVariaveisTotal - ytdRaw.cfTotal * month,
    resultadoLiquido:
      ytdRaw.receitaBruta -
      ytdRaw.custosVariaveisTotal -
      ytdRaw.cfTotal * month -
      ytdRaw.impostos,
    pctMargemBruta: pct(
      ytdRaw.receitaBruta - ytdRaw.custosVariaveisTotal,
      ytdRaw.receitaBruta
    ),
    pctMargemLiquida: pct(
      ytdRaw.receitaBruta -
        ytdRaw.custosVariaveisTotal -
        ytdRaw.cfTotal * month -
        ytdRaw.impostos,
      ytdRaw.receitaBruta
    ),
  }

  function buildLines(): DRELine[] {
    const rb = current.receitaBruta
    const rbYtd = ytd.receitaBruta

    return [
      // RECEITA BRUTA
      {
        label: 'RECEITA BRUTA',
        month: current.receitaBruta,
        ytd: ytd.receitaBruta,
        percent: 100,
        percentYtd: 100,
        type: 'header',
      },
      {
        label: 'Setup',
        month: current.receitaSetup,
        ytd: ytd.receitaSetup,
        percent: pct(current.receitaSetup, rb),
        percentYtd: pct(ytd.receitaSetup, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Mensalidades',
        month: current.receitaMensalidades,
        ytd: ytd.receitaMensalidades,
        percent: pct(current.receitaMensalidades, rb),
        percentYtd: pct(ytd.receitaMensalidades, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Projetos',
        month: current.receitaProjetos,
        ytd: ytd.receitaProjetos,
        percent: pct(current.receitaProjetos, rb),
        percentYtd: pct(ytd.receitaProjetos, rbYtd),
        type: 'sub',
        indent: true,
      },
      { label: '', month: 0, ytd: 0, percent: 0, percentYtd: 0, type: 'separator' },

      // CUSTOS VARIAVEIS
      {
        label: '(-) CUSTOS VARIÁVEIS',
        month: current.custosVariaveisTotal,
        ytd: ytd.custosVariaveisTotal,
        percent: pct(current.custosVariaveisTotal, rb),
        percentYtd: pct(ytd.custosVariaveisTotal, rbYtd),
        type: 'header',
      },
      {
        label: 'Marketing',
        month: current.cvMarketing,
        ytd: ytd.cvMarketing,
        percent: pct(current.cvMarketing, rb),
        percentYtd: pct(ytd.cvMarketing, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Comercial',
        month: current.cvComercial,
        ytd: ytd.cvComercial,
        percent: pct(current.cvComercial, rb),
        percentYtd: pct(ytd.cvComercial, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Freelancer',
        month: current.cvFreelancer,
        ytd: ytd.cvFreelancer,
        percent: pct(current.cvFreelancer, rb),
        percentYtd: pct(ytd.cvFreelancer, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'APIs / Consumo',
        month: current.cvApiConsumo,
        ytd: ytd.cvApiConsumo,
        percent: pct(current.cvApiConsumo, rb),
        percentYtd: pct(ytd.cvApiConsumo, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Outros',
        month: current.cvOutro,
        ytd: ytd.cvOutro,
        percent: pct(current.cvOutro, rb),
        percentYtd: pct(ytd.cvOutro, rbYtd),
        type: 'sub',
        indent: true,
      },
      { label: '', month: 0, ytd: 0, percent: 0, percentYtd: 0, type: 'separator' },

      // MARGEM BRUTA
      {
        label: '(=) MARGEM BRUTA',
        month: current.margemBruta,
        ytd: ytd.margemBruta,
        percent: current.pctMargemBruta,
        percentYtd: ytd.pctMargemBruta,
        type: 'subtotal',
      },
      { label: '', month: 0, ytd: 0, percent: 0, percentYtd: 0, type: 'separator' },

      // CUSTOS FIXOS
      {
        label: '(-) CUSTOS FIXOS',
        month: current.cfTotal,
        ytd: ytd.cfTotal,
        percent: pct(current.cfTotal, rb),
        percentYtd: pct(ytd.cfTotal, rbYtd),
        type: 'header',
      },
      {
        label: 'Ferramentas',
        month: current.cfFerramentas,
        ytd: ytd.cfFerramentas,
        percent: pct(current.cfFerramentas, rb),
        percentYtd: pct(ytd.cfFerramentas, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Contabilidade',
        month: current.cfContabilidade,
        ytd: ytd.cfContabilidade,
        percent: pct(current.cfContabilidade, rb),
        percentYtd: pct(ytd.cfContabilidade, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Marketing',
        month: current.cfMarketing,
        ytd: ytd.cfMarketing,
        percent: pct(current.cfMarketing, rb),
        percentYtd: pct(ytd.cfMarketing, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Infraestrutura',
        month: current.cfInfra,
        ytd: ytd.cfInfra,
        percent: pct(current.cfInfra, rb),
        percentYtd: pct(ytd.cfInfra, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Administrativo',
        month: current.cfAdmin,
        ytd: ytd.cfAdmin,
        percent: pct(current.cfAdmin, rb),
        percentYtd: pct(ytd.cfAdmin, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Pro-labore',
        month: current.cfProLabore,
        ytd: ytd.cfProLabore,
        percent: pct(current.cfProLabore, rb),
        percentYtd: pct(ytd.cfProLabore, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Impostos Fixos',
        month: current.cfImpostosFixos,
        ytd: ytd.cfImpostosFixos,
        percent: pct(current.cfImpostosFixos, rb),
        percentYtd: pct(ytd.cfImpostosFixos, rbYtd),
        type: 'sub',
        indent: true,
      },
      {
        label: 'Outros',
        month: current.cfOutro,
        ytd: ytd.cfOutro,
        percent: pct(current.cfOutro, rb),
        percentYtd: pct(ytd.cfOutro, rbYtd),
        type: 'sub',
        indent: true,
      },
      { label: '', month: 0, ytd: 0, percent: 0, percentYtd: 0, type: 'separator' },

      // RESULTADO OPERACIONAL
      {
        label: '(=) RESULTADO OPERACIONAL',
        month: current.resultadoOperacional,
        ytd: ytd.resultadoOperacional,
        percent: pct(current.resultadoOperacional, rb),
        percentYtd: pct(ytd.resultadoOperacional, rbYtd),
        type: 'subtotal',
      },
      { label: '', month: 0, ytd: 0, percent: 0, percentYtd: 0, type: 'separator' },

      // IMPOSTOS
      {
        label: '(-) IMPOSTOS',
        month: current.impostos,
        ytd: ytd.impostos,
        percent: pct(current.impostos, rb),
        percentYtd: pct(ytd.impostos, rbYtd),
        type: 'header',
      },
      { label: '', month: 0, ytd: 0, percent: 0, percentYtd: 0, type: 'separator' },

      // RESULTADO LIQUIDO
      {
        label: '(=) RESULTADO LÍQUIDO',
        month: current.resultadoLiquido,
        ytd: ytd.resultadoLiquido,
        percent: current.pctMargemLiquida,
        percentYtd: ytd.pctMargemLiquida,
        type: 'total',
      },
    ]
  }

  return {
    lines: isLoading ? [] : buildLines(),
    current,
    ytd,
    chartData: chartQuery.data ?? [],
    isLoading,
    isChartLoading: chartQuery.isLoading,
  }
}
