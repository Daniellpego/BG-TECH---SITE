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
  default: 'bg-slate-700 text-slate-300',
  success: 'bg-green-900/50 text-green-400 border border-green-800',
  warning: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
  danger: 'bg-red-900/50 text-red-400 border border-red-800',
  info: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  outline: 'border border-slate-600 text-slate-400',
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
            variant === 'success' && 'bg-green-400',
            variant === 'warning' && 'bg-yellow-400',
            variant === 'danger' && 'bg-red-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'default' && 'bg-slate-400',
            variant === 'outline' && 'bg-slate-400',
          )}
        />
      )}
      {children}
    </span>
  );
}
