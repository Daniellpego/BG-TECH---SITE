import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ClmService } from './clm.service';
import { ClmController } from './clm.controller';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [ContractsController, ClmController],
  providers: [ContractsService, ClmService],
  exports: [ContractsService, ClmService],
})
export class ContractsModule {}
