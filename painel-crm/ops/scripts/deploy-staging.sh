#!/bin/bash
set -euo pipefail

echo "🚀 Deploying CRM BG Tech to staging..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ docker required"; exit 1; }

# Build
echo "📦 Building images..."
docker compose build

# Deploy
echo "🔄 Deploying..."
docker compose up -d

# Run migrations
echo "🗃️ Running migrations..."
docker compose exec -T backend npx prisma migrate deploy

# Seed (optional — only for fresh deploy)
if [ "${SEED:-false}" = "true" ]; then
  echo "🌱 Seeding database..."
  docker compose exec -T backend npx prisma db seed
fi

echo "✅ Deployment complete!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:3001/api/docs"
