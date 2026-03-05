'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { clsx } from 'clsx';

interface AnimatedKpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  icon?: React.ReactNode;
  delay?: number;
  className?: string;
}

function useCountAnimation(target: number, duration: number = 1200, delay: number = 0) {
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

    const startTime = Date.now() + delay;
    let raf: number;

    function tick() {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay, prefersReducedMotion]);

  return count;
}

export function AnimatedKpiCard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  icon,
  delay = 0,
  className,
}: AnimatedKpiCardProps) {
  const animatedValue = useCountAnimation(value, 1200, delay);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: delay / 1000, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={prefersReducedMotion ? {} : { scale: 1.03, y: -2 }}
      className={clsx(
        'relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6',
        'transition-all duration-300',
        'hover:shadow-lg',
        'group cursor-default',
        className,
      )}
    >
      {/* Subtle gradient glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-secondary)] font-medium">{title}</p>
          <p className="text-2xl font-bold text-[var(--text)] tabular-nums tracking-tight">
            {prefix}{animatedValue.toLocaleString('pt-BR')}{suffix}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              <span className={clsx(
                'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                change > 0 ? 'text-emerald-500 bg-emerald-500/10' : change < 0 ? 'text-[var(--danger)] bg-red-500/10' : 'text-[var(--text-tertiary)] bg-[var(--bg-hover)]',
              )}>
                {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}%
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">vs mês anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <motion.div
            whileHover={prefersReducedMotion ? {} : { rotate: 8, scale: 1.1 }}
            className="p-3 rounded-xl bg-[var(--bg-hover)] text-[var(--primary)]"
          >
            {icon}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
