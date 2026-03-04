-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,
    "tenant_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'sales',
    "avatar_url" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "size" TEXT,
    "annual_revenue" DOUBLE PRECISION,
    "meta" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "department" TEXT,
    "linkedin_url" TEXT,
    "meta" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'lead',
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expected_close_date" TIMESTAMP(3),
    "technical_estimate" JSONB,
    "qualification_data" JSONB,
    "source" TEXT,
    "lost_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT,
    "cost_per_hour" DOUBLE PRECISION NOT NULL,
    "billable_rate" DOUBLE PRECISION,
    "skills" JSONB DEFAULT '[]',
    "availability" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "milestones" JSONB DEFAULT '[]',
    "margin_est" DOUBLE PRECISION,
    "margin_real" DOUBLE PRECISION,
    "budget_hours" DOUBLE PRECISION,
    "actual_hours" DOUBLE PRECISION,
    "meta" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "metrics" JSONB DEFAULT '{}',
    "start_date" TIMESTAMP(3),
    "renew_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "content_markdown" TEXT,
    "content_html" TEXT,
    "estimated_value" DOUBLE PRECISION,
    "effort_breakdown" JSONB,
    "risk_assessment" JSONB,
    "valid_until" TIMESTAMP(3),
    "verification_log" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "proposal_id" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "content_markdown" TEXT,
    "clauses" JSONB DEFAULT '[]',
    "signed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "signature_data" JSONB,
    "meta" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opportunity_id" TEXT,
    "agent_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "tokens_used" INTEGER,
    "latency_ms" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "accounts_tenant_id_idx" ON "accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "contacts_tenant_id_idx" ON "contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "contacts_account_id_idx" ON "contacts"("account_id");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_idx" ON "opportunities"("tenant_id");

-- CreateIndex
CREATE INDEX "opportunities_account_id_idx" ON "opportunities"("account_id");

-- CreateIndex
CREATE INDEX "opportunities_stage_idx" ON "opportunities"("stage");

-- CreateIndex
CREATE INDEX "resources_tenant_id_idx" ON "resources"("tenant_id");

-- CreateIndex
CREATE INDEX "projects_tenant_id_idx" ON "projects"("tenant_id");

-- CreateIndex
CREATE INDEX "projects_account_id_idx" ON "projects"("account_id");

-- CreateIndex
CREATE INDEX "slas_tenant_id_idx" ON "slas"("tenant_id");

-- CreateIndex
CREATE INDEX "slas_account_id_idx" ON "slas"("account_id");

-- CreateIndex
CREATE INDEX "proposals_tenant_id_idx" ON "proposals"("tenant_id");

-- CreateIndex
CREATE INDEX "proposals_opportunity_id_idx" ON "proposals"("opportunity_id");

-- CreateIndex
CREATE INDEX "contracts_tenant_id_idx" ON "contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "contracts_proposal_id_idx" ON "contracts"("proposal_id");

-- CreateIndex
CREATE INDEX "agent_logs_tenant_id_idx" ON "agent_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "agent_logs_opportunity_id_idx" ON "agent_logs"("opportunity_id");

-- CreateIndex
CREATE INDEX "agent_logs_agent_name_idx" ON "agent_logs"("agent_name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slas" ADD CONSTRAINT "slas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slas" ADD CONSTRAINT "slas_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
