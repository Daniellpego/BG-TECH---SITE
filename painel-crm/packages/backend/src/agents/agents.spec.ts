import { MockLlmAdapter } from './adapters/mock-llm.adapter';
import { AGENT_PROMPTS } from './prompts';

describe('MockLlmAdapter', () => {
  let adapter: MockLlmAdapter;

  beforeEach(() => {
    adapter = new MockLlmAdapter();
  });

  it('should return qualification JSON for qualification prompt', async () => {
    const result = await adapter.chat(
      AGENT_PROMPTS.qualification.system,
      'Lead info: Company needs IoT platform',
    );

    expect(result.content).toBeDefined();
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.model).toBe('mock-v1');

    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty('budget_estimate');
    expect(parsed).toHaveProperty('decision_makers');
    expect(parsed).toHaveProperty('must_have_reqs');
    expect(parsed).toHaveProperty('bant');
    expect(parsed).toHaveProperty('initial_effort_hours');
  });

  it('should return proposal markdown for proposal prompt', async () => {
    const result = await adapter.chat(
      AGENT_PROMPTS.proposal.system,
      'Generate proposal for IoT platform',
    );

    expect(result.content).toContain('Proposta Técnica');
    expect(result.content).toContain('Arquitetura');
    expect(result.content).toContain('Breakdown');
  });

  it('should return risk JSON for risk prompt', async () => {
    const result = await adapter.chat(
      AGENT_PROMPTS.risk.system,
      'Evaluate risk for deal',
    );

    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty('risk_score');
    expect(parsed).toHaveProperty('risk_level');
    expect(parsed).toHaveProperty('attention_points');
    expect(parsed).toHaveProperty('financial_impact');
    expect(parsed.risk_score).toBeGreaterThanOrEqual(0);
    expect(parsed.risk_score).toBeLessThanOrEqual(100);
  });

  it('should return churn JSON for churn prompt', async () => {
    const result = await adapter.chat(
      AGENT_PROMPTS.churn.system,
      'Analyze churn risk',
    );

    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty('churn_probability');
    expect(parsed).toHaveProperty('health_score');
    expect(parsed).toHaveProperty('recommended_actions');
  });

  it('should return negotiation JSON for negotiation prompt', async () => {
    const result = await adapter.chat(
      AGENT_PROMPTS.negotiation.system,
      'Prepare negotiation strategy',
    );

    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty('counter_proposal');
    expect(parsed).toHaveProperty('negotiation_strategy');
    expect(parsed).toHaveProperty('walk_away_threshold');
    expect(parsed).toHaveProperty('concession_sequence');
  });
});

describe('AGENT_PROMPTS', () => {
  it('should have all 5 agent prompts defined', () => {
    expect(AGENT_PROMPTS).toHaveProperty('qualification');
    expect(AGENT_PROMPTS).toHaveProperty('proposal');
    expect(AGENT_PROMPTS).toHaveProperty('risk');
    expect(AGENT_PROMPTS).toHaveProperty('churn');
    expect(AGENT_PROMPTS).toHaveProperty('negotiation');
  });

  it('qualification userTemplate should include context', () => {
    const result = AGENT_PROMPTS.qualification.userTemplate('Test context data');
    expect(result).toContain('Test context data');
  });

  it('proposal userTemplate should include qualification and account', () => {
    const result = AGENT_PROMPTS.proposal.userTemplate('qual data', 'account data');
    expect(result).toContain('qual data');
    expect(result).toContain('account data');
  });
});
