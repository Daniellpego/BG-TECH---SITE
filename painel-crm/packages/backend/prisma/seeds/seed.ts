import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Tenants ──
  const tenant1 = await prisma.tenant.upsert({
    where: { domain: 'acme.bgtech.com' },
    update: {},
    create: {
      id: 'tenant-001',
      name: 'ACME Corp',
      domain: 'acme.bgtech.com',
      plan: 'professional',
      settings: { timezone: 'America/Sao_Paulo', currency: 'BRL' },
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { domain: 'globex.bgtech.com' },
    update: {},
    create: {
      id: 'tenant-002',
      name: 'Globex Industries',
      domain: 'globex.bgtech.com',
      plan: 'enterprise',
      settings: { timezone: 'America/New_York', currency: 'USD' },
    },
  });

  // ── Users ──
  const passwordHash = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@acme.com' },
      update: {},
      create: {
        id: 'user-001',
        email: 'admin@acme.com',
        name: 'Carlos Admin',
        passwordHash,
        tenantId: tenant1.id,
        role: 'admin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'vendas@acme.com' },
      update: {},
      create: {
        id: 'user-002',
        email: 'vendas@acme.com',
        name: 'Juliana Vendas',
        passwordHash,
        tenantId: tenant1.id,
        role: 'sales',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@globex.com' },
      update: {},
      create: {
        id: 'user-003',
        email: 'admin@globex.com',
        name: 'Pedro Globex',
        passwordHash,
        tenantId: tenant2.id,
        role: 'admin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'eng@globex.com' },
      update: {},
      create: {
        id: 'user-004',
        email: 'eng@globex.com',
        name: 'Ana Engenheira',
        passwordHash,
        tenantId: tenant2.id,
        role: 'engineer',
      },
    }),
  ]);

  // ── Accounts (Tenant 1) ──
  const acmeAccounts = await Promise.all([
    prisma.account.upsert({
      where: { id: 'acc-t1-001' },
      update: {},
      create: {
        id: 'acc-t1-001',
        tenantId: tenant1.id,
        name: 'Petrobras Digital',
        industry: 'Oil & Gas',
        website: 'https://petrobras.com.br',
        size: 'Enterprise',
        annualRevenue: 500000000,
      },
    }),
    prisma.account.upsert({
      where: { id: 'acc-t1-002' },
      update: {},
      create: {
        id: 'acc-t1-002',
        tenantId: tenant1.id,
        name: 'Nubank',
        industry: 'Fintech',
        website: 'https://nubank.com.br',
        size: 'Enterprise',
        annualRevenue: 200000000,
      },
    }),
    prisma.account.upsert({
      where: { id: 'acc-t1-003' },
      update: {},
      create: {
        id: 'acc-t1-003',
        tenantId: tenant1.id,
        name: 'Hospital Albert Einstein',
        industry: 'Healthcare',
        website: 'https://einstein.br',
        size: 'Mid-Market',
        annualRevenue: 80000000,
      },
    }),
  ]);

  // ── Accounts (Tenant 2) ──
  const globexAccounts = await Promise.all([
    prisma.account.upsert({
      where: { id: 'acc-t2-001' },
      update: {},
      create: {
        id: 'acc-t2-001',
        tenantId: tenant2.id,
        name: 'Tesla Energy',
        industry: 'Energy',
        website: 'https://tesla.com',
        size: 'Enterprise',
        annualRevenue: 10000000000,
      },
    }),
    prisma.account.upsert({
      where: { id: 'acc-t2-002' },
      update: {},
      create: {
        id: 'acc-t2-002',
        tenantId: tenant2.id,
        name: 'Spotify Engineering',
        industry: 'Media & Entertainment',
        website: 'https://spotify.com',
        size: 'Enterprise',
        annualRevenue: 1500000000,
      },
    }),
    prisma.account.upsert({
      where: { id: 'acc-t2-003' },
      update: {},
      create: {
        id: 'acc-t2-003',
        tenantId: tenant2.id,
        name: 'Startup XYZ',
        industry: 'SaaS',
        website: 'https://startupxyz.com',
        size: 'SMB',
        annualRevenue: 5000000,
      },
    }),
  ]);

  // ── Contacts ──
  await Promise.all([
    prisma.contact.upsert({
      where: { id: 'ct-t1-001' },
      update: {},
      create: {
        id: 'ct-t1-001',
        tenantId: tenant1.id,
        accountId: acmeAccounts[0].id,
        name: 'Roberto Silva',
        email: 'roberto@petrobras.com',
        phone: '+5521999887766',
        role: 'CTO',
        department: 'Technology',
      },
    }),
    prisma.contact.upsert({
      where: { id: 'ct-t1-002' },
      update: {},
      create: {
        id: 'ct-t1-002',
        tenantId: tenant1.id,
        accountId: acmeAccounts[1].id,
        name: 'Fernanda Costa',
        email: 'fernanda@nubank.com',
        phone: '+5511988776655',
        role: 'VP Engineering',
        department: 'Engineering',
      },
    }),
    prisma.contact.upsert({
      where: { id: 'ct-t2-001' },
      update: {},
      create: {
        id: 'ct-t2-001',
        tenantId: tenant2.id,
        accountId: globexAccounts[0].id,
        name: 'Elon CTO',
        email: 'cto@tesla.com',
        role: 'CTO',
        department: 'Technology',
      },
    }),
  ]);

  // ── Opportunities (Tenant 1 — 3 opps) ──
  await Promise.all([
    prisma.opportunity.upsert({
      where: { id: 'opp-t1-001' },
      update: {},
      create: {
        id: 'opp-t1-001',
        tenantId: tenant1.id,
        accountId: acmeAccounts[0].id,
        title: 'SCADA Modernization Platform',
        description: 'Modernização do sistema SCADA com IoT e dashboards em tempo real',
        value: 1500000,
        stage: 'qualified',
        probability: 60,
        source: 'inbound',
        expectedCloseDate: new Date('2026-06-30'),
        technicalEstimate: {
          totalHours: 2400,
          components: ['IoT Gateway', 'Real-time Dashboard', 'Data Lake', 'Alert System'],
          team: { senior: 3, mid: 4, junior: 2 },
        },
        qualificationData: {
          bant: { budget: 2000000, authority: 'CTO approved', need: 'critical', timing: 'Q2 2026' },
          riskFlags: ['legacy_integration', 'compliance_oil_gas'],
        },
      },
    }),
    prisma.opportunity.upsert({
      where: { id: 'opp-t1-002' },
      update: {},
      create: {
        id: 'opp-t1-002',
        tenantId: tenant1.id,
        accountId: acmeAccounts[1].id,
        title: 'Nubank Internal Tooling Suite',
        description: 'Conjunto de ferramentas internas para automação de processos',
        value: 800000,
        stage: 'proposal',
        probability: 75,
        source: 'referral',
        expectedCloseDate: new Date('2026-04-15'),
        technicalEstimate: {
          totalHours: 1200,
          components: ['Workflow Engine', 'Admin Portal', 'API Gateway'],
          team: { senior: 2, mid: 3, junior: 1 },
        },
      },
    }),
    prisma.opportunity.upsert({
      where: { id: 'opp-t1-003' },
      update: {},
      create: {
        id: 'opp-t1-003',
        tenantId: tenant1.id,
        accountId: acmeAccounts[2].id,
        title: 'Telehealth Platform MVP',
        description: 'Plataforma de telemedicina com agendamento e videoconferência',
        value: 450000,
        stage: 'lead',
        probability: 20,
        source: 'outbound',
        expectedCloseDate: new Date('2026-08-01'),
      },
    }),
  ]);

  // ── Opportunities (Tenant 2 — 3 opps) ──
  await Promise.all([
    prisma.opportunity.upsert({
      where: { id: 'opp-t2-001' },
      update: {},
      create: {
        id: 'opp-t2-001',
        tenantId: tenant2.id,
        accountId: globexAccounts[0].id,
        title: 'Battery Management System',
        description: 'Real-time battery monitoring and optimization platform',
        value: 3000000,
        stage: 'negotiation',
        probability: 80,
        source: 'partner',
        expectedCloseDate: new Date('2026-05-01'),
        technicalEstimate: {
          totalHours: 4000,
          components: ['IoT Sensors', 'ML Pipeline', 'Dashboard', 'Alert System'],
          team: { senior: 4, mid: 6, junior: 3 },
        },
      },
    }),
    prisma.opportunity.upsert({
      where: { id: 'opp-t2-002' },
      update: {},
      create: {
        id: 'opp-t2-002',
        tenantId: tenant2.id,
        accountId: globexAccounts[1].id,
        title: 'Recommendation Engine v2',
        description: 'Next-gen recommendation engine with real-time personalization',
        value: 1200000,
        stage: 'qualified',
        probability: 50,
        source: 'inbound',
        expectedCloseDate: new Date('2026-07-01'),
      },
    }),
    prisma.opportunity.upsert({
      where: { id: 'opp-t2-003' },
      update: {},
      create: {
        id: 'opp-t2-003',
        tenantId: tenant2.id,
        accountId: globexAccounts[2].id,
        title: 'SaaS Platform Rebuild',
        description: 'Full rebuild of legacy SaaS platform to microservices',
        value: 250000,
        stage: 'closed_won',
        probability: 100,
        source: 'outbound',
        expectedCloseDate: new Date('2026-03-01'),
      },
    }),
  ]);

  // ── Resources ──
  await Promise.all([
    prisma.resource.upsert({
      where: { id: 'res-t1-001' },
      update: {},
      create: {
        id: 'res-t1-001',
        tenantId: tenant1.id,
        name: 'João Senior Dev',
        title: 'Senior Software Engineer',
        email: 'joao@bgtech.com',
        costPerHour: 150,
        billableRate: 280,
        skills: ['NestJS', 'React', 'PostgreSQL', 'AWS'],
        availability: { hoursPerWeek: 40, bookedUntil: '2026-06-01' },
      },
    }),
    prisma.resource.upsert({
      where: { id: 'res-t1-002' },
      update: {},
      create: {
        id: 'res-t1-002',
        tenantId: tenant1.id,
        name: 'Maria Tech Lead',
        title: 'Tech Lead',
        email: 'maria@bgtech.com',
        costPerHour: 200,
        billableRate: 350,
        skills: ['Architecture', 'NestJS', 'React', 'DevOps', 'AI/ML'],
        availability: { hoursPerWeek: 35, bookedUntil: '2026-04-15' },
      },
    }),
    prisma.resource.upsert({
      where: { id: 'res-t2-001' },
      update: {},
      create: {
        id: 'res-t2-001',
        tenantId: tenant2.id,
        name: 'Alex Full Stack',
        title: 'Full Stack Developer',
        email: 'alex@globex.com',
        costPerHour: 120,
        billableRate: 220,
        skills: ['Next.js', 'Node.js', 'Python', 'GCP'],
        availability: { hoursPerWeek: 40, bookedUntil: '2026-05-01' },
      },
    }),
  ]);

  // ── Projects ──
  await Promise.all([
    prisma.project.upsert({
      where: { id: 'proj-t1-001' },
      update: {},
      create: {
        id: 'proj-t1-001',
        tenantId: tenant1.id,
        accountId: acmeAccounts[1].id,
        name: 'Nubank Internal Tools – Phase 1',
        status: 'active',
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-06-15'),
        budgetHours: 1200,
        actualHours: 480,
        marginEst: 0.35,
        marginReal: 0.32,
        milestones: [
          { name: 'Discovery', status: 'completed', date: '2026-01-30' },
          { name: 'MVP Backend', status: 'in_progress', date: '2026-03-15' },
          { name: 'MVP Frontend', status: 'pending', date: '2026-04-30' },
          { name: 'UAT', status: 'pending', date: '2026-05-31' },
        ],
      },
    }),
    prisma.project.upsert({
      where: { id: 'proj-t2-001' },
      update: {},
      create: {
        id: 'proj-t2-001',
        tenantId: tenant2.id,
        accountId: globexAccounts[2].id,
        name: 'SaaS Platform Rebuild',
        status: 'active',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-08-01'),
        budgetHours: 800,
        actualHours: 160,
        marginEst: 0.40,
        marginReal: 0.38,
        milestones: [
          { name: 'Architecture', status: 'completed', date: '2026-02-15' },
          { name: 'Core Services', status: 'in_progress', date: '2026-04-01' },
          { name: 'Migration', status: 'pending', date: '2026-06-01' },
        ],
      },
    }),
  ]);

  // ── SLAs ──
  await Promise.all([
    prisma.sLA.upsert({
      where: { id: 'sla-t1-001' },
      update: {},
      create: {
        id: 'sla-t1-001',
        tenantId: tenant1.id,
        accountId: acmeAccounts[0].id,
        description: 'Petrobras — Gold SLA (24/7 support, 1h response)',
        tier: 1,
        startDate: new Date('2026-01-01'),
        renewAt: new Date('2027-01-01'),
        status: 'active',
        metrics: {
          responseTimeHours: 1,
          uptimePercent: 99.9,
          supportWindow: '24/7',
          monthlyPrice: 25000,
        },
      },
    }),
    prisma.sLA.upsert({
      where: { id: 'sla-t1-002' },
      update: {},
      create: {
        id: 'sla-t1-002',
        tenantId: tenant1.id,
        accountId: acmeAccounts[2].id,
        description: 'Einstein — Silver SLA (business hours, 4h response)',
        tier: 2,
        startDate: new Date('2026-02-01'),
        renewAt: new Date('2026-08-01'),
        status: 'active',
        metrics: {
          responseTimeHours: 4,
          uptimePercent: 99.5,
          supportWindow: 'business_hours',
          monthlyPrice: 12000,
        },
      },
    }),
    prisma.sLA.upsert({
      where: { id: 'sla-t2-001' },
      update: {},
      create: {
        id: 'sla-t2-001',
        tenantId: tenant2.id,
        accountId: globexAccounts[0].id,
        description: 'Tesla — Gold SLA (24/7, 30min response)',
        tier: 1,
        startDate: new Date('2026-01-15'),
        renewAt: new Date('2027-01-15'),
        status: 'active',
        metrics: {
          responseTimeHours: 0.5,
          uptimePercent: 99.95,
          supportWindow: '24/7',
          monthlyPrice: 50000,
        },
      },
    }),
  ]);

  // ── Proposals ──
  await prisma.proposal.upsert({
    where: { id: 'prop-t1-001' },
    update: {},
    create: {
      id: 'prop-t1-001',
      tenantId: tenant1.id,
      accountId: acmeAccounts[1].id,
      opportunityId: 'opp-t1-002',
      title: 'Proposta Técnica — Nubank Internal Tooling Suite',
      version: 1,
      status: 'sent',
      estimatedValue: 800000,
      contentMarkdown: `# Proposta Técnica — Nubank Internal Tooling Suite

## Resumo Executivo
Proposta para desenvolvimento de conjunto de ferramentas internas para automação de processos da Nubank.

## Arquitetura Proposta
- **Workflow Engine**: Motor de automação baseado em BPMN
- **Admin Portal**: Interface administrativa React + Next.js
- **API Gateway**: Gateway unificado com rate limiting e auth

## Cronograma
| Fase | Duração | Entrega |
|------|---------|---------|
| Discovery | 2 semanas | Documento de requisitos |
| MVP Backend | 8 semanas | APIs core |
| MVP Frontend | 6 semanas | Portal admin funcional |
| UAT | 4 semanas | Sistema validado |

## Investimento
**R$ 800.000,00** — pagamento em 4 parcelas vinculadas a milestones.

## Equipe
- 1 Tech Lead
- 2 Senior Devs
- 3 Mid-level Devs
- 1 Junior Dev

## Validade
Esta proposta é válida por 30 dias.
`,
      effortBreakdown: {
        discovery: 80,
        backend: 480,
        frontend: 360,
        testing: 160,
        deployment: 80,
        management: 40,
        total: 1200,
      },
      riskAssessment: {
        score: 25,
        flags: ['tight_timeline', 'third_party_integration'],
        mitigations: ['Add buffer to timeline', 'Early integration testing'],
      },
      validUntil: new Date('2026-04-15'),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`   Tenants: ${tenant1.name}, ${tenant2.name}`);
  console.log(`   Users: ${users.length}`);
  console.log(`   Accounts: ${acmeAccounts.length + globexAccounts.length}`);
  console.log('   Opportunities: 6 (3 per tenant)');
  console.log('   + Contacts, Resources, Projects, SLAs, Proposals');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
