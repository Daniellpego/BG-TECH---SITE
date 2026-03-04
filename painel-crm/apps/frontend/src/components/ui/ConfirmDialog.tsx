'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl max-w-sm w-full mx-4"
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby={description ? 'confirm-desc' : undefined}
          >
            <h3 id="confirm-title" className="text-lg font-semibold text-slate-100">
              {title}
            </h3>
            {description && (
              <p id="confirm-desc" className="mt-2 text-sm text-slate-400">
                {description}
              </p>
            )}
            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="ghost" onClick={onCancel} size="sm">
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                onClick={onConfirm}
                loading={loading}
                size="sm"
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
