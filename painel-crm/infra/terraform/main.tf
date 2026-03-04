terraform {
  required_version = ">= 1.5"

  required_providers {
    # Use appropriate provider for your cloud
    # aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

# ─── Variables ───
variable "project_name" {
  default = "crm-bgtech"
}

variable "environment" {
  default = "staging"
}

variable "region" {
  default = "us-east-1"
}

variable "db_password" {
  sensitive = true
}

# ─── Outputs ───
output "info" {
  value = <<-EOT
    CRM BG Tech — Infrastructure
    ─────────────────────────────
    Project:     ${var.project_name}
    Environment: ${var.environment}
    Region:      ${var.region}

    Note: This is a template. Add your cloud provider
    resources (VPC, RDS, ECS/EKS, Redis, etc.) here.

    Recommended architecture:
    - PostgreSQL: Supabase (managed) or RDS
    - Redis: ElastiCache or Upstash
    - Backend: ECS Fargate or Fly.io
    - Frontend: Vercel or CloudFront + S3
  EOT
}
