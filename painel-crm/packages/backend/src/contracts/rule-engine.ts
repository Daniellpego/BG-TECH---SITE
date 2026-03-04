/**
 * CLM Rule Engine — Verificador Determinístico de Propostas e Contratos.
 * Valida regras de negócio antes de aprovar documentos.
 */

export interface VerificationResult {
  passed: boolean;
  score: number; // 0-100
  checks: VerificationCheck[];
  blockers: VerificationCheck[];
  warnings: VerificationCheck[];
}

export interface VerificationCheck {
  rule: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  details?: string;
}

const RULES = {
  // ─── Regras de Proposta ───
  proposal: [
    {
      rule: 'MIN_VALUE',
      description: 'Valor mínimo da proposta (R$ 10.000)',
      check: (data: any) => (data.estimatedValue || 0) >= 10000,
      severity: 'blocker' as const,
    },
    {
      rule: 'MAX_DISCOUNT',
      description: 'Desconto máximo permitido (30%)',
      check: (data: any) => {
        const discount = data.discount || 0;
        return discount <= 0.3;
      },
      severity: 'blocker' as const,
    },
    {
      rule: 'VALID_UNTIL',
      description: 'Proposta deve ter data de validade',
      check: (data: any) => !!data.validUntil,
      severity: 'blocker' as const,
    },
    {
      rule: 'EFFORT_BREAKDOWN',
      description: 'Proposta deve ter breakdown de esforço',
      check: (data: any) => !!data.effortBreakdown && Object.keys(data.effortBreakdown).length > 0,
      severity: 'warning' as const,
    },
    {
      rule: 'MARGIN_THRESHOLD',
      description: 'Margem estimada mínima de 20%',
      check: (data: any) => {
        const margin = data.riskAssessment?.financial_impact?.expected_margin;
        return !margin || margin >= 0.2;
      },
      severity: 'warning' as const,
    },
    {
      rule: 'CONTENT_PRESENT',
      description: 'Proposta deve ter conteúdo Markdown',
      check: (data: any) => !!data.contentMarkdown && data.contentMarkdown.length > 100,
      severity: 'blocker' as const,
    },
    {
      rule: 'RISK_ASSESSED',
      description: 'Proposta deve ter avaliação de risco',
      check: (data: any) => !!data.riskAssessment,
      severity: 'warning' as const,
    },
  ],

  // ─── Regras de Contrato ───
  contract: [
    {
      rule: 'CONTRACT_TITLE',
      description: 'Contrato deve ter título',
      check: (data: any) => !!data.title && data.title.length > 5,
      severity: 'blocker' as const,
    },
    {
      rule: 'CLAUSES_PRESENT',
      description: 'Contrato deve ter cláusulas definidas',
      check: (data: any) => Array.isArray(data.clauses) && data.clauses.length > 0,
      severity: 'blocker' as const,
    },
    {
      rule: 'EXPIRY_DATE',
      description: 'Contrato deve ter data de expiração',
      check: (data: any) => !!data.expiresAt,
      severity: 'warning' as const,
    },
    {
      rule: 'LEGAL_REVIEW',
      description: 'Contratos > R$ 500k devem passar por revisão legal',
      check: (data: any) => {
        const value = data.proposalValue || 0;
        if (value > 500000) {
          return data.status === 'legal_review' || data.legalReviewed === true;
        }
        return true;
      },
      severity: 'blocker' as const,
    },
  ],
};

export function verifyProposal(proposalData: any): VerificationResult {
  return runVerification(RULES.proposal, proposalData);
}

export function verifyContract(contractData: any): VerificationResult {
  return runVerification(RULES.contract, contractData);
}

function runVerification(
  rules: Array<{ rule: string; description: string; check: (data: any) => boolean; severity: 'blocker' | 'warning' }>,
  data: any,
): VerificationResult {
  const checks: VerificationCheck[] = [];
  const blockers: VerificationCheck[] = [];
  const warnings: VerificationCheck[] = [];

  for (const rule of rules) {
    const passed = rule.check(data);
    const check: VerificationCheck = {
      rule: rule.rule,
      description: rule.description,
      status: passed ? 'pass' : rule.severity === 'blocker' ? 'fail' : 'warning',
    };

    checks.push(check);

    if (!passed) {
      if (rule.severity === 'blocker') {
        blockers.push(check);
      } else {
        warnings.push(check);
      }
    }
  }

  const passedCount = checks.filter((c) => c.status === 'pass').length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    passed: blockers.length === 0,
    score,
    checks,
    blockers,
    warnings,
  };
}
