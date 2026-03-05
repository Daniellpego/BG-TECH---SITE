'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useOpportunities } from '@/hooks/useQueries';
import { useAuth } from '@/lib/auth';
import type { Opportunity } from '@/types';

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'border-slate-500' },
  { key: 'qualified', label: 'Qualificado', color: 'border-blue-500' },
  { key: 'proposal', label: 'Proposta', color: 'border-purple-500' },
  { key: 'negotiation', label: 'Negociação', color: 'border-amber-500' },
  { key: 'closed_won', label: 'Ganho', color: 'border-emerald-500' },
  { key: 'closed_lost', label: 'Perdido', color: 'border-red-500' },
] as const;

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);

export default function PipelinePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: opportunities = [], isLoading } = useOpportunities();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localStages, setLocalStages] = useState<Record<string, string>>({});
  const prefersReducedMotion = useReducedMotion();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Merge server data with local (optimistic) stage changes
  const effectiveOpps = useMemo(() => {
    return opportunities.map((o) => ({
      ...o,
      stage: (localStages[o.id] || o.stage) as Opportunity['stage'],
    }));
  }, [opportunities, localStages]);

  const byStage = useMemo(() => {
    return STAGES.map((s) => ({
      ...s,
      items: effectiveOpps.filter((o) => o.stage === s.key),
      total: effectiveOpps
        .filter((o) => o.stage === s.key)
        .reduce((sum, o) => sum + o.value, 0),
    }));
  }, [effectiveOpps]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const overId = String(over.id);
    // over.id could be a stage key (droppable column) or an item id
    const targetStage = STAGES.find((s) => s.key === overId)?.key;

    if (targetStage) {
      setLocalStages((prev) => ({ ...prev, [String(active.id)]: targetStage }));
    }
  }, []);

  const activeOpp = activeId ? effectiveOpps.find((o) => o.id === activeId) : null;

  if (isLoading || authLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((s) => (
          <div key={s.key} className="min-w-[280px] flex-1 space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Pipeline</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Arraste cards entre colunas para mover oportunidades
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {byStage.map((stage) => (
            <KanbanColumn key={stage.key} stage={stage} router={router} />
          ))}
        </div>

        <DragOverlay dropAnimation={prefersReducedMotion ? null : undefined}>
          {activeOpp && <KanbanCardOverlay opp={activeOpp} />}
        </DragOverlay>
      </DndContext>
    </PageTransition>
  );
}

// ── Kanban Column ───────────────────────────────────────

function KanbanColumn({
  stage,
  router,
}: {
  stage: { key: string; label: string; color: string; items: Opportunity[]; total: number };
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="min-w-[280px] flex-1">
      <div className={`mb-3 rounded-2xl border-t-2 ${stage.color} bg-[var(--bg-elevated)] px-4 py-3`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text)]">{stage.label}</h3>
          <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
            {stage.items.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">{fmt(stage.total)}</p>
      </div>

      <SortableContext
        items={stage.items.map((o) => o.id)}
        strategy={verticalListSortingStrategy}
        id={stage.key}
      >
        <div className="space-y-2 min-h-[60px]" data-stage={stage.key}>
          <AnimatePresence mode="popLayout">
            {stage.items.map((opp) => (
              <SortableCard key={opp.id} opp={opp} router={router} />
            ))}
          </AnimatePresence>

          {stage.items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--text-tertiary)]">
              Arraste aqui
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Sortable Card ───────────────────────────────────────

function SortableCard({
  opp,
  router,
}: {
  opp: Opportunity;
  router: ReturnType<typeof useRouter>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: opp.id, data: { type: 'opportunity', stage: opp.stage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-shadow hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:border-[var(--border-subtle)]"
    >
      <p className="text-sm font-medium text-[var(--text)]">{opp.title}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{opp.account_name}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm font-semibold text-[var(--primary)]">
          <DollarSign className="h-3.5 w-3.5" />
          {fmt(opp.value)}
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">{opp.probability}%</span>
      </div>

      <button
        className="mt-3 w-full rounded-xl bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/opportunities/${opp.id}`);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Ver Detalhes →
      </button>
    </motion.div>
  );
}

// ── Drag Overlay ────────────────────────────────────────

function KanbanCardOverlay({ opp }: { opp: Opportunity }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--primary)] bg-[var(--bg-elevated)] p-4 shadow-2xl shadow-[var(--primary)]/20 rotate-2 scale-105">
      <p className="text-sm font-medium text-[var(--text)]">{opp.title}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{opp.account_name}</p>
      <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-[var(--primary)]">
        <DollarSign className="h-3.5 w-3.5" />
        {fmt(opp.value)}
      </div>
    </div>
  );
}
