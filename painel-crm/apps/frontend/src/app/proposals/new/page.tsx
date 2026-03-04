'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { PageTransition } from '@/components/ui/PageTransition';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';

export default function NewProposalPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [content, setContent] = useState(TEMPLATE);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      addToast({ type: 'warning', title: 'Título é obrigatório' });
      return;
    }
    setSaving(true);
    try {
      // TODO: call api.createProposal when endpoint exists
      addToast({ type: 'success', title: 'Proposta salva (demo)' });
      router.push('/proposals');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro ao salvar', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-brand-400" />
          <h1 className="text-xl font-bold">Nova Proposta</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Título da Proposta"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Proposta Comercial ACME — Automação RPA"
        />
        <Input
          label="ID da Oportunidade (opcional)"
          value={opportunityId}
          onChange={(e) => setOpportunityId(e.target.value)}
          placeholder="Vincular a uma oportunidade para sugestões IA"
          hint="Cole o ID da oportunidade para habilitar sugestões IA"
        />
      </div>

      <MarkdownEditor
        value={content}
        onChange={setContent}
        opportunityId={opportunityId || undefined}
        className="min-h-[500px]"
      />

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Salvar Proposta
        </Button>
      </div>
    </PageTransition>
  );
}

const TEMPLATE = `# Proposta Comercial

## 1. Contexto

Descreva o cenário atual do cliente e as dores identificadas.

## 2. Solução Proposta

### 2.1 Escopo
- Item 1
- Item 2

### 2.2 Cronograma
| Fase | Duração | Entregáveis |
|------|---------|-------------|
| Discovery | 2 semanas | Documentação de requisitos |
| Desenvolvimento | 8 semanas | MVP funcional |
| Testes | 2 semanas | Relatório de QA |

## 3. Investimento

| Item | Valor |
|------|-------|
| Setup | R$ 0 |
| Mensal | R$ 0 |

## 4. Próximos Passos

1. Aprovação da proposta
2. Kickoff do projeto
3. Início do desenvolvimento
`;
