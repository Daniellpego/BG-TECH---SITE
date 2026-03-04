/**
 * Token-counting helpers and cost estimation for LLM usage.
 *
 * Provides rough token estimation (chars / 4) when tiktoken is not available,
 * and cost calculation based on provider pricing.
 */

/** Approximate token count using chars/4 heuristic. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Model pricing per 1 K tokens (USD). */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'mock': { input: 0, output: 0 },
};

export interface CostEstimate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
}

/** Compute estimated cost for a given model and token counts. */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): CostEstimate {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['gpt-4o']!;
  const inputCostUsd = (inputTokens / 1000) * pricing.input;
  const outputCostUsd = (outputTokens / 1000) * pricing.output;
  return {
    model,
    inputTokens,
    outputTokens,
    inputCostUsd: +inputCostUsd.toFixed(6),
    outputCostUsd: +outputCostUsd.toFixed(6),
    totalCostUsd: +(inputCostUsd + outputCostUsd).toFixed(6),
  };
}

/** Check if a number of tokens would exceed a budget (in USD). */
export function wouldExceedBudget(
  model: string,
  inputTokens: number,
  estimatedOutputTokens: number,
  budgetRemainingUsd: number,
): boolean {
  const cost = estimateCost(model, inputTokens, estimatedOutputTokens);
  return cost.totalCostUsd > budgetRemainingUsd;
}
