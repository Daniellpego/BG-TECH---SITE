import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ClmService } from './clm.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@ApiTags('clm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clm')
export class ClmController {
  constructor(private clmService: ClmService) {}

  @Post('proposals/generate')
  @ApiOperation({ summary: 'Generate proposal draft via LLM + verify with rule engine' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { opportunityId: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Generated proposal with verification result' })
  async generateProposal(
    @CurrentTenant() tenantId: string,
    @Body() body: { opportunityId: string },
  ) {
    return this.clmService.generateProposalDraft(tenantId, body.opportunityId);
  }

  @Post('contracts/generate')
  @ApiOperation({ summary: 'Generate contract from approved proposal' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { proposalId: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Generated contract with verification result' })
  async generateContract(
    @CurrentTenant() tenantId: string,
    @Body() body: { proposalId: string },
  ) {
    return this.clmService.generateContract(tenantId, body.proposalId);
  }

  @Get('proposals/:id/verify')
  @ApiOperation({ summary: 'Verify existing proposal with rule engine' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyProposal(
    @CurrentTenant() tenantId: string,
    @Param('id') proposalId: string,
  ) {
    return this.clmService.verifyExistingProposal(tenantId, proposalId);
  }
}
