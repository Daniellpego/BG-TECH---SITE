'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateGastoVariavel, useUpdateGastoVariavel, type GastoVariavelInsert } from '@/hooks/use-gastos-variaveis'
import type { GastoVariavel, GastoVariavelCategoria, GastoVariavelTipo, GastoVariavelStatus } from '@/types/database'

const gastoVariavelSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  cliente: z.string().nullable().optional(),
  categoria: z.enum(['marketing', 'operacional', 'comercial', 'impostos_variaveis', 'freelancer', 'api_consumo', 'outro'] as const),
  tipo: z.enum(['operacional', 'marketing', 'comercial', 'impostos'] as const),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  status: z.enum(['previsto', 'confirmado'] as const),
  observacoes: z.string().nullable().optional(),
})

const CATEGORIA_LABELS: Record<GastoVariavelCategoria, string> = {
  marketing: 'Marketing',
  operacional: 'Operacional',
  comercial: 'Comercial',
  impostos_variaveis: 'Impostos Variáveis',
  freelancer: 'Freelancer',
  api_consumo: 'API / Consumo',
  outro: 'Outro',
}

const TIPO_LABELS: Record<GastoVariavelTipo, string> = {
  operacional: 'Operacional',
  marketing: 'Marketing',
  comercial: 'Comercial',
  impostos: 'Impostos',
}

const STATUS_LABELS: Record<GastoVariavelStatus, string> = {
  previsto: 'Previsto',
  confirmado: 'Confirmado',
}

interface GastoVariavelFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gasto?: GastoVariavel | null
}

export function GastoVariavelForm({ open, onOpenChange, gasto }: GastoVariavelFormProps) {
  const createMutation = useCreateGastoVariavel()
  const updateMutation = useUpdateGastoVariavel()
  const isEditing = !!gasto

  const [form, setForm] = useState({
    data: '',
    descricao: '',
    cliente: '',
    categoria: 'operacional' as GastoVariavelCategoria,
    tipo: 'operacional' as GastoVariavelTipo,
    valor: '',
    status: 'previsto' as GastoVariavelStatus,
    observacoes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (gasto) {
      setForm({
        data: gasto.data,
        descricao: gasto.descricao,
        cliente: gasto.cliente ?? '',
        categoria: gasto.categoria,
        tipo: gasto.tipo,
        valor: String(gasto.valor),
        status: gasto.status,
        observacoes: gasto.observacoes ?? '',
      })
    } else {
      setForm({
        data: new Date().toISOString().split('T')[0] ?? '',
        descricao: '',
        cliente: '',
        categoria: 'operacional',
        tipo: 'operacional',
        valor: '',
        status: 'previsto',
        observacoes: '',
      })
    }
    setErrors({})
  }, [gasto, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = gastoVariavelSchema.safeParse({
      ...form,
      valor: parseFloat(form.valor) || 0,
      cliente: form.cliente || null,
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

    const payload: GastoVariavelInsert = parsed.data

    try {
      if (isEditing && gasto) {
        await updateMutation.mutateAsync({ id: gasto.id, ...payload })
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
          <DialogTitle>{isEditing ? 'Editar Gasto Variável' : 'Novo Gasto Variável'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data */}
          <div className="space-y-1.5">
            <Label htmlFor="gv-data">Data</Label>
            <Input
              id="gv-data"
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
            {errors.data && <p className="text-xs text-status-negative">{errors.data}</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="gv-descricao">Descrição</Label>
            <Input
              id="gv-descricao"
              placeholder="Descrição do gasto"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
            {errors.descricao && <p className="text-xs text-status-negative">{errors.descricao}</p>}
          </div>

          {/* Cliente (opcional) */}
          <div className="space-y-1.5">
            <Label htmlFor="gv-cliente">Cliente (opcional)</Label>
            <Input
              id="gv-cliente"
              placeholder="Nome do cliente"
              value={form.cliente}
              onChange={(e) => setForm({ ...form, cliente: e.target.value })}
            />
          </div>

          {/* Categoria + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as GastoVariavelCategoria })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as GastoVariavelTipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gv-valor">Valor (R$)</Label>
              <Input
                id="gv-valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
              {errors.valor && <p className="text-xs text-status-negative">{errors.valor}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as GastoVariavelStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="gv-observacoes">Observações (opcional)</Label>
            <textarea
              id="gv-observacoes"
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
