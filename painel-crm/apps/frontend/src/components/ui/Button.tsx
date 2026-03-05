'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus-visible:ring-[var(--primary)] rounded-full shadow-sm hover:shadow-md',
  secondary: 'bg-[var(--bg-elevated)] text-[var(--text)] hover:bg-[var(--bg-hover)] border border-[var(--border)] focus-visible:ring-[var(--primary)] rounded-xl',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90 focus-visible:ring-[var(--danger)] rounded-xl',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] focus-visible:ring-[var(--primary)] rounded-xl',
  outline: 'border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] focus-visible:ring-[var(--primary)] rounded-xl',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
}

/** Icon-only button */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const iconSizes: Record<Size, string> = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
        'transition-all duration-200',
        variantStyles[variant],
        iconSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
