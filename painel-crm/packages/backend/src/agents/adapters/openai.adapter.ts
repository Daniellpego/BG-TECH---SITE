import { LlmAdapter, LlmResponse, LlmOptions } from './llm.interface';

/**
 * OpenAI Adapter — integração com GPT-4 / GPT-4o
 * Requer OPENAI_API_KEY no .env
 */
export class OpenAIAdapter implements LlmAdapter {
  name = 'openai';

  async chat(systemPrompt: string, userMessage: string, options?: LlmOptions): Promise<LlmResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const start = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 4096,
        ...(options?.responseFormat === 'json' && {
          response_format: { type: 'json_object' },
        }),
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens ?? 0,
      latencyMs: Date.now() - start,
      model: data.model,
    };
  }
}
