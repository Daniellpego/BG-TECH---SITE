'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart as LineChartIcon,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useProjecoes, useCreateProjecao, useUpdateProjecao, useDeleteProjecao, type ProjecaoCalculada, type ProjecaoMes } from '@/hooks/use-projecoes'
import { useTax } from '@/providers/tax-provider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion'
import type { Projecao } from '@/types/database'

const SCENARIO_CONFIG: Record<string, { emoji: string; color: string; chartColor: string }> = {
  Conservador: { emoji: '\uD83D\uDFE2', color: 'text-status-positive', chartColor: '#10B981' },
  Realista: { emoji: '\uD83D\uDFE1', color: 'text-status-warning', chartColor: '#F59E0B' },
  Agressivo: { emoji: '\uD83D\uDD35', color: 'text-brand-cyan', chartColor: '#00C8F0' },
}

const DEFAULT_CONFIG = { emoji: '\uD83D\uDFE1', color: 'text-status-warning', chartColor: '#F59E0B' }

function getScenarioConfig(nome: string): { emoji: string; color: string; chartColor: string } {
  if (nome.toLowerCase().includes('conservador')) return SCENARIO_CONFIG['Conservador'] ?? DEFAULT_CONFIG
  if (nome.toLowerCase().includes('realista')) return SCENARIO_CONFIG['Realista'] ?? DEFAULT_CONFIG
  if (nome.toLowerCase().includes('agressivo')) return SCENARIO_CONFIG['Agressivo'] ?? DEFAULT_CONFIG
  return DEFAULT_CONFIG
}

