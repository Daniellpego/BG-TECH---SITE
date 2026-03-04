'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  BarChart3,
  Users,
  FolderKanban,
  FileText,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/ui/PageTransition';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}

const STEPS: Step[] = [
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Dashboard Executivo',
    description:
      'Visão geral em tempo real com KPIs de pipeline, win rate, MRR e projetos ativos. Todas as métricas atualizadas automaticamente.',
    href: '/dashboard',
    cta: 'Ver Dashboard',
  },
  {
    icon: <FolderKanban className="h-8 w-8" />,
    title: 'Pipeline Kanban',
    description:
      'Arraste e solte oportunidades entre estágios. Visualize o funil completo de vendas com totais por coluna.',
    href: '/pipeline',
    cta: 'Abrir Pipeline',
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Leads do Quiz',
    description:
      'Leads captados pelo quiz são qualificados automaticamente por IA. Score, temperatura e status — tudo classificado pra você.',
    href: '/leads',
    cta: 'Ver Leads',
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: 'Propostas com IA',
    description:
      'Crie propostas em Markdown com sugestões inteligentes. A IA analisa a oportunidade e gera conteúdo personalizado.',
    href: '/proposals',
    cta: 'Ver Propostas',
  },
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: 'SLAs e Contratos',
    description:
      'Acompanhe SLAs com alertas de vencimento, métricas de uptime e tempos de resposta. Nunca perca uma renovação.',
    href: '/sla',
    cta: 'Ver SLAs',
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: 'Agentes de IA',
    description:
      'Qualificação, geração de propostas e avaliação de risco — tudo automatizado com GPT-4o-mini e controle de orçamento.',
    href: '/dashboard',
    cta: 'Começar a usar',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  function handleNext() {
    if (isLast) {
      // Mark onboarding as complete
      localStorage.setItem('crm-onboarding-complete', 'true');
      router.push('/dashboard');
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleSkip() {
    localStorage.setItem('crm-onboarding-complete', 'true');
    router.push('/dashboard');
  }

  return (
    <PageTransition className="flex min-h-screen items-center justify-center p-4 bg-[var(--bg)]">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
            <Rocket className="h-8 w-8 text-[var(--primary)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
            Bem-vindo ao CRM BG Tech
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Conheça as principais funcionalidades em {STEPS.length} passos
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
          <motion.div
            className="h-full rounded-full bg-[var(--primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-[var(--primary)]'
                  : i < currentStep
                    ? 'w-2 bg-[var(--primary)]/50'
                    : 'w-2 bg-[var(--bg-hover)]'
              }`}
              aria-label={`Passo ${i + 1}`}
            />
          ))}
        </div>

        {/* Step Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass rounded-2xl p-8 text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
              {step.icon}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              {step.title}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[var(--text-secondary)] leading-relaxed">
              {step.description}
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(step.href)}
                className="text-[var(--primary)]"
              >
                {step.cta} →
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            {!isFirst && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep((s) => s - 1)}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Anterior
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLast && (
              <Button variant="ghost" onClick={handleSkip} size="sm">
                Pular tour
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleNext}
              icon={isLast ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            >
              {isLast ? 'Concluir' : 'Próximo'}
            </Button>
          </div>
        </div>

        {/* Step counter */}
        <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
          Passo {currentStep + 1} de {STEPS.length}
        </p>
      </div>
    </PageTransition>
  );
}
