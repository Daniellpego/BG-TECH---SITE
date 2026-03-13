'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Presentation,
  Download,
  Printer,
  CalendarRange,
  Loader2,
  TrendingUp,
  Wallet,
  Receipt,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/motion'
import { usePeriod } from '@/providers/period-provider'
import { useDRE } from '@/hooks/use-dre'
import { useBalanco } from '@/hooks/use-balanco'
import { useReceitas } from '@/hooks/use-receitas'
import { useCustosFixos } from '@/hooks/use-custos-fixos'
import { useGastosVariaveis } from '@/hooks/use-gastos-variaveis'
import { useDashboard } from '@/hooks/use-dashboard'
import { generateCSV, downloadCSV } from '@/lib/export-csv'
import {
  openPrintWindow,
  buildDREReportHTML,
  buildBalancoReportHTML,
  buildMonthlyReportHTML,
} from '@/lib/export-print'
import { formatCurrency } from '@/lib/format'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function RelatoriosPage() {
  const { month, year } = usePeriod()
  useEffect(() => { document.title = 'Relatórios | BG Tech CFO' }, [])

  const dre = useDRE()
  const balanco = useBalanco()
  const { data: receitas, isLoading: loadingReceitas } = useReceitas()
  const { data: custosFixos, isLoading: loadingCustos } = useCustosFixos()
  const { data: gastosVariaveis, isLoading: loadingGastos } = useGastosVariaveis()

  // Dashboard data for monthly report
  const dashboard = useDashboard()

  const [exporting, setExporting] = useState<string | null>(null)

  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`

  // === PDF Exports ===
  function handleDREPdf() {
    if (dre.isLoading || dre.lines.length === 0) return
    setExporting('dre-pdf')
    const html = buildDREReportHTML(dre.lines, month, year)
    openPrintWindow(html)
    setTimeout(() => setExporting(null), 1000)
  }

  function handleBalancoPdf() {
    if (balanco.isLoading) return
    setExporting('balanco-pdf')
    const html = buildBalancoReportHTML(balanco.meses, year)
    openPrintWindow(html)
    setTimeout(() => setExporting(null), 1000)
  }

  function handleMonthlyReport() {
    if (dre.isLoading || dashboard.isLoading) return
    setExporting('monthly')
    const html = buildMonthlyReportHTML({
      receitaBruta: dre.current.receitaBruta,
      mrr: dashboard.kpis.mrr,
      resultadoLiquido: dre.current.resultadoLiquido,
      margemLiquida: dre.current.pctMargemLiquida,
      burnRate: dashboard.kpis.burnRate,
      runway: dashboard.kpis.runway,
      caixa: dashboard.kpis.caixaDisponivel,
      dreLines: dre.lines,
    }, month, year)
    openPrintWindow(html)
    setTimeout(() => setExporting(null), 1000)
  }

  // === CSV Exports ===
  function handleReceitasCsv() {
    if (!receitas?.length) return
    setExporting('receitas-csv')
    const headers = ['Data', 'Cliente', 'Tipo', 'Valor Bruto', 'Taxas', 'Valor Líquido', 'Recorrente', 'Status', 'Categoria', 'Observações']
    const rows = receitas.map(r => [
      r.data, r.cliente, r.tipo,
      Number(r.valor_bruto).toFixed(2),
      Number(r.taxas ?? 0).toFixed(2),
      Number(r.valor_liquido ?? 0).toFixed(2),
      r.recorrente ? 'Sim' : 'Não',
      r.status, r.categoria ?? '', r.observacoes ?? '',
    ])
    const csv = generateCSV(headers, rows)
    const monthStr = String(month).padStart(2, '0')
    downloadCSV(`receitas-${monthStr}-${year}.csv`, csv)
    setTimeout(() => setExporting(null), 500)
  }

  function handleCustosFixosCsv() {
    if (!custosFixos?.length) return
    setExporting('custos-csv')
    const headers = ['Nome', 'Categoria', 'Valor Mensal', 'Recorrência', 'Status', 'Obrigatório', 'Data Início', 'Dia Vencimento', 'Observações']
    const rows = custosFixos.map(c => [
      c.nome, c.categoria,
      Number(c.valor_mensal).toFixed(2),
      c.recorrencia, c.status,
      c.obrigatorio ? 'Sim' : 'Não',
      c.data_inicio, c.dia_vencimento ?? '', c.observacoes ?? '',
    ])
    const csv = generateCSV(headers, rows)
    downloadCSV(`custos-fixos-${year}.csv`, csv)
    setTimeout(() => setExporting(null), 500)
  }

  function handleGastosVariaveisCsv() {
    if (!gastosVariaveis?.length) return
    setExporting('gastos-csv')
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Cliente', 'Observações']
    const rows = gastosVariaveis.map(g => [
      g.data, g.descricao, g.categoria, g.tipo,
      Number(g.valor).toFixed(2),
      g.status, g.cliente ?? '', g.observacoes ?? '',
    ])
    const csv = generateCSV(headers, rows)
    const monthStr = String(month).padStart(2, '0')
    downloadCSV(`gastos-variaveis-${monthStr}-${year}.csv`, csv)
    setTimeout(() => setExporting(null), 500)
  }

  function ExportButton({
    id, icon: Icon, label, onClick, disabled,
  }: {
    id: string
    icon: React.ElementType
    label: string
    onClick: () => void
    disabled: boolean
  }) {
    const isExporting = exporting === id
    return (
      <Button
        variant="ghost"
        onClick={onClick}
        disabled={disabled || isExporting}
        className="w-full justify-start gap-3 h-11 text-text-secondary hover:text-text-primary hover:bg-brand-blue-deep/20"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          <Icon className="h-4 w-4 shrink-0" />
        )}
        <span className="text-sm">{label}</span>
      </Button>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileBarChart className="h-6 w-6 text-brand-cyan" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Relatórios & Exportações</h1>
            <p className="text-sm text-text-secondary">Período: {periodLabel}</p>
          </div>
        </div>

        {/* Grid 2x2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 1. Exportar PDF */}
          <div className="card-glass space-y-4">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-brand-cyan" />
              <h2 className="text-base font-semibold text-text-primary">Exportar PDF</h2>
            </div>
            <p className="text-xs text-text-secondary">
              Gera relatórios formatados com a marca BG Tech. Use "Salvar como PDF" no diálogo de impressão.
            </p>
            <div className="space-y-1">
              <ExportButton
                id="dre-pdf"
                icon={FileText}
                label="DRE — Demonstrativo de Resultado"
                onClick={handleDREPdf}
                disabled={dre.isLoading}
              />
              <ExportButton
                id="balanco-pdf"
                icon={CalendarRange}
                label={`Balanço Anual ${year}`}
                onClick={handleBalancoPdf}
                disabled={balanco.isLoading}
              />
            </div>
          </div>

          {/* 2. Exportar CSV */}
          <div className="card-glass space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-status-positive" />
              <h2 className="text-base font-semibold text-text-primary">Exportar Dados (CSV)</h2>
            </div>
            <p className="text-xs text-text-secondary">
              Baixa planilhas compatíveis com Excel e Google Sheets. Dados do período selecionado.
            </p>
            <div className="space-y-1">
              <ExportButton
                id="receitas-csv"
                icon={TrendingUp}
                label={`Receitas — ${periodLabel}`}
                onClick={handleReceitasCsv}
                disabled={loadingReceitas}
              />
              <ExportButton
                id="custos-csv"
                icon={Wallet}
                label="Custos Fixos — Todos"
                onClick={handleCustosFixosCsv}
                disabled={loadingCustos}
              />
              <ExportButton
                id="gastos-csv"
                icon={Receipt}
                label={`Gastos Variáveis — ${periodLabel}`}
                onClick={handleGastosVariaveisCsv}
                disabled={loadingGastos}
              />
            </div>
          </div>

          {/* 3. Relatório Mensal */}
          <div className="card-glass space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-status-warning" />
              <h2 className="text-base font-semibold text-text-primary">Relatório Mensal</h2>
            </div>
            <p className="text-xs text-text-secondary">
              Resumo executivo completo do mês: KPIs principais, DRE resumida, burn rate e runway.
              Ideal para enviar ao contador ou apresentar aos sócios.
            </p>
            <div className="pt-2">
              <Button
                onClick={handleMonthlyReport}
                disabled={dre.isLoading || dashboard.isLoading}
                className="w-full gap-2"
              >
                {exporting === 'monthly' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Gerar Relatório de {MONTH_NAMES[month - 1]}
              </Button>
            </div>

            {/* Quick preview */}
            {!dashboard.isLoading && !dre.isLoading && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-blue-deep/20">
                <div>
                  <p className="text-[10px] text-text-secondary">Receita Bruta</p>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(dre.current.receitaBruta)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-secondary">Resultado Líquido</p>
                  <p className={`text-sm font-semibold ${dre.current.resultadoLiquido >= 0 ? 'text-status-positive' : 'text-status-negative'}`}>
                    {formatCurrency(dre.current.resultadoLiquido)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Modo Apresentação */}
          <div className="card-glass space-y-4">
            <div className="flex items-center gap-2">
              <Presentation className="h-5 w-5 text-brand-cyan" />
              <h2 className="text-base font-semibold text-text-primary">Modo Apresentação</h2>
            </div>
            <p className="text-xs text-text-secondary">
              Visualização em tela cheia otimizada para projetor. Mostra os KPIs principais com
              fontes grandes e layout limpo. Perfeito para reuniões com sócios e investidores.
            </p>
            <div className="pt-2">
              <Link href="/apresentacao">
                <Button className="w-full gap-2" variant="secondary">
                  <Presentation className="h-4 w-4" />
                  Iniciar Apresentação
                </Button>
              </Link>
            </div>
            <p className="text-[10px] text-text-dark">
              Pressione ESC ou clique no X para sair do modo apresentação.
            </p>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}
