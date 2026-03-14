'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface ConfigCFO {
  id: string
  aliquota_simples: number
  prolabore_valor: number
  prolabore_socios: number
  prolabore_inss_percentual: number
  updated_at: string
}

export function useConfigCFO() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['config-cfo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_cfo')
        .select('*')
        .limit(1)
        .single()

      if (error) throw error
      return data as ConfigCFO
    },
    staleTime: 5 * 60 * 1000,
  })
}

export interface ConfigCFOUpdate {
  aliquota_simples?: number
  prolabore_valor?: number
  prolabore_socios?: number
  prolabore_inss_percentual?: number
}

export function useUpdateConfigCFO() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (updates: ConfigCFOUpdate) => {
      // Get the single config row
      const { data: existing } = await supabase
        .from('configuracoes_cfo')
        .select('id')
        .limit(1)
        .single()

      if (!existing) throw new Error('Config not found')

      const { data, error } = await supabase
        .from('configuracoes_cfo')
        .update({ ...updates, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as ConfigCFO
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-cfo'] })
    },
  })
}

// Computed values
export function computeProLabore(config: ConfigCFO | undefined) {
  if (!config || config.prolabore_valor <= 0) {
    return { totalProLabore: 0, totalINSS: 0, custoTotal: 0 }
  }
  const totalProLabore = config.prolabore_valor * config.prolabore_socios
  const totalINSS = totalProLabore * (config.prolabore_inss_percentual / 100)
  return { totalProLabore, totalINSS, custoTotal: totalProLabore + totalINSS }
}
