import { LlmAdapter, LlmResponse, LlmOptions } from './llm.interface';

/**
 * Anthropic Adapter — integração com Claude
 * Requer ANTHROPIC_API_KEY no .env
 */
export class AnthropicAdapter implements LlmAdapter {
  name = 'anthropic';

  async chat(systemPrompt: string, userMessage: string, options?: LlmOptions): Promise<LlmResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const start = Date.now();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: options?.maxTokens ?? 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        temperature: options?.temperature ?? 0.3,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
    }

    const textBlock = data.content?.find((b: any) => b.type === 'text');

    return {
      content: textBlock?.text || '',
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      latencyMs: Date.now() - start,
      model: data.model,
    };
  }
}
