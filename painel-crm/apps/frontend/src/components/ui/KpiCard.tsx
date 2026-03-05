'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  prefix?: string;
  suffix?: string;
}

export default function KpiCard({ title, value, change, changeLabel, icon, prefix, suffix }: KpiCardProps) {
  const changeColor =
    change === undefined || change === 0
      ? 'text-[var(--text-secondary)]'
      : change > 0
        ? 'text-emerald-400'
        : 'text-red-400';

  const ChangeIcon =
    change === undefined || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 backdrop-blur-sm hover:border-[var(--border-subtle)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
        {icon && <div className="text-[var(--text-tertiary)]">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-[var(--text)]">
        {prefix}
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        {suffix}
      </p>
      {change !== undefined && (
        <div className={`mt-2 flex items-center gap-1 text-xs ${changeColor}`}>
          <ChangeIcon className="h-3 w-3" />
          <span>
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          {changeLabel && <span className="text-[var(--text-tertiary)] ml-1">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
