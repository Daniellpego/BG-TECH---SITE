'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface PeriodContextType {
  month: number
  year: number
  setMonth: (month: number) => void
  setYear: (year: number) => void
  startDate: string
  endDate: string
}

const PeriodContext = createContext<PeriodContextType | null>(null)

export function PeriodProvider({ children }: { children: ReactNode }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return (
    <PeriodContext.Provider value={{ month, year, setMonth, setYear, startDate, endDate }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  const context = useContext(PeriodContext)
  if (!context) {
    throw new Error('usePeriod must be used within PeriodProvider')
  }
  return context
}
