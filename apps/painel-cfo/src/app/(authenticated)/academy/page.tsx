'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { GraduationCap, HelpCircle, TrendingUp, DollarSign, BarChart3, Target, AlertTriangle, Calculator, Shield, Lightbulb, Send, Loader2, Bot, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGroqAnalysis } from '@/hooks/use-groq'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion'

const GLOSSARY = [
  {
    title: 'MRR',
    subtitle: 'Monthly Recurring Revenue',
    icon: TrendingUp,
    explanation: 'Receita que se repete todo mês — mensalidades dos clientes.',
    whyMatters: 'É o indicador #1 de previsibilidade. Quanto maior o MRR, mais segura é a operação da BG Tech.',
    action: 'Foque em converter projetos avulsos em mensalidades recorrentes.',
  },
  {
    title: 'Burn Rate',
    subtitle: 'Taxa de Queima',
    icon: AlertTriangle,
    explanation: 'Quanto a empresa gasta por mês para operar (custos fixos + variáveis).',
    whyMatters: 'Define por quanto tempo a BG Tech sobrevive com o caixa atual.',
    action: 'Se burn rate > receita por 2+ meses, corte custos não-essenciais imediatamente.',
  },
  {
    title: 'Runway',
    subtitle: 'Pista de Decolagem',
    icon: Target,
    explanation: 'Caixa Disponível ÷ Burn Rate = meses de sobrevivência.',
    whyMatters: 'Com runway < 3 meses, a empresa está em risco. Acima de 6 é confortável.',
    action: 'Mantenha runway > 3 meses. Se cair, reduza custos ou acelere vendas.',
  },
  {
    title: 'DRE',
    subtitle: 'Demonstrativo de Resultado',
    icon: BarChart3,
    explanation: 'Relatório que mostra: Receita - Custos - Impostos = Resultado.',
    whyMatters: 'Mostra se a BG Tech está dando lucro ou prejuízo no período.',
    action: 'Analise mensalmente. Se resultado negativo 2+ meses, aja rápido.',
  },
  {
    title: 'Margem Bruta',
    subtitle: 'Gross Margin',
    icon: DollarSign,
    explanation: '(Receita - Custos Variáveis) ÷ Receita × 100.',
    whyMatters: 'Empresas de software B2B devem ter margem bruta > 60%. Abaixo disso, o modelo não escala.',
    action: 'Se margem < 50%, revise precificação ou reduza custos variáveis.',
  },
  {
    title: 'CAC',
    subtitle: 'Custo de Aquisição de Cliente',
    icon: Calculator,
    explanation: 'Gasto total em marketing ÷ número de novos clientes no mês.',
    whyMatters: 'Se CAC > ticket médio do primeiro mês, você está perdendo dinheiro para adquirir clientes.',
    action: 'CAC ideal < 1/3 do LTV. Otimize canais com menor CAC.',
  },
  {
    title: 'Break-even',
    subtitle: 'Ponto de Equilíbrio',
    icon: Shield,
    explanation: 'Quantidade de clientes necessários para cobrir todos os custos.',
    whyMatters: 'Abaixo do break-even, cada mês é prejuízo. Acima, é lucro.',
    action: 'Calcule: Custos Fixos ÷ (Ticket Médio - Custo Variável por Cliente).',
  },
  {
    title: 'Simples Nacional',
    subtitle: 'Regime Tributário',
    icon: Lightbulb,
    explanation: 'Imposto pago sobre o FATURAMENTO (receita bruta), não sobre o lucro.',
    whyMatters: 'Na BG Tech, a alíquota começa em ~6%. Isso é calculado sobre cada centavo que entra.',
    action: 'Nunca confunda: imposto sobre faturamento ≠ imposto sobre lucro.',
  },
]

