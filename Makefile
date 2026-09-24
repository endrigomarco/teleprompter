SHELL := /bin/sh
.DEFAULT_GOAL := help
COMPOSE := docker compose
TEST_COMPOSE := docker compose --project-name interview-teleprompter-tests --project-directory . -f docker/compose.test.yaml
.PHONY: help env install config build up down restart status logs db-up db-migrate db-seed db-export db-backup mcp-setup dev test integration-test typecheck format format-check check check-all check-docker check-env

help:
	@printf '%s\n' \
	  'Interview Copilot' \
	  '' \
	  'Ambiente e aplicação:' \
	  '  make env               Cria .env de exemplo, somente se ainda não existir' \
	  '  make config            Valida os dois arquivos Compose sem exibir segredos' \
	  '  make build             Compila a imagem da aplicação, sem iniciar serviços' \
	  '  make up                Compila e inicia app e banco; aplica migrações e seed' \
	  '  make down              Para a aplicação e preserva o volume de dados' \
	  '  make restart           Reinicia o app com a configuração atual' \
	  '  make status            Mostra os serviços da aplicação' \
	  '  make logs              Acompanha logs do app' \
	  '' \
	  'Banco e integração:' \
	  '  make db-up             Inicia somente o banco da aplicação' \
	  '  make db-migrate        Aplica migrações no banco da aplicação' \
	  '  make db-seed           Executa importação inicial, se pendente' \
	  '  make db-export         Exporta dados ativos em JSON para backups/' \
	  '  make db-backup         Cria dump completo, incluindo histórico, em backups/' \
	  '  make mcp-setup         Gera credenciais locais; requer Node.js 24 e yarn install --immutable' \
	  '' \
	  'Qualidade em containers, sem Node no computador:' \
	  '  make test              Testes sem banco' \
	  '  make integration-test  Testes com banco descartável separado' \
	  '  make typecheck         Verificação TypeScript' \
	  '  make format-check      Conferência de formatação' \
	  '  make check             config, testes, tipos, formatação, integração e build' \
	  '  make check-all         Mesmo fluxo de make check' \
	  '' \
	  'Desenvolvimento no computador, com Node.js 24:' \
	  '  make install           yarn install --immutable' \
	  '  make dev               Inicia o banco e o Next.js local; porta 8765 deve estar livre' \
	  '  make format            Formata os arquivos locais' \
	  '' \
	  'Execute na raiz do projeto. Requer Make e Docker Compose.'

check-docker:
	@command -v docker >/dev/null 2>&1 || { echo 'Docker não encontrado.'; exit 1; }
	@docker compose version >/dev/null 2>&1 || { echo 'Docker Compose não encontrado.'; exit 1; }
	@docker info >/dev/null 2>&1 || { echo 'Inicie o Docker antes de continuar.'; exit 1; }

check-env:
	@test -f .env || { echo 'Execute make env e configure as credenciais em .env.'; exit 1; }

env:
	@if test -e .env; then echo '.env existente preservado.'; else cp .env.example .env && chmod 600 .env && echo '.env criado. Configure as credenciais antes de iniciar.'; fi

install:
	yarn install --immutable

config: check-docker check-env
	@$(COMPOSE) --profile full config --quiet
	@$(TEST_COMPOSE) config --quiet
	@echo 'Arquivos Compose válidos.'

build: check-docker
	docker build --target runtime -f docker/app/Dockerfile -t interview-teleprompter-app .

up: check-docker check-env
	$(COMPOSE) --profile full up -d --build --wait

down: check-docker check-env
	$(COMPOSE) --profile full down

restart: check-docker check-env
	$(COMPOSE) --profile full up -d --force-recreate --wait app

status: check-docker check-env
	$(COMPOSE) --profile full ps

logs: check-docker check-env
	$(COMPOSE) logs --follow --tail=100 app

db-up: check-docker check-env
	$(COMPOSE) up -d --wait db

db-migrate: check-docker check-env
	@$(MAKE) build
	@$(MAKE) db-up
	$(COMPOSE) --profile full run --rm --no-deps --entrypoint yarn app db:migrate

db-seed: db-migrate
	$(COMPOSE) --profile full run --rm --no-deps --entrypoint yarn app db:seed

db-export: check-docker check-env
	@$(MAKE) build
	@$(MAKE) db-up
	@mkdir -p backups
	$(COMPOSE) --profile full run --rm --no-deps --user "$$(id -u):$$(id -g)" --volume "$(CURDIR)/backups:/app/backups" --entrypoint yarn app db:export

db-backup: check-docker check-env
	@$(MAKE) db-up
	@sh docker/backup.sh

mcp-setup: check-env
	yarn mcp:setup

dev: check-docker check-env
	yarn setup
	yarn dev

test: check-docker
	$(TEST_COMPOSE) run --build --rm --no-deps tests yarn test

typecheck: check-docker
	$(TEST_COMPOSE) run --build --rm --no-deps tests yarn typecheck

format-check: check-docker
	$(TEST_COMPOSE) run --build --rm --no-deps tests yarn format:check

format:
	yarn format

integration-test: check-docker
	@set -eu; \
	trap '$(TEST_COMPOSE) down --remove-orphans' EXIT; \
	trap 'exit 1' HUP INT TERM; \
	$(TEST_COMPOSE) build tests; \
	$(TEST_COMPOSE) up -d --wait test-db; \
	$(TEST_COMPOSE) run --rm --no-deps tests yarn test:integration

check: check-all

check-all:
	@$(MAKE) config
	@$(MAKE) test
	@$(MAKE) typecheck
	@$(MAKE) format-check
	@$(MAKE) integration-test
	@$(MAKE) build
