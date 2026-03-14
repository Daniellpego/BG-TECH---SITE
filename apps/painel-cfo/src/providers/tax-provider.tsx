'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface TaxContextType {
  simplesEnabled: boolean
  setSimplesEnabled: (v: boolean) => void
  aliquota: number // 6% default
}

const TaxContext = createContext<TaxContextType>({
  simplesEnabled: false,
  setSimplesEnabled: () => {},
  aliquota: 6,
})

export function TaxProvider({ children }: { children: ReactNode }) {
  const [simplesEnabled, setSimplesEnabled] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bg-simples-enabled')
      if (saved === 'true') setSimplesEnabled(true)
    } catch {}
    setLoaded(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem('bg-simples-enabled', simplesEnabled ? 'true' : 'false')
    } catch {}
  }, [simplesEnabled, loaded])

  return (
    <TaxContext.Provider value={{ simplesEnabled, setSimplesEnabled, aliquota: 6 }}>
      {children}
    </TaxContext.Provider>
  )
}

export function useTax() {
  return useContext(TaxContext)
}
