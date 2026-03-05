'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return React.useContext(ToastContext);
}

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="region" aria-label="Notificações">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const iconMap = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const colorMap = {
  success: 'border-green-500 bg-green-500/10',
  error: 'border-red-500 bg-red-500/10',
  info: 'border-blue-500 bg-blue-500/10',
  warning: 'border-yellow-500 bg-yellow-500/10',
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={clsx(
        'flex items-start gap-3 rounded-2xl border-l-4 p-4 shadow-lg backdrop-blur-sm',
        'bg-[var(--bg-elevated)]',
        colorMap[toast.type],
      )}
      role="alert"
    >
      <span className="text-lg leading-none mt-0.5">{iconMap[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text)]">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-[var(--text-secondary)] hover:text-[var(--text)] text-sm"
        aria-label="Fechar notificação"
      >
        ✕
      </button>
    </motion.div>
  );
}
