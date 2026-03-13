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
import { useCreateReceita, useUpdateReceita, useClientesSuggestions, type ReceitaInsert } from '@/hooks/use-receitas'
import type { Receita, ReceitaTipo, ReceitaStatus } from '@/types/database'

const receitaSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  descricao: z.string().nullable().optional(),
  tipo: z.enum(['setup', 'mensalidade', 'projeto_avulso', 'consultoria', 'mvp', 'outro'] as const),
  valor_bruto: z.number().min(0, 'Valor deve ser positivo'),
  taxas: z.number().min(0).default(0),
  recorrente: z.boolean(),
  status: z.enum(['previsto', 'confirmado', 'cancelado'] as const),
  categoria: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
})

const TIPO_LABELS: Record<ReceitaTipo, string> = {
  setup: 'Setup',
  mensalidade: 'Mensalidade',
  projeto_avulso: 'Projeto Avulso',
  consultoria: 'Consultoria',
  mvp: 'MVP',
  outro: 'Outro',
}

const STATUS_LABELS: Record<ReceitaStatus, string> = {
  previsto: 'Previsto',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
}

interface ReceitaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receita?: Receita | null
}

export function ReceitaForm({ open, onOpenChange, receita }: ReceitaFormProps) {
  const createMutation = useCreateReceita()
  const updateMutation = useUpdateReceita()
  const { data: clientes } = useClientesSuggestions()
  const isEditing = !!receita

  const [form, setForm] = useState({
    data: '',
    cliente: '',
    descricao: '',
    tipo: 'mensalidade' as ReceitaTipo,
    valor_bruto: '',
    taxas: '0',
    recorrente: false,
    status: 'previsto' as ReceitaStatus,
    categoria: '',
    observacoes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (receita) {
      setForm({
        data: receita.data,
        cliente: receita.cliente,
        descricao: receita.descricao ?? '',
        tipo: receita.tipo,
        valor_bruto: String(receita.valor_bruto),
        taxas: String(receita.taxas),
        recorrente: receita.recorrente,
        status: receita.status,
        categoria: receita.categoria ?? '',
        observacoes: receita.observacoes ?? '',
      })
    } else {
      setForm({
        data: new Date().toISOString().split('T')[0] ?? '',
        cliente: '',
        descricao: '',
        tipo: 'mensalidade',
        valor_bruto: '',
        taxas: '0',
        recorrente: false,
        status: 'previsto',
        categoria: '',
        observacoes: '',
      })
    }
    setErrors({})
  }, [receita, open])

  const filteredClientes = clientes?.filter((c) =>
    c.toLowerCase().includes(form.cliente.toLowerCase()) && c !== form.cliente
  ) ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = receitaSchema.safeParse({
      ...form,
      valor_bruto: parseFloat(form.valor_bruto) || 0,
      taxas: parseFloat(form.taxas) || 0,
      descricao: form.descricao || null,
      categoria: form.categoria || null,
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

    const payload: ReceitaInsert = parsed.data

    try {
      if (isEditing && receita) {
        await updateMutation.mutateAsync({ id: receita.id, ...payload })
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
          <DialogTitle>{isEditing ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data */}
          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
            {errors.data && <p className="text-xs text-status-negative">{errors.data}</p>}
          </div>

          {/* Cliente with autocomplete */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="cliente">Cliente</Label>
            <Input
              id="cliente"
              placeholder="Nome do cliente"
              value={form.cliente}
              onChange={(e) => {
                setForm({ ...form, cliente: e.target.value })
                setShowSuggestions(true)
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && filteredClientes.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-bg-card border border-brand-blue-deep/30 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                {filteredClientes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-hover"
                    onMouseDown={() => {
                      setForm({ ...form, cliente: c })
                      setShowSuggestions(false)
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {errors.cliente && <p className="text-xs text-status-negative">{errors.cliente}</p>}
          </div>

          {/* Tipo + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as ReceitaTipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ReceitaStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor Bruto + Taxas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valor_bruto">Valor Bruto (R$)</Label>
              <Input
                id="valor_bruto"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor_bruto}
                onChange={(e) => setForm({ ...form, valor_bruto: e.target.value })}
              />
              {errors.valor_bruto && <p className="text-xs text-status-negative">{errors.valor_bruto}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxas">Taxas (R$)</Label>
              <Input
                id="taxas"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.taxas}
                onChange={(e) => setForm({ ...form, taxas: e.target.value })}
              />
            </div>
          </div>

          {/* Recorrente toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="recorrente">Receita Recorrente</Label>
            <Switch
              id="recorrente"
              checked={form.recorrente}
              onCheckedChange={(checked) => setForm({ ...form, recorrente: checked })}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input
              id="descricao"
              placeholder="Descrição do serviço"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <Label htmlFor="categoria">Categoria (opcional)</Label>
            <Input
              id="categoria"
              placeholder="ex: automacao, software"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
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
