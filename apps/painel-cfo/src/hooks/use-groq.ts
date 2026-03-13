'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GroqRequest {
  prompt: string
  context?: Record<string, unknown>
  systemPrompt?: string
}

interface GroqResponse {
  analysis: string
}

export function useGroqAnalysis() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze(request: GroqRequest): Promise<string | null> {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: fnError } = await supabase.functions.invoke<GroqResponse>(
        'groq-analysis',
        { body: request }
      )

      if (fnError) {
        setError(fnError.message ?? 'Erro na análise')
        return null
      }

      return data?.analysis ?? null
    } catch {
      setError('Erro ao conectar com a IA. Tente novamente.')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { analyze, isLoading, error }
}
