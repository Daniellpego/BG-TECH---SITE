'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateCustoFixo, useUpdateCustoFixo, type CustoFixoInsert } from '@/hooks/use-custos-fixos'
import type { CustoFixo, CustoFixoCategoria, CustoFixoRecorrencia, CustoFixoStatus } from '@/types/database'

const custoFixoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.enum(['ferramentas', 'contabilidade', 'marketing', 'infraestrutura', 'administrativo', 'pro_labore', 'impostos_fixos', 'outro'] as const),
  valor_mensal: z.number().min(0, 'Valor deve ser positivo'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  dia_vencimento: z.number().min(1).max(31).nullable(),
  recorrencia: z.enum(['mensal', 'trimestral', 'anual', 'outro'] as const),
  obrigatorio: z.boolean(),
  status: z.enum(['ativo', 'suspenso', 'cancelado'] as const),
  observacoes: z.string().nullable().optional(),
})

const CATEGORIA_LABELS: Record<CustoFixoCategoria, string> = {
  ferramentas: 'Ferramentas',
  contabilidade: 'Contabilidade',
  marketing: 'Marketing',
  infraestrutura: 'Infraestrutura',
  administrativo: 'Administrativo',
  pro_labore: 'Pró-labore',
  impostos_fixos: 'Impostos Fixos',
  outro: 'Outro',
}

const RECORRENCIA_LABELS: Record<CustoFixoRecorrencia, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
  outro: 'Outro',
}

const STATUS_LABELS: Record<CustoFixoStatus, string> = {
  ativo: 'Ativo',
  suspenso: 'Suspenso',
  cancelado: 'Cancelado',
}

interface CustoFixoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  custoFixo?: CustoFixo | null
}

export function CustoFixoForm({ open, onOpenChange, custoFixo }: CustoFixoFormProps) {
  const createMutation = useCreateCustoFixo()
  const updateMutation = useUpdateCustoFixo()
  const isEditing = !!custoFixo

  const [form, setForm] = useState({
    nome: '',
    categoria: 'ferramentas' as CustoFixoCategoria,
    valor_mensal: '',
    data_inicio: '',
    dia_vencimento: '',
    recorrencia: 'mensal' as CustoFixoRecorrencia,
    obrigatorio: false,
    status: 'ativo' as CustoFixoStatus,
    observacoes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (custoFixo) {
      setForm({
        nome: custoFixo.nome,
        categoria: custoFixo.categoria,
        valor_mensal: String(custoFixo.valor_mensal),
        data_inicio: custoFixo.data_inicio,
        dia_vencimento: custoFixo.dia_vencimento ? String(custoFixo.dia_vencimento) : '',
        recorrencia: custoFixo.recorrencia,
        obrigatorio: custoFixo.obrigatorio,
        status: custoFixo.status,
        observacoes: custoFixo.observacoes ?? '',
      })
    } else {
      setForm({
        nome: '',
        categoria: 'ferramentas',
        valor_mensal: '',
        data_inicio: new Date().toISOString().split('T')[0] ?? '',
        dia_vencimento: '',
        recorrencia: 'mensal',
        obrigatorio: false,
        status: 'ativo',
        observacoes: '',
      })
    }
    setErrors({})
  }, [custoFixo, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = custoFixoSchema.safeParse({
      ...form,
      valor_mensal: parseFloat(form.valor_mensal) || 0,
      dia_vencimento: form.dia_vencimento ? parseInt(form.dia_vencimento, 10) : null,
      observacoes: form.observacoes || null,
    })

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.errors.forEach((err) => {
        const key = err.path[0]
        if (typeof key === 'string') fieldErrors[key] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    const payload: CustoFixoInsert = parsed.data

    try {
      if (isEditing && custoFixo) {
        await updateMutation.mutateAsync({ id: custoFixo.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      setErrors({ _form: 'Erro ao salvar. Tente novamente.' })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Custo Fixo' : 'Novo Custo Fixo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Ex: Hospedagem Vercel"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            {errors.nome && <p className="text-xs text-status-negative">{errors.nome}</p>}
          </div>

          {/* Categoria + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as CustoFixoCategoria })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CustoFixoStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor Mensal + Dia Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
              <Input
                id="valor_mensal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor_mensal}
                onChange={(e) => setForm({ ...form, valor_mensal: e.target.value })}
              />
              {errors.valor_mensal && <p className="text-xs text-status-negative">{errors.valor_mensal}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dia_vencimento">Dia Vencimento</Label>
              <Input
                id="dia_vencimento"
                type="number"
                min="1"
                max="31"
                placeholder="1-31"
                value={form.dia_vencimento}
                onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
              />
              {errors.dia_vencimento && <p className="text-xs text-status-negative">{errors.dia_vencimento}</p>}
            </div>
          </div>

          {/* Data Início + Recorrência */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
              />
              {errors.data_inicio && <p className="text-xs text-status-negative">{errors.data_inicio}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Recorrência</Label>
              <Select value={form.recorrencia} onValueChange={(v) => setForm({ ...form, recorrencia: v as CustoFixoRecorrencia })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RECORRENCIA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Obrigatório toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="obrigatorio">Custo Obrigatório</Label>
            <Switch
              id="obrigatorio"
              checked={form.obrigatorio}
              onCheckedChange={(checked) => setForm({ ...form, obrigatorio: checked })}
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <textarea
              id="observacoes"
              rows={2}
              placeholder="Notas adicionais..."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="flex w-full rounded-lg border border-brand-blue-deep/30 bg-bg-navy px-3 py-2 text-sm text-text-primary placeholder:text-text-dark focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 resize-none transition-colors"
            />
          </div>

          {errors._form && (
            <p className="text-sm text-status-negative text-center">{errors._form}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
