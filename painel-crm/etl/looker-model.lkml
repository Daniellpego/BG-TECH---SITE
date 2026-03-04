# Looker LookML Semantic Layer — CRM BG Tech (Example)

# ─── Pipeline Velocity Explore ───
explore: pipeline_velocity {
  label: "Pipeline Velocity"
  view_name: bi_pipeline_velocity
  description: "Análise de velocidade do pipeline por mês e tenant"
}

view: bi_pipeline_velocity {
  sql_table_name: public.bi_pipeline_velocity ;;

  dimension: tenant_name {
    type: string
    sql: ${TABLE}.tenant_name ;;
  }

  dimension_group: month {
    type: time
    timeframes: [month, quarter, year]
    sql: ${TABLE}.month ;;
  }

  measure: total_deals_won {
    type: sum
    sql: ${TABLE}.deals_won ;;
  }

  measure: total_revenue_won {
    type: sum
    sql: ${TABLE}.revenue_won ;;
    value_format_name: brl
  }

  measure: avg_cycle_days {
    type: average
    sql: ${TABLE}.avg_cycle_days ;;
    value_format: "0.0"
  }
}

# ─── Resource Utilization Explore ───
explore: resource_utilization {
  label: "Resource Utilization"
  view_name: bi_resource_utilization
}

view: bi_resource_utilization {
  sql_table_name: public.bi_resource_utilization ;;

  dimension: tenant_name { type: string sql: ${TABLE}.tenant_name ;; }
  dimension: project_name { type: string sql: ${TABLE}.project_name ;; }
  dimension: status { type: string sql: ${TABLE}.status ;; }

  measure: avg_utilization {
    type: average
    sql: ${TABLE}.utilization_pct ;;
    value_format: "0.0\%"
  }

  measure: avg_margin_variance {
    type: average
    sql: ${TABLE}.margin_variance_pct ;;
    value_format: "0.0\%"
  }
}

# ─── Revenue KPIs Explore ───
explore: revenue_kpis {
  label: "Revenue Engineering KPIs"
  view_name: bi_revenue_kpis
}

view: bi_revenue_kpis {
  sql_table_name: public.bi_revenue_kpis ;;

  dimension: tenant_name { type: string sql: ${TABLE}.tenant_name ;; }

  measure: total_pipeline {
    type: sum
    sql: ${TABLE}.total_pipeline_value ;;
    value_format_name: brl
  }

  measure: win_rate {
    type: average
    sql: ${TABLE}.win_rate_pct ;;
    value_format: "0.0\%"
  }
}
