export type ReceitaTipo = 'setup' | 'mensalidade' | 'projeto_avulso' | 'consultoria' | 'mvp' | 'outro'
export type ReceitaStatus = 'previsto' | 'confirmado' | 'cancelado'

export type CustoFixoCategoria = 'ferramentas' | 'contabilidade' | 'marketing' | 'infraestrutura' | 'administrativo' | 'pro_labore' | 'impostos_fixos' | 'outro'
export type CustoFixoRecorrencia = 'mensal' | 'trimestral' | 'anual' | 'outro'
export type CustoFixoStatus = 'ativo' | 'suspenso' | 'cancelado'

export type GastoVariavelCategoria = 'marketing' | 'operacional' | 'comercial' | 'impostos_variaveis' | 'freelancer' | 'api_consumo' | 'outro'
export type GastoVariavelTipo = 'operacional' | 'marketing' | 'comercial' | 'impostos'
export type GastoVariavelStatus = 'previsto' | 'confirmado'

export type MetricaMeta = 'mrr' | 'receita_total' | 'margem_bruta' | 'novos_clientes' | 'resultado_liquido' | 'burn_rate'
export type EmprestimoTipo = 'entrada' | 'devolucao'

export interface Receita {
  id: string
  data: string
  cliente: string
  descricao: string | null
  tipo: ReceitaTipo
  valor_bruto: number
  taxas: number
  valor_liquido: number
  recorrente: boolean
  status: ReceitaStatus
  categoria: string | null
  observacoes: string | null
  comprovante_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface CustoFixo {
  id: string
  nome: string
  categoria: CustoFixoCategoria
  valor_mensal: number
  data_inicio: string
  dia_vencimento: number | null
  recorrencia: CustoFixoRecorrencia
  obrigatorio: boolean
  status: CustoFixoStatus
  observacoes: string | null
  comprovante_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface GastoVariavel {
  id: string
  data: string
  descricao: string
  cliente: string | null
  categoria: GastoVariavelCategoria
  tipo: GastoVariavelTipo
  valor: number
  status: GastoVariavelStatus
  observacoes: string | null
  comprovante_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Caixa {
  id: string
  data: string
  saldo: number
  banco: string
  observacoes: string | null
  created_at: string
  created_by: string | null
}

export interface MetaFinanceira {
  id: string
  periodo: string
  metrica: MetricaMeta
  valor_meta: number
  created_at: string
  created_by: string | null
}

export interface EmprestimoSocio {
  id: string
  socio: string
  tipo: EmprestimoTipo
  valor: number
  data: string
  descricao: string | null
  created_at: string
}

export interface HistoricoDecisao {
  id: string
  data: string
  decisao: string
  contexto: string | null
  autor: string
  created_at: string
}

export interface Projecao {
  id: string
  nome: string
  taxa_crescimento_mensal: number
  novos_clientes_mes: number
  ticket_medio: number
  custos_fixos_projetados: number | null
  custo_variavel_percentual: number
  meses_projecao: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ResumoMensal {
  mes: string
  receita_bruta: number
  receita_setup: number
  receita_mensalidades: number
  receita_projetos: number
  receita_liquida: number
  mrr: number
  clientes_ativos: number
}

export type QuizResultadoTipo = 'diagnostico' | 'parceria'
export type QuizOrigem = 'meta_ads' | 'google_ads' | 'site_organico' | 'indicacao'

export interface QuizSession {
  id: string
  lead_id: string | null
  setor: string | null
  faturamento_faixa: string | null
  horas_retrabalho: string | null
  gargalos: string[] | null
  nivel_tecnologia: string | null
  urgencia: string | null
  respostas: Record<string, unknown> | null
  score_automacao: number | null
  custo_invisivel_min: number | null
  custo_invisivel_max: number | null
  resultado_tipo: QuizResultadoTipo
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  origem: QuizOrigem | null
  completed_at: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      receitas: { Row: Receita; Insert: Omit<Receita, 'id' | 'valor_liquido' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Receita, 'id' | 'valor_liquido' | 'created_at' | 'updated_at'>> }
      custos_fixos: { Row: CustoFixo; Insert: Omit<CustoFixo, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<CustoFixo, 'id' | 'created_at' | 'updated_at'>> }
      gastos_variaveis: { Row: GastoVariavel; Insert: Omit<GastoVariavel, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<GastoVariavel, 'id' | 'created_at' | 'updated_at'>> }
      caixa: { Row: Caixa; Insert: Omit<Caixa, 'id' | 'created_at'>; Update: Partial<Omit<Caixa, 'id' | 'created_at'>> }
      metas_financeiras: { Row: MetaFinanceira; Insert: Omit<MetaFinanceira, 'id' | 'created_at'>; Update: Partial<Omit<MetaFinanceira, 'id' | 'created_at'>> }
      emprestimo_socio: { Row: EmprestimoSocio; Insert: Omit<EmprestimoSocio, 'id' | 'created_at'>; Update: Partial<Omit<EmprestimoSocio, 'id' | 'created_at'>> }
      historico_decisoes: { Row: HistoricoDecisao; Insert: Omit<HistoricoDecisao, 'id' | 'created_at'>; Update: Partial<Omit<HistoricoDecisao, 'id' | 'created_at'>> }
      projecoes: { Row: Projecao; Insert: Omit<Projecao, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Projecao, 'id' | 'created_at' | 'updated_at'>> }
      quiz_sessions: { Row: QuizSession; Insert: Omit<QuizSession, 'id' | 'created_at'>; Update: Partial<Omit<QuizSession, 'id' | 'created_at'>> }
    }
    Views: {
      vw_resumo_mensal: { Row: ResumoMensal }
      vw_custos_fixos_mensal: { Row: { mes: string; total_custos_fixos: number } }
      vw_gastos_variaveis_mensal: { Row: { mes: string; total_gastos_variaveis: number; gasto_marketing: number; impostos_variaveis: number } }
    }
  }
}
