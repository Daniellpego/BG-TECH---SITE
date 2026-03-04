-- ============================================================================
-- SQL Views for BI / Analytics — Semantic Layer
-- Compatible with Looker, Power BI, Metabase
-- ============================================================================

-- ─── Pipeline Overview ───
CREATE OR REPLACE VIEW bi_pipeline_overview AS
SELECT
  t.name AS tenant_name,
  o.stage,
  COUNT(*) AS opportunity_count,
  SUM(o.value) AS total_value,
  AVG(o.value) AS avg_value,
  AVG(o.probability) AS avg_probability,
  MIN(o.created_at) AS earliest_created,
  MAX(o.updated_at) AS latest_updated
FROM opportunities o
JOIN tenants t ON o.tenant_id = t.id
GROUP BY t.name, o.stage;

-- ─── Pipeline Velocity ───
CREATE OR REPLACE VIEW bi_pipeline_velocity AS
SELECT
  t.name AS tenant_name,
  DATE_TRUNC('month', o.updated_at) AS month,
  COUNT(*) FILTER (WHERE o.stage = 'closed_won') AS deals_won,
  SUM(o.value) FILTER (WHERE o.stage = 'closed_won') AS revenue_won,
  COUNT(*) FILTER (WHERE o.stage = 'closed_lost') AS deals_lost,
  AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 86400)
    FILTER (WHERE o.stage IN ('closed_won', 'closed_lost')) AS avg_cycle_days
FROM opportunities o
JOIN tenants t ON o.tenant_id = t.id
GROUP BY t.name, DATE_TRUNC('month', o.updated_at);

-- ─── Stage Duration ───
CREATE OR REPLACE VIEW bi_stage_duration AS
SELECT
  t.name AS tenant_name,
  o.stage,
  AVG(EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400) AS avg_days_in_stage,
  COUNT(*) AS count_in_stage
FROM opportunities o
JOIN tenants t ON o.tenant_id = t.id
WHERE o.stage NOT IN ('closed_won', 'closed_lost')
GROUP BY t.name, o.stage;

-- ─── Resource Utilization ───
CREATE OR REPLACE VIEW bi_resource_utilization AS
SELECT
  t.name AS tenant_name,
  p.name AS project_name,
  p.status,
  p.budget_hours,
  p.actual_hours,
  CASE
    WHEN p.budget_hours > 0
    THEN ROUND((p.actual_hours / p.budget_hours * 100)::numeric, 1)
    ELSE 0
  END AS utilization_pct,
  p.margin_est,
  p.margin_real,
  CASE
    WHEN p.margin_est > 0
    THEN ROUND(((p.margin_real - p.margin_est) / p.margin_est * 100)::numeric, 1)
    ELSE 0
  END AS margin_variance_pct
FROM projects p
JOIN tenants t ON p.tenant_id = t.id;

-- ─── SLA Health ───
CREATE OR REPLACE VIEW bi_sla_health AS
SELECT
  t.name AS tenant_name,
  a.name AS account_name,
  s.tier,
  s.status,
  s.renew_at,
  EXTRACT(DAY FROM (s.renew_at - NOW())) AS days_until_renewal,
  CASE
    WHEN s.renew_at < NOW() THEN 'expired'
    WHEN s.renew_at < NOW() + INTERVAL '30 days' THEN 'critical'
    WHEN s.renew_at < NOW() + INTERVAL '90 days' THEN 'attention'
    ELSE 'healthy'
  END AS health_status,
  s.metrics
FROM slas s
JOIN tenants t ON s.tenant_id = t.id
JOIN accounts a ON s.account_id = a.id;

-- ─── Account LTV ───
CREATE OR REPLACE VIEW bi_account_ltv AS
SELECT
  t.name AS tenant_name,
  a.name AS account_name,
  a.industry,
  COUNT(DISTINCT o.id) AS total_opportunities,
  COUNT(DISTINCT o.id) FILTER (WHERE o.stage = 'closed_won') AS won_opportunities,
  SUM(o.value) FILTER (WHERE o.stage = 'closed_won') AS total_revenue,
  COUNT(DISTINCT p.id) AS total_projects,
  COUNT(DISTINCT s.id) AS active_slas,
  MIN(a.created_at) AS first_engagement,
  EXTRACT(DAY FROM (NOW() - MIN(a.created_at))) AS account_age_days
FROM accounts a
JOIN tenants t ON a.tenant_id = t.id
LEFT JOIN opportunities o ON o.account_id = a.id
LEFT JOIN projects p ON p.account_id = a.id
LEFT JOIN slas s ON s.account_id = a.id AND s.status = 'active'
GROUP BY t.name, a.name, a.industry, a.created_at;

-- ─── Agent Performance ───
CREATE OR REPLACE VIEW bi_agent_performance AS
SELECT
  t.name AS tenant_name,
  al.agent_name,
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE al.status = 'success') AS successful_runs,
  COUNT(*) FILTER (WHERE al.status = 'error') AS failed_runs,
  AVG(al.tokens_used) AS avg_tokens,
  AVG(al.latency_ms) AS avg_latency_ms,
  SUM(al.tokens_used) AS total_tokens,
  DATE_TRUNC('day', al.created_at) AS run_date
FROM agent_logs al
JOIN tenants t ON al.tenant_id = t.id
GROUP BY t.name, al.agent_name, DATE_TRUNC('day', al.created_at);

-- ─── Revenue KPIs ───
CREATE OR REPLACE VIEW bi_revenue_kpis AS
SELECT
  t.name AS tenant_name,
  SUM(o.value) FILTER (WHERE o.stage NOT IN ('closed_lost')) AS total_pipeline_value,
  SUM(o.value) FILTER (WHERE o.stage = 'closed_won') AS total_closed_won,
  COUNT(*) FILTER (WHERE o.stage = 'closed_won') AS deals_won,
  COUNT(*) FILTER (WHERE o.stage = 'closed_lost') AS deals_lost,
  CASE
    WHEN COUNT(*) FILTER (WHERE o.stage IN ('closed_won', 'closed_lost')) > 0
    THEN ROUND(
      (COUNT(*) FILTER (WHERE o.stage = 'closed_won')::numeric /
       COUNT(*) FILTER (WHERE o.stage IN ('closed_won', 'closed_lost'))::numeric * 100), 1)
    ELSE 0
  END AS win_rate_pct,
  AVG(o.value) FILTER (WHERE o.stage = 'closed_won') AS avg_deal_size
FROM opportunities o
JOIN tenants t ON o.tenant_id = t.id
GROUP BY t.name;
