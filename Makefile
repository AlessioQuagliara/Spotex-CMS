# ========================================
# SPOTEX CMS - Makefile
# ========================================
# Comandi utili per gestire il progetto

.PHONY: help setup build up down logs clean dev prod restart

# Colori per output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Mostra questo messaggio di aiuto
	@echo "$(BLUE)Spotex CMS - Comandi Disponibili$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

setup: ## Configura l'ambiente (crea .env, directory, ecc.)
	@echo "$(BLUE)Configurazione ambiente...$(NC)"
	@chmod +x setup.sh
	@./setup.sh

build: ## Build di tutti i container
	@echo "$(BLUE)Build dei container...$(NC)"
	docker-compose build

up: ## Avvia tutti i servizi (produzione)
	@echo "$(BLUE)Avvio servizi in modalità produzione...$(NC)"
	docker-compose up -d

down: ## Ferma tutti i servizi
	@echo "$(YELLOW)Arresto servizi...$(NC)"
	docker-compose down

logs: ## Mostra i log di tutti i servizi
	docker-compose logs -f

logs-backend: ## Mostra i log del backend
	docker-compose logs -f backend

logs-admin: ## Mostra i log del frontend admin
	docker-compose logs -f frontend-admin

logs-render: ## Mostra i log del frontend render
	docker-compose logs -f frontend-render

dev: ## Avvia in modalità sviluppo (hot reload)
	@echo "$(BLUE)Avvio in modalità sviluppo...$(NC)"
	docker-compose -f docker-compose.dev.yml up --build

dev-down: ## Ferma i servizi di sviluppo
	docker-compose -f docker-compose.dev.yml down

prod: build up ## Build e avvio in produzione

restart: down up ## Riavvia tutti i servizi

clean: ## Rimuove container, volumi e immagini
	@echo "$(YELLOW)Pulizia completa...$(NC)"
	docker-compose down -v --rmi all
	rm -rf backend/uploads/*
	rm -rf backend/__pycache__
	rm -rf backend/app/**/__pycache__

clean-dev: ## Rimuove container e volumi di sviluppo
	docker-compose -f docker-compose.dev.yml down -v

ps: ## Mostra lo stato dei container
	docker-compose ps

shell-backend: ## Apri shell nel container backend
	docker-compose exec backend /bin/bash

shell-db: ## Apri psql nel database
	docker-compose exec postgres psql -U postgres -d spotex_cms_db

migrate: ## Esegui le migrazioni del database
	docker-compose exec backend alembic upgrade head

migrate-create: ## Crea una nuova migrazione (uso: make migrate-create MSG="descrizione")
	docker-compose exec backend alembic revision --autogenerate -m "$(MSG)"

test-backend: ## Esegui i test del backend
	docker-compose exec backend pytest

install-backend: ## Installa dipendenze backend
	docker-compose exec backend pip install -r requirements.txt

install-admin: ## Installa dipendenze frontend admin
	docker-compose exec frontend-admin npm install

install-render: ## Installa dipendenze frontend render
	docker-compose exec frontend-render npm install

health: ## Verifica lo stato di salute dei servizi
	@echo "$(BLUE)Controllo health dei servizi...$(NC)"
	@curl -s http://localhost:8000/health && echo "✅ Backend OK" || echo "❌ Backend DOWN"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Admin OK" || echo "❌ Admin DOWN"
	@curl -s http://localhost:3001 > /dev/null && echo "✅ Render OK" || echo "❌ Render DOWN"
	@curl -s http://localhost:80/health && echo "✅ Nginx OK" || echo "❌ Nginx DOWN"

ssl: ## Genera certificati SSL auto-firmati per sviluppo
	@echo "$(BLUE)Generazione certificati SSL...$(NC)"
	@chmod +x generate-ssl.sh
	@./generate-ssl.sh

backup-db: ## Backup del database PostgreSQL
	@echo "$(BLUE)Backup database...$(NC)"
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U postgres spotex_cms_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup completato in backups/$(NC)"

restore-db: ## Ripristina database (uso: make restore-db FILE=backup.sql)
	@echo "$(YELLOW)Ripristino database da $(FILE)...$(NC)"
	@docker-compose exec -T postgres psql -U postgres spotex_cms_db < $(FILE)

stats: ## Mostra statistiche dei container
	@docker stats --no-stream

volumes: ## Lista tutti i volumi
	@docker volume ls --filter label=com.spotex.cms.volume

prune: ## Rimuove container, immagini e volumi non utilizzati
	@echo "$(YELLOW)Pulizia risorse Docker non utilizzate...$(NC)"
	@docker system prune -af --volumes

update: ## Aggiorna le immagini Docker
	@echo "$(BLUE)Aggiornamento immagini Docker...$(NC)"
	@docker-compose pull
	@docker-compose build --pull