const QUARTERS = [
  { label: 'Q1', meses: [1, 2, 3] },
  { label: 'Q2', meses: [4, 5, 6] },
  { label: 'Q3', meses: [7, 8, 9] },
  { label: 'Q4', meses: [10, 11, 12] },
]

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
  isLoading: boolean
}) {
  return (
    <div className="card-glass">
      {isLoading ? (
        <>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-7 w-28" />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <Icon className={cn('h-4 w-4', color)} />
            <span className="text-xs text-text-secondary">{label}</span>
          </div>
          <p className={cn('text-lg font-bold', color)}>{value}</p>
          {sub && <p className="text-[10px] text-text-dark mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  )
}

interface MesAjustado extends ProjecaoMes {
  imposto: number
}

function QuarterlyBreakdown({ meses, showImposto }: { meses: MesAjustado[]; showImposto: boolean }) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {QUARTERS.map((q, qi) => {
        const qMeses = meses.filter((m) => q.meses.includes(m.mes))
        const qReceita = qMeses.reduce((s, m) => s + m.receita, 0)
        const qResultado = qMeses.reduce((s, m) => s + m.resultado, 0)
        const qCaixa = qMeses[qMeses.length - 1]?.caixaAcumulado ?? 0
        const isExpanded = expandedQ === qi

        return (
          <div key={q.label} className="card-glass">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setExpandedQ(isExpanded ? null : qi)}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-brand-cyan">{q.label}</span>
                <span className="text-xs text-text-secondary">
                  Receita: <span className="text-status-positive font-medium">{formatCurrency(qReceita)}</span>
                </span>
                <span className="text-xs text-text-secondary">
                  Resultado: <span className={cn('font-medium', qResultado >= 0 ? 'text-status-positive' : 'text-status-negative')}>{formatCurrency(qResultado)}</span>
                </span>
                <span className="text-xs text-text-secondary hidden sm:inline">
                  Caixa: <span className={cn('font-medium', qCaixa >= 0 ? 'text-status-positive' : 'text-status-negative')}>{formatCurrency(qCaixa)}</span>
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-text-secondary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-secondary" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-3">
                {qMeses.map((m) => (
                  <div
                    key={m.mes}
                    className={cn(
                      'grid gap-2 p-3 rounded-lg bg-bg-navy/50 border border-brand-blue-deep/10',
                      showImposto ? 'grid-cols-2 sm:grid-cols-7' : 'grid-cols-2 sm:grid-cols-6'
                    )}
                  >
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">Mês</span>
                      <p className="text-sm font-semibold text-text-primary">{m.label}</p>
                      <span className="text-[10px] text-text-dark">{m.clientesNovos} novos · {m.clientesAtivos} ativos</span>
                      <p className="text-[10px] text-text-dark">Mensalidade: {formatCurrency(m.mensalidadeMes)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">Setup</span>
                      <p className="text-sm font-medium text-brand-cyan">{formatCurrency(m.receitaSetup)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">MRR</span>
                      <p className="text-sm font-medium text-status-positive">{formatCurrency(m.receitaMRR)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">Custos Fixos</span>
                      <p className="text-sm font-medium text-status-negative">{formatCurrency(m.custosFixos)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">Custos Var.</span>
                      <p className="text-sm font-medium text-status-negative">{formatCurrency(m.custosVariaveis)}</p>
                    </div>
                    {showImposto && (
                      <div>
                        <span className="text-[10px] text-status-warning uppercase">Simples 6%</span>
                        <p className="text-sm font-medium text-status-warning">{formatCurrency(m.imposto)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-text-dark uppercase">Resultado</span>
                      <p className={cn('text-sm font-bold', m.resultado >= 0 ? 'text-status-positive' : 'text-status-negative')}>
                        {formatCurrency(m.resultado)}
                      </p>
                      <span className="text-[10px] text-text-dark uppercase">Caixa</span>
                      <p className={cn('text-sm font-bold', m.caixaAcumulado >= 0 ? 'text-brand-cyan' : 'text-status-negative')}>
                        {formatCurrency(m.caixaAcumulado)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ProjecaoCharts({ proj, mesesAjustados }: { proj: ProjecaoCalculada; mesesAjustados: MesAjustado[] }) {
  const config = getScenarioConfig(proj.cenario.nome)

  const chartData = mesesAjustados.map((m) => ({
    name: m.label,
    setup: Math.round(m.receitaSetup),
    mrr: Math.round(m.receitaMRR),
    receita: Math.round(m.receita),
    custos: Math.round(m.custosFixos + m.custosVariaveis + m.imposto),
    caixa: Math.round(m.caixaAcumulado),
    resultado: Math.round(m.resultado),
  }))

  return (
    <div className="space-y-6">
      {/* Receita Setup + MRR vs Custos */}
      <div className="card-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Receita Projetada vs Custos</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F1D32',
                  border: '1px solid #153B5F',
                  borderRadius: '8px',
                  color: '#F0F4F8',
                  fontSize: '12px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                name="MRR (Mensalidades)"
                stroke="#10B981"
                fill="#10B98130"
                strokeWidth={2}
                stackId="receita"
              />
              <Area
                type="monotone"
                dataKey="setup"
                name="Setup"
                stroke="#00C8F0"
                fill="#00C8F030"
                strokeWidth={2}
                stackId="receita"
              />
              <Line
                type="monotone"
                dataKey="custos"
                name="Custos"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Caixa Acumulado */}
      <div className="card-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Caixa Acumulado (12 meses)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#153B5F" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F1D32',
                  border: '1px solid #153B5F',
                  borderRadius: '8px',
                  color: '#F0F4F8',
                  fontSize: '12px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <ReferenceLine y={0} stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" />
              <defs>
                <linearGradient id="caixaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={config.chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="caixa"
                name="Caixa"
                stroke={config.chartColor}
                strokeWidth={2}
                fill="url(#caixaGradient)"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function ScenarioContent({
  proj,
  isLoading,
  onEdit,
  onDelete,
}: {
  proj: ProjecaoCalculada
  isLoading: boolean
  onEdit: (cenario: Projecao) => void
  onDelete: (cenario: Projecao) => void
}) {
  const config = getScenarioConfig(proj.cenario.nome)
  const { simplesEnabled, aliquota } = useTax()

  // Compute per-month adjusted data with Simples Nacional tax
  const mesesAjustados: MesAjustado[] = useMemo(() => {
    const taxRate = simplesEnabled ? aliquota / 100 : 0
    const firstMes = proj.meses[0]
    let caixaAcum = firstMes
      ? firstMes.caixaAcumulado - firstMes.resultado
      : 0

    return proj.meses.map((m) => {
      const imposto = m.receita * taxRate
      const resultado = m.resultado - imposto
      caixaAcum += resultado
      return { ...m, imposto, resultado, caixaAcumulado: caixaAcum }
    })
  }, [proj.meses, simplesEnabled, aliquota])

  const lucroAjustado = mesesAjustados.reduce((s, m) => s + m.resultado, 0)

  // Recalculate break-even with tax
  const mesBreakEvenAjustado = useMemo(() => {
    const idx = mesesAjustados.findIndex((m) => m.resultado >= 0)
    return idx >= 0 ? mesesAjustados[idx]!.label : 'N/A'
  }, [mesesAjustados])

  const kpis = [
    { label: 'Receita total 12m', value: formatCurrency(proj.receita12m), sub: `Setup: ${formatCurrency(proj.receitaSetup12m)}`, icon: DollarSign, color: 'text-status-positive' },
    { label: 'MRR projetado 12m', value: formatCurrency(proj.mrr12m), sub: 'Apenas mensalidades', icon: TrendingUp, color: 'text-brand-cyan' },
    { label: 'Clientes ativos 12m', value: String(proj.clientesAtivos12m), icon: Users, color: 'text-brand-cyan' },
    { label: 'Lucro acumulado', value: formatCurrency(lucroAjustado), sub: simplesEnabled ? `(-${aliquota}% Simples mês a mês)` : undefined, icon: BarChart3, color: lucroAjustado >= 0 ? 'text-status-positive' : 'text-status-negative' },
    { label: 'Mês break-even', value: simplesEnabled ? mesBreakEvenAjustado : proj.mesBreakEven, icon: Target, color: config.color },
    { label: 'Runway atual', value: proj.runwayAtual >= 99 ? 'Positivo' : `${proj.runwayAtual} meses`, icon: Clock, color: proj.runwayAtual >= 6 ? 'text-status-positive' : 'text-status-negative' },
  ]

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">
            Setup: <span className="text-brand-cyan font-medium">{formatCurrency(Number(proj.cenario.setup_por_cliente ?? 0))}</span>
            {' · '}Mensalidade: <span className="text-status-positive font-medium">{formatCurrency(Number(proj.cenario.ticket_medio))}</span>
            {' · '}{proj.cenario.novos_clientes_mes} clientes/mês
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(proj.cenario)} className="text-text-secondary hover:text-brand-cyan">
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(proj.cenario)} className="text-text-secondary hover:text-status-negative">
            <Trash2 className="h-4 w-4 mr-1" /> Excluir
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            sub={kpi.sub}
            icon={kpi.icon}
            color={kpi.color}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Quarterly Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Detalhamento trimestral</h2>
        <QuarterlyBreakdown meses={mesesAjustados} showImposto={simplesEnabled} />
      </div>

      {/* Charts */}
      <ProjecaoCharts proj={proj} mesesAjustados={mesesAjustados} />
    </div>
  )
}

function ProjecaoForm({
  open,
  onClose,
  editingCenario,
}: {
  open: boolean
  onClose: () => void
  editingCenario?: Projecao | null
}) {
  const createProjecao = useCreateProjecao()
  const updateProjecao = useUpdateProjecao()
  const isEditing = !!editingCenario

  const [nome, setNome] = useState('Realista')
  const [taxaCrescimento, setTaxaCrescimento] = useState('5')
  const [novosClientes, setNovosClientes] = useState('2')
  const [mensalidade, setMensalidade] = useState('500')
  const [setupCliente, setSetupCliente] = useState('1100')
  const [custoVariavel, setCustoVariavel] = useState('20')

  // Populate form when editing
  useEffect(() => {
    if (editingCenario) {
      setNome(editingCenario.nome)
      setTaxaCrescimento(String(editingCenario.taxa_crescimento_mensal))
      setNovosClientes(String(editingCenario.novos_clientes_mes))
      setMensalidade(String(editingCenario.ticket_medio))
      setSetupCliente(String(editingCenario.setup_por_cliente ?? 0))
      setCustoVariavel(String(editingCenario.custo_variavel_percentual))
    } else {
      setNome('Realista')
      setTaxaCrescimento('5')
      setNovosClientes('2')
      setMensalidade('500')
      setSetupCliente('1100')
      setCustoVariavel('20')
    }
  }, [editingCenario])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      nome,
      taxa_crescimento_mensal: Number(taxaCrescimento),
      novos_clientes_mes: Number(novosClientes),
      ticket_medio: Number(mensalidade),
      setup_por_cliente: Number(setupCliente),
      custo_variavel_percentual: Number(custoVariavel),
      meses_projecao: 12,
    }

    if (isEditing) {
      await updateProjecao.mutateAsync({ id: editingCenario.id, ...data })
    } else {
      await createProjecao.mutateAsync(data)
    }
    onClose()
  }

  const isPending = createProjecao.isPending || updateProjecao.isPending

  if (!open) return null

  const inputClass = "flex h-10 w-full rounded-[10px] bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-cyan/50"
  const inputStyle = { border: '1.5px solid #153B5F' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative card-glass p-6 w-full max-w-md space-y-4 mx-4">
        <h2 className="text-lg font-bold text-text-primary">
          {isEditing ? 'Editar Projeção' : 'Nova Projeção'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Cenário</label>
            <select
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="Conservador">Conservador</option>
              <option value="Realista">Realista</option>
              <option value="Agressivo">Agressivo</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Taxa de crescimento mensal (%)</label>
            <input type="number" step="0.1" value={taxaCrescimento} onChange={(e) => setTaxaCrescimento(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Novos clientes por mês</label>
            <input type="number" value={novosClientes} onChange={(e) => setNovosClientes(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Setup por cliente (R$)</label>
              <input type="number" step="0.01" value={setupCliente} onChange={(e) => setSetupCliente(e.target.value)} className={inputClass} style={inputStyle} />
              <span className="text-[10px] text-text-dark mt-0.5 block">Cobrado 1x no fechamento</span>
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Mensalidade por cliente (R$)</label>
              <input type="number" step="0.01" value={mensalidade} onChange={(e) => setMensalidade(e.target.value)} className={inputClass} style={inputStyle} />
              <span className="text-[10px] text-text-dark mt-0.5 block">Começa no mês seguinte</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Custo variável (% da receita)</label>
            <input type="number" step="0.1" value={custoVariavel} onChange={(e) => setCustoVariavel(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Projeção')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({
  cenario,
  onConfirm,
  onCancel,
  isPending,
}: {
  cenario: Projecao
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative card-glass p-6 w-full max-w-sm space-y-4 mx-4">
        <h2 className="text-lg font-bold text-text-primary">Excluir projeção</h2>
        <p className="text-sm text-text-secondary">
          Tem certeza que deseja excluir a projeção <span className="font-semibold text-text-primary">&quot;{cenario.nome}&quot;</span>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending} className="flex-1">
            {isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProjecoesPage() {
  useEffect(() => { document.title = 'Projeções | BG Tech CFO' }, [])

  const { projecoes, isLoading } = useProjecoes()
  const deleteProjecao = useDeleteProjecao()
  const [formOpen, setFormOpen] = useState(false)
  const [editingCenario, setEditingCenario] = useState<Projecao | null>(null)
  const [deletingCenario, setDeletingCenario] = useState<Projecao | null>(null)
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined)

  // Set default tab
  const defaultTab = projecoes.find((p) =>
    p.cenario.nome.toLowerCase().includes('realista')
  )?.cenario.id ?? projecoes[0]?.cenario.id ?? 'loading'

  function handleEdit(cenario: Projecao) {
    setEditingCenario(cenario)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingCenario(null)
  }

  async function handleConfirmDelete() {
    if (!deletingCenario) return
    await deleteProjecao.mutateAsync(deletingCenario.id)
    setDeletingCenario(null)
    // If we deleted the active tab, reset
    if (activeTab === deletingCenario.id) {
      setActiveTab(undefined)
    }
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LineChartIcon className="h-6 w-6 text-brand-cyan" />
          <h1 className="text-2xl font-bold text-text-primary">Projeções</h1>
        </div>
        {projecoes.length > 0 && (
          <Button onClick={() => { setEditingCenario(null); setFormOpen(true) }} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Nova Projeção
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-glass space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : projecoes.length === 0 ? (
        <div className="card-glass flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-5xl">📊</span>
          <h2 className="text-lg font-semibold text-text-primary">Nenhuma projeção criada ainda</h2>
          <p className="text-sm text-text-secondary text-center max-w-md">
            Crie cenários financeiros para simular o futuro da BG Tech.
            Separe receita de Setup (única) e Mensalidade (recorrente).
          </p>
          <Button onClick={() => setFormOpen(true)} className="mt-2">
            <Plus className="h-4 w-4 mr-2" /> Criar Projeção
          </Button>
        </div>
      ) : (
        <Tabs value={activeTab ?? defaultTab} onValueChange={setActiveTab}>
          <TabsList>
            {projecoes.map((p) => {
              const config = getScenarioConfig(p.cenario.nome)
              return (
                <TabsTrigger key={p.cenario.id} value={p.cenario.id}>
                  <span className="mr-1.5">{config.emoji}</span>
                  {p.cenario.nome}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {projecoes.map((p) => (
            <TabsContent key={p.cenario.id} value={p.cenario.id}>
              <ScenarioContent
                proj={p}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={setDeletingCenario}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>

    <ProjecaoForm
      open={formOpen}
      onClose={handleCloseForm}
      editingCenario={editingCenario}
    />

    {deletingCenario && (
      <DeleteConfirmModal
        cenario={deletingCenario}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCenario(null)}
        isPending={deleteProjecao.isPending}
      />
    )}
    </PageTransition>
  )
}
