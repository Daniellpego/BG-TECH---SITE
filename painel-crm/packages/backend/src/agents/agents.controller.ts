import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Post('qualification')
  @ApiOperation({ summary: 'Run Qualification Agent on an opportunity' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        opportunityId: { type: 'string' },
        context: { type: 'string', description: 'Lead info + meeting transcription' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Qualification result with BANT analysis' })
  async qualification(
    @CurrentTenant() tenantId: string,
    @Body() body: { opportunityId: string; context: string },
  ) {
    return this.agentsService.runQualification(tenantId, body.opportunityId, body.context);
  }

  @Post('proposal')
  @ApiOperation({ summary: 'Run Proposal Agent — generates technical proposal document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        opportunityId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Generated proposal in Markdown + proposalId' })
  async proposal(
    @CurrentTenant() tenantId: string,
    @Body() body: { opportunityId: string },
  ) {
    return this.agentsService.runProposal(tenantId, body.opportunityId);
  }

  @Post('risk')
  @ApiOperation({ summary: 'Run Risk Agent — evaluates deal risk and margin' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        opportunityId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Risk assessment with score and recommendations' })
  async risk(
    @CurrentTenant() tenantId: string,
    @Body() body: { opportunityId: string },
  ) {
    return this.agentsService.runRisk(tenantId, body.opportunityId);
  }

  @Post('churn')
  @ApiOperation({ summary: 'Run Churn Prevention Agent for an account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Churn probability and retention actions' })
  async churn(
    @CurrentTenant() tenantId: string,
    @Body() body: { accountId: string },
  ) {
    return this.agentsService.runChurn(tenantId, body.accountId);
  }

  @Post('negotiation')
  @ApiOperation({ summary: 'Run Negotiation Agent — AI-to-AI negotiation strategy' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        opportunityId: { type: 'string' },
        counterpartyPosition: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Counter-proposal and negotiation strategy' })
  async negotiation(
    @CurrentTenant() tenantId: string,
    @Body() body: { opportunityId: string; counterpartyPosition: string },
  ) {
    return this.agentsService.runNegotiation(tenantId, body.opportunityId, body.counterpartyPosition);
  }

  @Post('lead-to-proposal')
  @ApiOperation({ summary: 'Full pipeline: Lead → Qualification → Proposal → Risk' })
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
  @ApiResponse({ status: 201, description: 'Full pipeline result: opportunity + qualification + proposal + risk' })
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
    return this.agentsService.runLeadToProposal(tenantId, body);
  }

  @Post(':agentName/run')
  @ApiOperation({ summary: 'Generic agent execution endpoint' })
  @ApiResponse({ status: 200, description: 'Agent execution result' })
  async runGeneric(
    @CurrentTenant() tenantId: string,
    @Param('agentName') agentName: string,
    @Body() body: any,
  ) {
    switch (agentName) {
      case 'qualification':
        return this.agentsService.runQualification(tenantId, body.opportunityId, body.context);
      case 'proposal':
        return this.agentsService.runProposal(tenantId, body.opportunityId);
      case 'risk':
        return this.agentsService.runRisk(tenantId, body.opportunityId);
      case 'churn':
        return this.agentsService.runChurn(tenantId, body.accountId);
      case 'negotiation':
        return this.agentsService.runNegotiation(tenantId, body.opportunityId, body.counterpartyPosition);
      default:
        return { error: `Unknown agent: ${agentName}`, availableAgents: ['qualification', 'proposal', 'risk', 'churn', 'negotiation'] };
    }
  }
}
