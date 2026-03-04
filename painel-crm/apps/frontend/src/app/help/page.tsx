'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  BookOpen,
  MessageCircle,
  Shield,
  Zap,
  BarChart3,
  Users,
  HelpCircle,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ: FaqItem[] = [
  {
    category: 'Geral',
    question: 'O que é o CRM BG Tech?',
    answer:
      'O CRM BG Tech é uma plataforma completa para gestão de relacionamento com clientes, especialmente projetada para empresas de software sob demanda. Inclui pipeline de vendas, propostas com IA, SLAs, gestão de projetos e leads.',
  },
  {
    category: 'Geral',
    question: 'Como faço login?',
    answer:
      'Acesse a página /login com as credenciais fornecidas pelo administrador. O sistema utiliza autenticação JWT com token de sessão.',
  },
  {
    category: 'Pipeline',
    question: 'Como mover oportunidades no pipeline?',
    answer:
      'Na página Pipeline, arraste e solte os cards de oportunidade entre as colunas (Lead → Qualificado → Proposta → Negociação → Ganho/Perdido).',
  },
  {
    category: 'Pipeline',
    question: 'Como criar uma nova oportunidade?',
    answer:
      'Oportunidades podem ser criadas via API ou quando um lead é convertido. O sistema também cria oportunidades automaticamente quando leads atingem score acima de 75.',
  },
  {
    category: 'IA',
    question: 'Como funciona a IA de qualificação?',
    answer:
      'O agente de qualificação analisa dados do lead/oportunidade usando GPT-4o-mini e retorna um score de 0-100, BANT analysis, e recomendações. O custo é controlado por um orçamento mensal configurável.',
  },
  {
    category: 'IA',
    question: 'Quanto custa usar os agentes de IA?',
    answer:
      'Usamos GPT-4o-mini que custa ~$0.015 por chamada. O orçamento mensal padrão é $50/mês por tenant. O middleware de orçamento bloqueia chamadas quando 80% é atingido.',
  },
  {
    category: 'Propostas',
    question: 'Como gerar propostas com IA?',
    answer:
      'Na página de uma oportunidade, clique em "Gerar Proposta". A IA analisa o contexto da oportunidade e cria um rascunho em Markdown que pode ser editado no editor integrado.',
  },
  {
    category: 'SLA',
    question: 'Como recebo alertas de SLAs expirando?',
    answer:
      'O dashboard exibe automaticamente SLAs com vencimento nos próximos 90 dias. A página de SLAs mostra cards com destaque em amber para contratos próximos do vencimento.',
  },
  {
    category: 'Segurança',
    question: 'O CRM é seguro?',
    answer:
      'Sim. Utilizamos HTTPS, headers CSP, Helmet, rate limiting (100 req/min), JWT com expiração, isolamento multi-tenant por Row-Level Security no Postgres, e auditoria de todas as operações.',
  },
  {
    category: 'Segurança',
    question: 'Como funciona o multi-tenant?',
    answer:
      'Cada tenant tem seu próprio tenant_id isolado. O RLS (Row-Level Security) do PostgreSQL garante que nenhum tenant acesse dados de outro. O middleware extrai o tenant do JWT automaticamente.',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'Todos', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'Geral', label: 'Geral', icon: <HelpCircle className="h-4 w-4" /> },
  { key: 'Pipeline', label: 'Pipeline', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'IA', label: 'Inteligência Artificial', icon: <Zap className="h-4 w-4" /> },
  { key: 'Propostas', label: 'Propostas', icon: <MessageCircle className="h-4 w-4" /> },
  { key: 'SLA', label: 'SLAs', icon: <Users className="h-4 w-4" /> },
  { key: 'Segurança', label: 'Segurança', icon: <Shield className="h-4 w-4" /> },
];

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[var(--bg-hover)]"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-[var(--text)]">{item.question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="px-6 pb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = FAQ.filter((item) => {
    const matchCategory = category === 'all' || item.category === category;
    const matchSearch =
      !search ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <PageTransition className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
          Central de Ajuda
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Encontre respostas para as perguntas mais frequentes
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Buscar na central de ajuda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] py-3.5 pl-12 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
              category === cat.key
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="mx-auto max-w-2xl space-y-3">
        {filtered.map((item, i) => (
          <FaqAccordion key={i} item={item} />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-12 text-center">
            <HelpCircle className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              Nenhum resultado encontrado para &ldquo;{search}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
        <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[var(--primary)]" />
        <h3 className="text-lg font-semibold text-[var(--text)]">
          Não encontrou o que precisa?
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Entre em contato com o suporte técnico BG Tech
        </p>
        <a
          href="mailto:suporte@bgtech.com.br"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          <MessageCircle className="h-4 w-4" />
          Falar com Suporte
        </a>
      </div>
    </PageTransition>
  );
}
