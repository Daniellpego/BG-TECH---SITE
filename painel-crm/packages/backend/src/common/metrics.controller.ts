import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect Node.js default metrics (event loop, heap, GC, etc.)
collectDefaultMetrics({ prefix: 'crm_' });

/* ---- Custom metrics ---- */

export const httpRequestDuration = new Histogram({
  name: 'crm_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const agentJobsEnqueued = new Counter({
  name: 'crm_agent_jobs_enqueued_total',
  help: 'Total agent jobs enqueued',
  labelNames: ['agent_name'] as const,
});

export const agentJobsCompleted = new Counter({
  name: 'crm_agent_jobs_completed_total',
  help: 'Total agent jobs completed',
  labelNames: ['agent_name', 'status'] as const,
});

export const llmTokensUsed = new Counter({
  name: 'crm_llm_tokens_used_total',
  help: 'Total LLM tokens consumed',
  labelNames: ['model', 'direction'] as const,
});

@ApiTags('ops')
@ApiExcludeController()
@Controller()
export class MetricsController {
  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
