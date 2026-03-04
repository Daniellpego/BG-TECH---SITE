import { LlmAdapter } from './llm.interface';
import { MockLlmAdapter } from './mock-llm.adapter';
import { OpenAIAdapter } from './openai.adapter';
import { AnthropicAdapter } from './anthropic.adapter';

/**
 * Factory para selecionar o adapter LLM baseado em variável de ambiente.
 * LLM_PROVIDER = 'openai' | 'anthropic' | 'mock' (default)
 */
export function createLlmAdapter(): LlmAdapter {
  const provider = process.env.LLM_PROVIDER || 'mock';

  switch (provider) {
    case 'openai':
      return new OpenAIAdapter();
    case 'anthropic':
      return new AnthropicAdapter();
    case 'mock':
    default:
      return new MockLlmAdapter();
  }
}
