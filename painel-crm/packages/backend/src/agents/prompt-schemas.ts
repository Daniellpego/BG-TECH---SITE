import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Loads a JSON-schema file from the prompts/ directory.
 * Caches after first load.
 */
const cache = new Map<string, Record<string, unknown>>();

export function loadPromptSchema(agentName: string): Record<string, unknown> {
  if (cache.has(agentName)) return cache.get(agentName)!;

  const filePath = join(__dirname, 'prompts', `${agentName}.schema.json`);
  const raw = readFileSync(filePath, 'utf-8');
  const schema = JSON.parse(raw) as Record<string, unknown>;

  cache.set(agentName, schema);
  return schema;
}

/**
 * Returns a concise JSON-schema instruction block that can be appended
 * to the system prompt so the LLM produces validated output.
 */
export function schemaInstruction(agentName: string): string {
  const schema = loadPromptSchema(agentName);
  return [
    '',
    '## Output JSON Schema (STRICT — follow exactly)',
    '```json',
    JSON.stringify(schema, null, 2),
    '```',
    'Reply ONLY with valid JSON matching this schema. No markdown fences, no extra text.',
  ].join('\n');
}

/** All available agent schema names. */
export const AGENT_SCHEMA_NAMES = [
  'qualification',
  'proposal',
  'risk',
  'churn',
  'negotiation',
] as const;

export type AgentSchemaName = (typeof AGENT_SCHEMA_NAMES)[number];
