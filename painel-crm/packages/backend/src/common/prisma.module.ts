import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaSessionService } from './prisma-session.service';

@Global()
@Module({
  providers: [PrismaService, PrismaSessionService],
  exports: [PrismaService, PrismaSessionService],
})
export class PrismaModule {}
