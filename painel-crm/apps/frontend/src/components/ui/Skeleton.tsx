'use client';

import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className, width, height, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'animate-pulse bg-slate-700/50',
        rounded === 'sm' && 'rounded',
        rounded === 'md' && 'rounded-lg',
        rounded === 'lg' && 'rounded-xl',
        rounded === 'full' && 'rounded-full',
        className,
      )}
      style={{ width, height }}
    />
  );
}

/** Common skeleton patterns */
export function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
