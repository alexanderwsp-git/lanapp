# Use Bash
SHELL := /bin/bash

run:
	npm run dev
# Run the development server
start-dev:
	BUILD_TARGET=dev docker-compose up --build -d

restart-dev:
	docker-compose down && BUILD_TARGET=dev docker-compose up --build -d

logx:
	docker-compose logs -f

watch:
	docker-compose up -d

down:
	docker-compose down

mg:
	@if [ -z "$(name)" ]; then \
		echo "❌ You must provide a migration name like: make mg name=param"; \
		exit 1; \
	fi
	npm run migration:generate --name=$(name)

# Run pending migrations
mr:
	npm run migration:run

mrvt:
	npm run migration:revert

# Run everything (Generate Migration + Apply Migrations + Start Server)
setup:
	@if [ -z "$(name)" ]; then \
		echo "❌ You must provide a migration name like: make mg name=param"; \
		exit 1; \
	fi
	npm run migration:generate --name=$(name)
	npm run migration:run
	npm run dev


destroy:
	@echo "Deteniendo db..."
	docker-compose down
	@echo "removiendo volumen db..."


dvp:
	@echo "🔎 Finding unused Docker volumes..."
	@docker volume ls -q | while read volume; do \
		if ! docker ps -a --filter volume=$$volume --format '{{.Names}}' | grep -q .; then \
			echo "🗑 Removing unused volume: $$volume"; \
			docker volume rm $$volume; \
		fi; \
	done
	@echo "✅ All truly unused volumes removed."

zipit:
	zip -r auth.zip . -x "node_modules/*" "logs/*" "coverage/*" ".git/*"
