# Plaasboek™ — Makefile

.PHONY: install dev test lint migrate docker-up docker-down

install:
	npm install
	cd api && npm install

dev:
	docker-compose up -d
	npm run dev

test:
	npm test

lint:
	npm run lint

migrate:
	npm run migrate

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f api

db-shell:
	docker-compose exec db psql -U vcds_user -d vcds_plaasboek_dev

build-prod:
	docker build -t vcds-plaasboek:latest .
