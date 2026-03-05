'use client';

import React, { useState, lazy, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Edit3, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import * as api from '@/lib/api';

// Lazy-load heavy markdown libs
const ReactMarkdown = lazy(() => import('react-markdown'));

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  opportunityId?: string;
  className?: string;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  opportunityId,
  className = '',
  placeholder = 'Escreva o conteúdo da proposta em Markdown...',
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [aiLoading, setAiLoading] = useState(false);
  const { addToast } = useToast();

  const handleAiSuggestion = useCallback(async () => {
    if (!opportunityId) {
      addToast({ type: 'warning', title: 'Selecione uma oportunidade primeiro' });
      return;
    }
    setAiLoading(true);
    try {
      const result = await api.runAgent('proposal', { opportunityId, currentDraft: value });
      const output = result.output_data as Record<string, any>;
      if (output?.content) {
        onChange(value + '\n\n' + output.content);
        addToast({ type: 'success', title: 'Sugestão IA adicionada' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro ao gerar sugestão', description: err.message });
    } finally {
      setAiLoading(false);
    }
  }, [opportunityId, value, onChange, addToast]);

  return (
    <div className={`flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 bg-[var(--bg-elevated)]">
        <div className="flex gap-1">
          {(['edit', 'split', 'preview'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {m === 'edit' && <Edit3 className="h-3 w-3" />}
              {m === 'preview' && <Eye className="h-3 w-3" />}
              {m === 'split' && (
                <>
                  <Edit3 className="h-3 w-3" />
                  <Eye className="h-3 w-3" />
                </>
              )}
              {m === 'edit' ? 'Editar' : m === 'preview' ? 'Prévia' : 'Dividido'}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          onClick={handleAiSuggestion}
          loading={aiLoading}
          disabled={aiLoading}
        >
          Sugestão IA
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-[400px]">
        <AnimatePresence mode="wait" initial={false}>
          {(mode === 'edit' || mode === 'split') && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={mode === 'split' ? 'flex-1 border-r border-[var(--border)]' : 'flex-1'}
            >
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-full w-full resize-none bg-transparent p-4 text-sm text-[var(--text)] font-mono placeholder:text-[var(--text-tertiary)] focus:outline-none"
              />
            </motion.div>
          )}

          {(mode === 'preview' || mode === 'split') && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-4"
            >
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{value || '*Nenhum conteúdo ainda...*'}</ReactMarkdown>
                </div>
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
