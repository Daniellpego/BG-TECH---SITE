'use client';

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, placeholder, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            placeholder={label ? ' ' : placeholder}
            className={clsx(
              'peer w-full rounded-xl border bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text)]',
              'placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-[var(--danger)]' : 'border-[var(--border)]',
              icon && 'pl-10',
              label && 'pt-5 pb-2',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className={clsx(
                'absolute text-[var(--text-tertiary)] transition-all duration-200 pointer-events-none',
                'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm',
                'peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[var(--primary)] peer-focus:translate-y-0',
                'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:translate-y-0',
                icon ? 'left-10' : 'left-3',
              )}
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-xl border bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text)]',
            'placeholder:text-[var(--text-tertiary)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
            'transition-all duration-200 resize-y min-h-[80px]',
            error ? 'border-[var(--danger)]' : 'border-[var(--border)]',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {error && <p className="text-xs text-[var(--danger)]" role="alert">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
