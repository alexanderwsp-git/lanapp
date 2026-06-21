SHELL := /bin/bash

UI_PORT ?= 3000
API_PORT ?= 4001

.PHONY: help install packages build build-all setup api ui kill-port kill-api kill-ui seed db db-down migrate migrate-revert

.DEFAULT_GOAL := help

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

clean:
	rm -rf node_modules
	rm -rf packages/domain/node_modules
	rm -rf packages/server/node_modules
	rm -rf lanapp/node_modules
	rm -rf auth/node_modules
	rm -rf lanapp-ui/node_modules

install: ## npm install (workspaces)
	npm install

packages: ## Build @sheep/domain and @sheep/server
	npm run build:packages

build: ## Build packages + lanapp + auth
	npm run build

build-all: ## Build packages + lanapp + auth + lanapp-ui
	npm run build:all

setup: install packages ## First-time dev setup

db: ## Start Postgres (docker compose in lanapp/)
	cd lanapp && docker compose up -d

db-down: ## Stop Postgres
	cd lanapp && docker compose down

migrate: ## Run pending lanapp DB migrations
	npm run migration:run -w lanapp

migrate-revert: ## Revert last lanapp migration
	npm run migration:revert -w lanapp

seed: ## Load demo fixtures into Postgres (npm run seed -w lanapp)
	npm run seed -w lanapp

api: ## Start lanapp API dev server (:4001)
	npm run dev:api

ui: ## Start lanapp-ui dev server (:3000)
	npm run dev:ui

kill-port: ## Kill process on PORT= (e.g. make kill-port PORT=3000)
ifndef PORT
	$(error Please provide a port, for example: make kill-port PORT=3000)
endif
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true

kill-api: ## Kill process on API port (:4001)
	$(MAKE) kill-port PORT=$(API_PORT)

kill-ui: ## Kill process on UI port (:3000)
	$(MAKE) kill-port PORT=$(UI_PORT)

api-run: kill-api api
	@echo "API running on port $(API_PORT)"

ui-run: kill-ui ui
	@echo "UI running on port $(UI_PORT)"