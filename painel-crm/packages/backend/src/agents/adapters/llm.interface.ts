/**
 * LLM Adapter Interface — abstrai chamadas a LLMs (OpenAI, Anthropic, mock)
 */
export interface LlmResponse {
  content: string;
  tokensUsed: number;
  latencyMs: number;
  model: string;
}

export interface LlmAdapter {
  name: string;
  chat(systemPrompt: string, userMessage: string, options?: LlmOptions): Promise<LlmResponse>;
}

export interface LlmOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}
