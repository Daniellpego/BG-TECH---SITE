import { Controller, Post, Body, Param, Get, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { enqueueAgentJob, getAgentQueue } from './queue';

const VALID_AGENTS = ['qualification', 'proposal', 'risk', 'churn', 'negotiation', 'lead-to-proposal'];

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  /* ---------- fire-and-forget endpoints (202 Accepted) ---------- */

  @Post('qualification')
  @HttpCode(202)
  @ApiOperation({ summary: 'Enqueue Qualification Agent job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        opportunityId: { type: 'string' },
        context: { type: 'string', description: 'Lead info + meeting transcription' },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Job enqueued — poll via GET /agents/jobs/:jobId' })
  async qualification(
    @CurrentTenant() tenantId: string,
    @Body() body: { opportunityId: string; context: string },
  ) {
    return enqueueAgentJob({
      tenantId,
      agentName: 'qualification',
      action: 'qualify_lead',
      payload: { opportunityId: body.opportunityId, context: body.context },
    });
  }

  @Post('proposal')
  @HttpCode(202)
  @ApiOperation({ summary: 'Enqueue Proposal Agent job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        opportunityId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Job enqueued — poll via GET /agents/jobs/:jobId' })
  async proposal(
    @CurrentTenant() tenantId: string,
    @Body() body: { opportunityId: string },
  ) {
    return enqueueAgentJob({
      tenantId,
      agentName: 'proposal',
      action: 'generate_proposal',
      payload: { opportunityId: body.opportunityId },
    });
  }

  @Post('risk')
  @HttpCode(202)
  @ApiOperation({ summary: 'Enqueue Risk Agent job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        opportunityId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Job enqueued — poll via GET /agents/jobs/:jobId' })
  async risk(
    @CurrentTenant() tenantId: string,
    @Body() body: { opportunityId: string },
  ) {
    return enqueueAgentJob({
      tenantId,
      agentName: 'risk',
      action: 'assess_risk',
      payload: { opportunityId: body.opportunityId },
    });
  }

  @Post('churn')
  @HttpCode(202)
  @ApiOperation({ summary: 'Enqueue Churn Prevention Agent job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Job enqueued — poll via GET /agents/jobs/:jobId' })
  async churn(
    @CurrentTenant() tenantId: string,
    @Body() body: { accountId: string },
  ) {
    return enqueueAgentJob({
      tenantId,
      agentName: 'churn',
      action: 'assess_churn',
      payload: { accountId: body.accountId },
    });
  }

  @Post('negotiation')
  @HttpCode(202)
  @ApiOperation({ summary: 'Enqueue Negotiation Agent job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        opportunityId: { type: 'string' },
        counterpartyPosition: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Job enqueued — poll via GET /agents/jobs/:jobId' })
  async negotiation(
    @CurrentTenant() tenantId: string,
    @Body() body: { opportunityId: string; counterpartyPosition: string },
  ) {
    return enqueueAgentJob({
      tenantId,
      agentName: 'negotiation',
      action: 'negotiate',
      payload: {
        opportunityId: body.opportunityId,
        counterpartyPosition: body.counterpartyPosition,
      },
    });
  }

  @Post('lead-to-proposal')
  @HttpCode(202)
  @ApiOperation({ summary: 'Enqueue full pipeline: Lead → Qualification → Proposal → Risk' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        value: { type: 'number' },
        source: { type: 'string' },
        context: { type: 'string', description: 'Lead info + meeting transcription' },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Pipeline job enqueued — poll via GET /agents/jobs/:jobId' })
  async leadToProposal(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      accountId: string;
      title: string;
      description: string;
      value: number;
      source?: string;
      context: string;
    },
  ) {
    return enqueueAgentJob({
      tenantId,
      agentName: 'lead-to-proposal',
      action: 'full_pipeline',
      payload: body,
    });
  }

  /* ---------- job polling ---------- */

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Poll job status by jobId' })
  @ApiResponse({ status: 200, description: 'Job status and result (if completed)' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const queue = getAgentQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return { status: 'not_found', jobId };
    }

    const state = await job.getState();
    const result = job.returnvalue;

    return {
      jobId: job.id,
      status: state,
      agentName: job.data.agentName,
      result: state === 'completed' ? result : undefined,
      failedReason: state === 'failed' ? job.failedReason : undefined,
      progress: job.progress,
      timestamp: job.timestamp,
    };
  }

  /* ---------- generic endpoint ---------- */

  @Post(':agentName/run')
  @HttpCode(202)
  @ApiOperation({ summary: 'Generic agent execution — enqueues job' })
  @ApiResponse({ status: 202, description: 'Job enqueued — poll via GET /agents/jobs/:jobId' })
  async runGeneric(
    @CurrentTenant() tenantId: string,
    @Param('agentName') agentName: string,
    @Body() body: any,
  ) {
    if (!VALID_AGENTS.includes(agentName)) {
      return {
        error: `Unknown agent: ${agentName}`,
        availableAgents: VALID_AGENTS,
      };
    }

    return enqueueAgentJob({
      tenantId,
      agentName,
      action: `run_${agentName}`,
      payload: body,
    });
  }
}
