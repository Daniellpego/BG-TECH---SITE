'use client'

import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  collapsed?: boolean
  className?: string
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="gradient-cyan rounded-xl p-2 shrink-0">
        <Brain className="h-6 w-6 text-white" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary tracking-wide">
            BG TECH
          </span>
          <span className="text-[10px] font-semibold text-brand-cyan tracking-widest uppercase">
            Painel CFO
          </span>
        </div>
      )}
    </div>
  )
}