const GUIDES = [
  { title: 'Como ler a DRE da BG Tech', content: 'A DRE da BG Tech segue a cascata: Receita Bruta → menos Custos Variáveis = Margem Bruta → menos Custos Fixos = Resultado Operacional → menos Impostos = Resultado Líquido. O número mais importante é o Resultado Líquido — se positivo, a empresa está lucrando. Se negativo por 2+ meses, é hora de agir.' },
  { title: 'Quando posso começar pró-labore?', content: 'Pró-labore só faz sentido quando: (1) Resultado líquido é positivo por 3+ meses consecutivos, (2) Runway > 6 meses após o pró-labore, (3) MRR cobre custos fixos + pró-labore. A BG Tech definiu R$ 2.000/mês por sócio, com reavaliação quando MRR > R$ 30k.' },
  { title: 'Como sei se posso investir mais em marketing?', content: 'Verifique: (1) CAC atual — se cada cliente custa menos que o ticket médio do primeiro mês, o marketing está saudável. (2) Runway — se > 3 meses após o investimento extra. (3) ROI — se cada R$ 1 em marketing traz R$ 3+ em receita. Se sim para os 3, invista.' },
  { title: 'O que é Runway e por que me preocupar?', content: 'Runway = Caixa ÷ Burn Rate. Se a BG Tech tem R$ 20k no caixa e gasta R$ 8k/mês, o runway é 2.5 meses. Isso significa: se NADA de receita entrar, a empresa fecha em 2.5 meses. Mantenha sempre > 3 meses.' },
  { title: 'Receita de Setup vs Mensalidade — por que separar?', content: 'Setup é receita única — entra uma vez e acabou. Mensalidade é recorrente — entra todo mês. Para decisões financeiras, mensalidade (MRR) é muito mais valiosa porque é previsível. Um MRR de R$ 10k vale mais que R$ 30k de setup, porque o setup não se repete.' },
  { title: 'Como funciona o Simples Nacional no nosso caso', content: 'BG Tech paga imposto sobre FATURAMENTO (tudo que fatura), não sobre lucro. A alíquota começa em ~6% para empresas de tecnologia. Exemplo: se faturou R$ 10.000, paga ~R$ 600 de DAS, independente de ter tido lucro ou prejuízo.' },
]

interface ChatMessage { role: 'user' | 'assistant'; content: string }

export default function AcademyPage() {
  useEffect(() => { document.title = 'Academy | BG Tech CFO' }, [])

  const { analyze, isLoading } = useGroqAnalysis()
  const [question, setQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null)

  async function handleAskAI(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || isLoading) return
    const userMsg = question.trim()
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }])
    setQuestion('')
    const response = await analyze({ prompt: userMsg })
    setChatHistory((prev) => [...prev, { role: 'assistant', content: response ?? 'Erro ao conectar com a IA. Tente novamente.' }])
  }

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-brand-cyan" />
        <h1 className="text-2xl font-bold text-text-primary">Academy</h1>
      </div>

      {/* Glossário */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-brand-cyan" />
          Glossário Financeiro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GLOSSARY.map((item) => (
            <div key={item.title} className="card-glass-hover space-y-3">
              <div className="flex items-center gap-2">
                <item.icon className="h-5 w-5 text-brand-cyan" />
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                  <p className="text-[10px] text-text-secondary">{item.subtitle}</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{item.explanation}</p>
              <div className="pt-2 border-t border-brand-blue-deep/20">
                <p className="text-[10px] text-brand-cyan font-medium mb-1">Por que importa?</p>
                <p className="text-xs text-text-secondary">{item.whyMatters}</p>
              </div>
              <div className="pt-2 border-t border-brand-blue-deep/20">
                <p className="text-[10px] text-status-positive font-medium mb-1">O que fazer?</p>
                <p className="text-xs text-text-secondary">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Guias */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-status-warning" />
          Guias Práticos
        </h2>
        <div className="space-y-2">
          {GUIDES.map((guide, i) => (
            <div key={i} className="card-glass">
              <button onClick={() => setExpandedGuide(expandedGuide === i ? null : i)} className="w-full flex items-center justify-between text-left">
                <span className="text-sm font-medium text-text-primary">{guide.title}</span>
                {expandedGuide === i ? <ChevronUp className="h-4 w-4 text-text-secondary shrink-0" /> : <ChevronDown className="h-4 w-4 text-text-secondary shrink-0" />}
              </button>
              {expandedGuide === i && (
                <p className="mt-3 pt-3 border-t border-brand-blue-deep/20 text-sm text-text-secondary leading-relaxed">{guide.content}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pergunte à IA */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand-cyan" />
          Pergunte à IA
        </h2>
        <div className="card-glass space-y-4">
          {chatHistory.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn('rounded-lg px-4 py-3 text-sm', msg.role === 'user' ? 'bg-brand-blue-deep/30 text-text-primary ml-8' : 'bg-bg-navy text-text-secondary mr-8')}>
                  <p className="text-[10px] font-semibold mb-1 text-text-dark">{msg.role === 'user' ? 'Você' : 'IA Financeira'}</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              ))}
              {isLoading && (
                <div className="bg-bg-navy rounded-lg px-4 py-3 mr-8 flex items-center gap-2 text-text-secondary text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analisando...
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleAskAI} className="flex gap-2">
            <Input placeholder="Faça uma pergunta sobre as finanças da BG Tech..." value={question} onChange={(e) => setQuestion(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={isLoading || !question.trim()}><Send className="h-4 w-4" /></Button>
          </form>
          <p className="text-[10px] text-text-dark">A IA usa o modelo Llama 3.3 via Groq. Respostas baseadas nos dados do painel.</p>
        </div>
      </section>
    </div>
    </PageTransition>
  )
}
