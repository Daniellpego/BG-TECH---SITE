import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './common/prisma.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { BudgetMiddleware } from './common/middleware/budget.middleware';
import { MetricsController } from './common/metrics.controller';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { AccountsModule } from './accounts/accounts.module';
import { ContactsModule } from './contacts/contacts.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { ResourcesModule } from './resources/resources.module';
import { ProjectsModule } from './projects/projects.module';
import { SlaModule } from './sla/sla.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ContractsModule } from './contracts/contracts.module';
import { AgentsModule } from './agents/agents.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LeadsModule } from './leads/leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    AccountsModule,
    ContactsModule,
    OpportunitiesModule,
    ResourcesModule,
    ProjectsModule,
    SlaModule,
    ProposalsModule,
    ContractsModule,
    AgentsModule,
    AnalyticsModule,
    LeadsModule,
  ],
  controllers: [MetricsController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BudgetMiddleware)
      .forRoutes({ path: 'agents/*', method: RequestMethod.POST });
  }
}
