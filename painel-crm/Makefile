# Makefile — CRM BG Tech
.PHONY: dev build test lint migrate seed docker-up docker-down

dev:
	docker compose up -d
	@echo "✔ postgres:5432 | redis:6379 | backend:3001 | frontend:3000"

build:
	cd packages/backend && npm run build
	cd apps/frontend && npm run build

test:
	cd packages/backend && npm test
	cd apps/frontend && npm test

lint:
	cd packages/backend && npm run lint
	cd apps/frontend && npm run lint

migrate:
	cd packages/backend && npx prisma migrate dev

seed:
	cd packages/backend && npx prisma db seed

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down -v
