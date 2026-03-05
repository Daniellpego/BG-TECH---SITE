'use client';

import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
  success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-500 border border-red-500/20',
  info: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
  outline: 'border border-[var(--border)] text-[var(--text-secondary)]',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({ variant = 'default', size = 'md', children, className, dot }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'default' && 'bg-[var(--text-tertiary)]',
            variant === 'outline' && 'bg-[var(--text-tertiary)]',
          )}
        />
      )}
      {children}
    </span>
  );
}
