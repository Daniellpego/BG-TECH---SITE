import { verifyProposal, verifyContract } from './rule-engine';

describe('CLM Rule Engine', () => {
  describe('verifyProposal', () => {
    it('should pass for a valid proposal', () => {
      const result = verifyProposal({
        estimatedValue: 100000,
        validUntil: new Date('2026-12-31'),
        effortBreakdown: { backend: 200, frontend: 150 },
        contentMarkdown: 'A'.repeat(200), // > 100 chars
        riskAssessment: { financial_impact: { expected_margin: 0.3 } },
      });

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.blockers).toHaveLength(0);
    });

    it('should fail if value is below minimum', () => {
      const result = verifyProposal({
        estimatedValue: 5000, // below 10k minimum
        validUntil: new Date('2026-12-31'),
        effortBreakdown: { backend: 200 },
        contentMarkdown: 'A'.repeat(200),
      });

      expect(result.passed).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
      expect(result.blockers.some((b) => b.rule === 'MIN_VALUE')).toBe(true);
    });

    it('should fail if no valid until date', () => {
      const result = verifyProposal({
        estimatedValue: 50000,
        validUntil: null,
        contentMarkdown: 'A'.repeat(200),
      });

      expect(result.passed).toBe(false);
      expect(result.blockers.some((b) => b.rule === 'VALID_UNTIL')).toBe(true);
    });

    it('should fail if content is too short', () => {
      const result = verifyProposal({
        estimatedValue: 50000,
        validUntil: new Date('2026-12-31'),
        contentMarkdown: 'Short',
      });

      expect(result.passed).toBe(false);
      expect(result.blockers.some((b) => b.rule === 'CONTENT_PRESENT')).toBe(true);
    });

    it('should warn if margin is below threshold', () => {
      const result = verifyProposal({
        estimatedValue: 50000,
        validUntil: new Date('2026-12-31'),
        contentMarkdown: 'A'.repeat(200),
        riskAssessment: { financial_impact: { expected_margin: 0.1 } },
      });

      expect(result.warnings.some((w) => w.rule === 'MARGIN_THRESHOLD')).toBe(true);
    });

    it('should warn if no risk assessment', () => {
      const result = verifyProposal({
        estimatedValue: 50000,
        validUntil: new Date('2026-12-31'),
        contentMarkdown: 'A'.repeat(200),
        riskAssessment: null,
      });

      expect(result.warnings.some((w) => w.rule === 'RISK_ASSESSED')).toBe(true);
    });
  });

  describe('verifyContract', () => {
    it('should pass for a valid contract', () => {
      const result = verifyContract({
        title: 'Contrato de Prestação de Serviços',
        clauses: [{ id: 1, title: 'Escopo' }],
        expiresAt: new Date('2027-01-01'),
        proposalValue: 100000,
      });

      expect(result.passed).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });

    it('should fail if no clauses', () => {
      const result = verifyContract({
        title: 'Contrato Test',
        clauses: [],
        expiresAt: new Date('2027-01-01'),
      });

      expect(result.passed).toBe(false);
      expect(result.blockers.some((b) => b.rule === 'CLAUSES_PRESENT')).toBe(true);
    });

    it('should fail for high-value contracts without legal review', () => {
      const result = verifyContract({
        title: 'Contrato High Value',
        clauses: [{ id: 1, title: 'Escopo' }],
        expiresAt: new Date('2027-01-01'),
        proposalValue: 700000,
        status: 'draft',
        legalReviewed: false,
      });

      expect(result.passed).toBe(false);
      expect(result.blockers.some((b) => b.rule === 'LEGAL_REVIEW')).toBe(true);
    });
  });
});
