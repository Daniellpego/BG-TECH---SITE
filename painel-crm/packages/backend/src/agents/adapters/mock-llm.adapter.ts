import { LlmAdapter, LlmResponse, LlmOptions } from './llm.interface';

/**
 * Mock LLM Adapter — retorna respostas simuladas para desenvolvimento e testes.
 * Em produção, substitui-se por OpenAIAdapter ou AnthropicAdapter.
 */
export class MockLlmAdapter implements LlmAdapter {
  name = 'mock';

  async chat(systemPrompt: string, userMessage: string, options?: LlmOptions): Promise<LlmResponse> {
    const start = Date.now();

    // Simulate latency
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));

    let content: string;

    if (systemPrompt.includes('Qualificação') || systemPrompt.includes('Qualification')) {
      content = JSON.stringify({
        budget_estimate: 500000 + Math.floor(Math.random() * 2000000),
        decision_makers: ['CTO', 'VP Engineering'],
        must_have_reqs: [
          'Real-time dashboard',
          'API integration with existing ERP',
          'Multi-tenant support',
        ],
        nice_to_have: ['Mobile app', 'AI-powered insights', 'Custom reports'],
        risk_flags: ['legacy_integration', 'tight_timeline'],
        recommended_next_steps: [
          'Schedule technical deep-dive',
          'Request architecture documentation',
          'Prepare proof-of-concept',
        ],
        initial_effort_hours: 800 + Math.floor(Math.random() * 2000),
        bant: {
          budget: 'Confirmed — R$ 500k-2M range',
          authority: 'CTO has budget authority',
          need: 'Critical — current system at end of life',
          timing: 'Q2 2026 desired start',
        },
      });
    } else if (systemPrompt.includes('Negociação') || systemPrompt.includes('Negotiation')) {
      content = JSON.stringify({
        counter_proposal: {
          adjusted_value: 450000,
          payment_terms: '4 milestones, 25% each',
          scope_adjustments: ['Defer mobile app to Phase 2', 'Reduce testing scope'],
          timeline_adjustment: '+2 weeks',
        },
        negotiation_strategy: 'value-based',
        walk_away_threshold: 380000,
        concession_sequence: [
          'Offer extended support (3 months free)',
          'Flexible payment terms',
          'Scope reduction on non-critical features',
        ],
      });
    } else if (systemPrompt.includes('Proposta') || systemPrompt.includes('proposal')) {
      content = `# Proposta Técnica

## Resumo Executivo
Proposta para desenvolvimento de solução personalizada conforme requisitos levantados na fase de qualificação.

## Arquitetura Proposta
\`\`\`
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │───▶│   API GW     │───▶│   Backend    │
│   (Next.js)  │    │   (Kong)     │    │   (NestJS)   │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                    ┌──────────────┐    ┌───────▼──────┐
                    │   Redis      │◀──▶│  PostgreSQL  │
                    │   (Cache)    │    │  (Supabase)  │
                    └──────────────┘    └──────────────┘
\`\`\`

## Breakdown de Esforço
| Componente | Horas | Recurso |
|-----------|-------|---------|
| Discovery & Design | 80h | Tech Lead |
| Backend APIs | 320h | 2x Senior Dev |
| Frontend | 240h | 2x Mid Dev |
| Integração | 120h | Senior Dev |
| Testes | 80h | QA Engineer |
| Deploy & DevOps | 40h | DevOps |
| **Total** | **880h** | |

## Riscos e Mitigação
1. **Integração Legacy** — Mitigação: fase de discovery dedicada + PoC
2. **Timeline** — Mitigação: MVP approach com entregas incrementais

## Investimento
Estimativa: R$ ${(500000 + Math.floor(Math.random() * 1000000)).toLocaleString('pt-BR')}

## Validade
Esta proposta é válida por 30 dias a partir da data de emissão.
`;
    } else if (systemPrompt.includes('Risco') || systemPrompt.includes('Risk')) {
      content = JSON.stringify({
        risk_score: 15 + Math.floor(Math.random() * 60),
        risk_level: 'medium',
        attention_points: [
          'Margem estimada abaixo do threshold (< 30%)',
          'Timeline agressivo para escopo definido',
          'Dependência de API terceira sem SLA garantido',
        ],
        financial_impact: {
          best_case_margin: 0.4,
          expected_margin: 0.28,
          worst_case_margin: 0.15,
        },
        escalate_to: ['finance'],
        recommendations: [
          'Renegociar timeline para +4 semanas',
          'Incluir cláusula de change request',
          'Adicionar buffer de 15% no orçamento',
        ],
      });
    } else if (systemPrompt.includes('Churn')) {
      content = JSON.stringify({
        churn_probability: Math.random() * 0.4,
        risk_signals: [
          'Decreased login frequency (-30% last month)',
          'Support tickets up 2x',
          'SLA renewal in 60 days — no discussion started',
        ],
        recommended_actions: [
          'Schedule executive check-in',
          'Offer QBR (Quarterly Business Review)',
          'Prepare retention proposal with incentive',
        ],
        health_score: 55 + Math.floor(Math.random() * 30),
      });
    } else {
      content = JSON.stringify({
        message: 'Mock response — configure real LLM adapter for production',
        input_preview: userMessage.substring(0, 100),
      });
    }

    return {
      content,
      tokensUsed: 500 + Math.floor(Math.random() * 1500),
      latencyMs: Date.now() - start,
      model: 'mock-v1',
    };
  }
}
