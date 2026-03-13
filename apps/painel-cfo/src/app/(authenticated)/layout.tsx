'use client'

import type { ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar'
import { PeriodFilter } from '@/components/period-filter'
import { PeriodProvider } from '@/providers/period-provider'

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <PeriodProvider>
      <div className="min-h-screen bg-bg-navy">
        <Sidebar />
        <main className="lg:pl-[260px] transition-all duration-300">
          {/* Header with period filter */}
          <header className="sticky top-0 z-20 bg-bg-navy/80 backdrop-blur-lg border-b border-brand-blue-deep/20 px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="pl-12 lg:pl-0">
                <PeriodFilter />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </PeriodProvider>
  )
}
