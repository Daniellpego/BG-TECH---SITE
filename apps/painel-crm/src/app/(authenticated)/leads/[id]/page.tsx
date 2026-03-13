'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MessageCircle, Phone, Mail, Users, FileText,
  RefreshCw, FileCheck, Settings, ExternalLink, Calendar,
  Trash2, Edit2, Loader2, Bot, Sparkles,
} from 'lucide-react'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/motion'
import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useLeadById,
  useLeadQuiz,
  useLeadActivities,
  useLeadDeals,
  useUpdateLead,
  useDeleteLead,
  useCreateActivity,
} from '@/hooks/use-leads'
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  ORIGENS_LABELS,
  ATIVIDADE_LABELS,
  RESPONSAVEIS,
  type LeadStatus,
  type LeadTemperatura,
  type AtividadeTipo,
} from '@/types/database'
import { useGroqAnalysis } from '@/hooks/use-groq'
import { useToast } from '@/components/toast-provider'
import { formatCurrency, formatDate, formatTimeAgo, formatWhatsAppUrl, formatPhone } from '@/lib/format'

const AI_PREFIX = '\u{1F916} Qualificação IA'

const ACTIVITY_ICONS: Record<string, typeof FileText> = {
  nota: FileText,
  ligacao: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  reuniao: Users,
  proposta_enviada: FileCheck,
  followup: RefreshCw,
  sistema: Settings,
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: lead, isLoading } = useLeadById(id)
  const { data: quiz } = useLeadQuiz(id)
  const { data: activities } = useLeadActivities(id)
  const { data: deals } = useLeadDeals(id)
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()
  const createActivity = useCreateActivity()

  const { analyze, isLoading: aiLoading, error: aiError } = useGroqAnalysis()
  const { addToast } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [activityType, setActivityType] = useState<AtividadeTipo>('nota')
  const [activityDesc, setActivityDesc] = useState('')
  const [aiResult, setAiResult] = useState<string | null>(null)

  const savedAiAnalysis = lead?.notas?.startsWith(AI_PREFIX) ? lead.notas : null

  async function handleQualifyAI() {
    if (!lead) return

    const context: Record<string, unknown> = {
      nome: lead.nome,
      empresa: lead.empresa,
      setor: lead.setor,
      origem: lead.origem,
      valor_estimado: lead.valor_estimado,
      temperatura: lead.temperatura,
      status: lead.status,
    }

    if (quiz) {
      context.score_automacao = quiz.score_automacao
      context.custo_invisivel_min = quiz.custo_invisivel_min
      context.custo_invisivel_max = quiz.custo_invisivel_max
      context.gargalos = quiz.gargalos
      context.horas_retrabalho = quiz.horas_retrabalho
      context.nivel_tecnologia = quiz.nivel_tecnologia
      context.urgencia = quiz.urgencia
      context.faturamento_faixa = quiz.faturamento_faixa
      context.resultado_tipo = quiz.resultado_tipo
    }

    const result = await analyze({
      prompt: 'Analise este lead e forneça a qualificação completa.',
      context,
      systemPrompt: 'Você é um consultor de vendas B2B especialista em automação para PMEs brasileiras. Analise este lead e responda em português de forma direta:\n1) Score de qualificação (1-10)\n2) Probabilidade de fechar (%)\n3) Melhor abordagem para o primeiro contato\n4) Objeções prováveis\n5) Valor sugerido para proposta',
    })

    if (result) {
      setAiResult(result)
      const notasContent = `${AI_PREFIX}\n${result}`
      await updateLead.mutateAsync({ id: lead.id, notas: notasContent })
      addToast('Qualificação IA salva com sucesso.', 'success')
    } else {
      addToast('Não foi possível qualificar. Verifique se a IA está configurada.', 'error')
    }
  }

  async function handleStatusChange(status: LeadStatus) {
    if (!lead) return
    await updateLead.mutateAsync({ id: lead.id, status })
    addToast(`Status atualizado para ${LEAD_STATUS_LABELS[status]}.`, 'info')
  }

  async function handleTemperaturaChange(temperatura: LeadTemperatura) {
    if (!lead) return
    await updateLead.mutateAsync({ id: lead.id, temperatura })
    addToast('Temperatura atualizada.', 'info')
  }

  async function handleDelete() {
    if (!lead) return
    await deleteLead.mutateAsync(lead.id)
    addToast('Lead excluído.', 'info')
    router.push('/leads')
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault()
    if (!activityDesc.trim() || !lead) return
    await createActivity.mutateAsync({
      lead_id: lead.id,
      tipo: activityType,
      descricao: activityDesc,
      autor: 'Bryan',
    })
    setActivityDesc('')
    addToast('Atividade registrada.', 'success')
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!lead) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <p className="text-text-secondary">Lead não encontrado</p>
          <Link href="/leads">
            <Button variant="ghost" className="mt-4">Voltar aos Leads</Button>
          </Link>
        </div>
      </PageTransition>
    )
  }

  const statusColor = LEAD_STATUS_COLORS[lead.status]

  return (
    <PageTransition>
      <PageTitle title="Detalhes do Lead" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/leads">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{lead.nome}</h1>
              <p className="text-sm text-text-secondary">{lead.empresa ?? 'Sem empresa'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQualifyAI}
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4 text-brand-cyan" />}
              Qualificar com IA
            </Button>
            {lead.whatsapp && (
              <a href={formatWhatsAppUrl(lead.whatsapp, lead.nome)} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 text-status-positive" />
                  WhatsApp
                </Button>
              </a>
            )}
            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 text-status-negative" />
            </Button>
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* Info Card */}
            <StaggerItem>
              <div className="card-glass">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Informações</h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Status">
                    <Select value={lead.status} onValueChange={(v) => handleStatusChange(v as LeadStatus)}>
                      <SelectTrigger className="h-8 w-40">
                        <span style={{ color: statusColor }} className="font-semibold text-sm">
                          {LEAD_STATUS_LABELS[lead.status]}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(LEAD_STATUS_LABELS) as Array<[LeadStatus, string]>).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InfoRow>
                  <InfoRow label="Temperatura">
                    <Select value={lead.temperatura} onValueChange={(v) => handleTemperaturaChange(v as LeadTemperatura)}>
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frio">Frio</SelectItem>
                        <SelectItem value="morno">Morno</SelectItem>
                        <SelectItem value="quente">Quente</SelectItem>
                      </SelectContent>
                    </Select>
                  </InfoRow>
                  <InfoRow label="Origem">
                    <span className="text-sm text-text-primary">{ORIGENS_LABELS[lead.origem] ?? lead.origem}</span>
                  </InfoRow>
                  <InfoRow label="Valor Estimado">
                    <span className="text-sm font-medium text-brand-cyan">
                      {lead.valor_estimado > 0 ? formatCurrency(lead.valor_estimado) : '-'}
                    </span>
                  </InfoRow>
                  <InfoRow label="Responsável">
                    <span className="text-sm text-text-primary">{lead.responsavel}</span>
                  </InfoRow>
                  <InfoRow label="Criado em">
                    <span className="text-sm text-text-secondary">{formatDate(lead.created_at)}</span>
                  </InfoRow>
                  {lead.whatsapp && (
                    <InfoRow label="WhatsApp">
                      <a
                        href={formatWhatsAppUrl(lead.whatsapp, lead.nome)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-cyan hover:underline flex items-center gap-1"
                      >
                        {formatPhone(lead.whatsapp)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </InfoRow>
                  )}
                  {lead.email && (
                    <InfoRow label="Email">
                      <span className="text-sm text-text-primary">{lead.email}</span>
                    </InfoRow>
                  )}
                  {lead.setor && (
                    <InfoRow label="Setor">
                      <span className="text-sm text-text-primary">{lead.setor}</span>
                    </InfoRow>
                  )}
                  {lead.proximo_followup && (
                    <InfoRow label="Próximo Follow-up">
                      <span className="text-sm text-status-warning flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(lead.proximo_followup)}
                      </span>
                    </InfoRow>
                  )}
                </div>
                {lead.notas && !lead.notas.startsWith(AI_PREFIX) && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Notas</p>
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{lead.notas}</p>
                    </div>
                  </>
                )}
              </div>
            </StaggerItem>

            {/* Quiz Data */}
            {quiz && (
              <StaggerItem>
                <div className="card-glass">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Dados do Quiz</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {quiz.setor && <InfoRow label="Setor">{quiz.setor}</InfoRow>}
                    {quiz.faturamento_faixa && <InfoRow label="Faturamento">{quiz.faturamento_faixa}</InfoRow>}
                    {quiz.horas_retrabalho && <InfoRow label="Horas Retrabalho">{quiz.horas_retrabalho}</InfoRow>}
                    {quiz.nivel_tecnologia && <InfoRow label="Nível Tecnologia">{quiz.nivel_tecnologia}</InfoRow>}
                    {quiz.urgencia && <InfoRow label="Urgência">{quiz.urgencia}</InfoRow>}
                    {quiz.score_automacao != null && (
                      <InfoRow label="Score Automação">
                        <span className="text-lg font-bold text-brand-cyan">{quiz.score_automacao}%</span>
                      </InfoRow>
                    )}
                    {(quiz.custo_invisivel_min != null && quiz.custo_invisivel_max != null) && (
                      <InfoRow label="Custo Invisível">
                        <span className="text-sm text-status-warning">
                          {formatCurrency(quiz.custo_invisivel_min)} - {formatCurrency(quiz.custo_invisivel_max)}
                        </span>
                      </InfoRow>
                    )}
                  </div>
                  {quiz.gargalos && quiz.gargalos.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-xs text-text-secondary mb-2">Gargalos</p>
                        <div className="flex flex-wrap gap-1.5">
                          {quiz.gargalos.map((g: string, i: number) => (
                            <span key={i} className="badge-purple">{g}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </StaggerItem>
            )}

            {/* AI Analysis */}
            {(aiResult || savedAiAnalysis || aiError) && (
              <StaggerItem>
                <div
                  className="rounded-xl border p-5"
                  style={{ background: '#0F1D32', borderColor: 'rgba(0, 200, 240, 0.3)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-brand-cyan" />
                      <h2 className="text-lg font-semibold text-text-primary">Análise IA</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleQualifyAI}
                      disabled={aiLoading}
                      className="text-xs text-text-secondary hover:text-brand-cyan"
                    >
                      {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Atualizar análise
                    </Button>
                  </div>
                  {aiError && (
                    <p className="text-sm text-status-negative">{aiError}</p>
                  )}
                  {(aiResult || savedAiAnalysis) && (
                    <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                      {(aiResult || savedAiAnalysis || '').replace(AI_PREFIX + '\n', '')}
                    </div>
                  )}
                </div>
              </StaggerItem>
            )}

            {/* Deals */}
            {deals && deals.length > 0 && (
              <StaggerItem>
                <div className="card-glass">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Deals</h2>
                  <div className="space-y-3">
                    {deals.map((deal) => (
                      <Link key={deal.id} href={`/deals/${deal.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-bg-navy/50 hover:bg-bg-navy transition-colors">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{deal.titulo}</p>
                            <p className="text-xs text-text-secondary">
                              {deal.status === 'ganho' ? '✅ Ganho' : deal.status === 'perdido' ? '❌ Perdido' : '🔵 Aberto'}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-brand-cyan">
                            {formatCurrency(deal.valor)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            )}
          </div>

          {/* Right Column - Activity Timeline */}
          <div className="lg:col-span-2">
            <StaggerItem>
              <div className="card-glass">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Timeline</h2>

                {/* Add Activity Form */}
                <form onSubmit={handleAddActivity} className="mb-4 space-y-3">
                  <div className="flex gap-2">
                    <Select value={activityType} onValueChange={(v) => setActivityType(v as AtividadeTipo)}>
                      <SelectTrigger className="w-32 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(ATIVIDADE_LABELS) as Array<[AtividadeTipo, string]>)
                          .filter(([k]) => k !== 'sistema')
                          .map(([val, label]) => (
                            <SelectItem key={val} value={val}>{label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Descreva a atividade..."
                      value={activityDesc}
                      onChange={(e) => setActivityDesc(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    disabled={!activityDesc.trim() || createActivity.isPending}
                  >
                    {createActivity.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    Registrar Atividade
                  </Button>
                </form>

                <Separator className="mb-4" />

                {/* Activity List */}
                {!activities || activities.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-6">
                    Nenhuma atividade registrada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => {
                      const Icon = ACTIVITY_ICONS[activity.tipo] ?? FileText
                      return (
                        <div key={activity.id} className="flex gap-3">
                          <div className="p-1.5 rounded-md bg-brand-blue-deep/30 h-fit">
                            <Icon className="h-3.5 w-3.5 text-brand-cyan" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-text-primary">
                                {ATIVIDADE_LABELS[activity.tipo as AtividadeTipo] ?? activity.tipo}
                              </span>
                              <span className="text-xs text-text-dark">
                                {formatTimeAgo(activity.data)}
                              </span>
                            </div>
                            <p className="text-sm text-text-secondary mt-0.5">{activity.descricao}</p>
                            <p className="text-xs text-text-dark mt-0.5">por {activity.autor}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-secondary">
            Tem certeza que deseja excluir <strong className="text-text-primary">{lead.nome}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => setDeleteConfirm(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLead.isPending}
            >
              {deleteLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-text-secondary mb-0.5">{label}</p>
      <div>{children}</div>
    </div>
  )
}
