'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { CustoFixo, CustoFixoCategoria, CustoFixoRecorrencia, CustoFixoStatus } from '@/types/database'

export interface CustoFixoInsert {
  nome: string
  categoria: CustoFixoCategoria
  valor_mensal: number
  data_inicio: string
  dia_vencimento?: number | null
  recorrencia: CustoFixoRecorrencia
  obrigatorio: boolean
  status: CustoFixoStatus
  observacoes?: string | null
  comprovante_url?: string | null
}

export function useCustosFixos() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['custos-fixos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('*')
        .order('valor_mensal', { ascending: false })

      if (error) throw error
      return data as CustoFixo[]
    },
  })
}

export function useCreateCustoFixo() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (custoFixo: CustoFixoInsert) => {
      const { data, error } = await supabase
        .from('custos_fixos')
        .insert(custoFixo as unknown as Record<string, unknown>)
        .select()
        .single()

      if (error) throw error
      return data as CustoFixo
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos-fixos'] })
    },
  })
}

export function useUpdateCustoFixo() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustoFixoInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from('custos_fixos')
        .update(updates as unknown as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CustoFixo
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos-fixos'] })
    },
  })
}

export function useDeleteCustoFixo() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custos_fixos')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos-fixos'] })
    },
  })
}
