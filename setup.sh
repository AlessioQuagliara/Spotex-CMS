#!/bin/bash

# ========================================
# SPOTEX CMS - Setup Script
# ========================================
# Script per configurare l'ambiente di sviluppo

set -e

echo "🚀 Configurazione Spotex CMS..."

# Controlla se .env esiste
if [ ! -f .env ]; then
    echo "📝 Creazione file .env da .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Modifica il file .env con le tue configurazioni!"
else
    echo "✅ File .env già presente"
fi

# Crea directory necessarie
echo "📁 Creazione directory..."
mkdir -p backend/uploads
mkdir -p ssl
mkdir -p nginx/conf.d
mkdir -p postgres/init.sql

# Genera JWT secret se non presente nel .env
if grep -q "your-very-long-and-secure-secret-key" .env; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo "🔐 Generazione JWT secret..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-very-long-and-secure-secret-key-change-in-production/$JWT_SECRET/" .env
    else
        sed -i "s/your-very-long-and-secure-secret-key-change-in-production/$JWT_SECRET/" .env
    fi
fi

echo ""
echo "✅ Setup completato!"
echo ""
echo "📋 Prossimi passi:"
echo "  1. Verifica le configurazioni in .env"
echo "  2. Per sviluppo: docker-compose -f docker-compose.dev.yml up --build"
echo "  3. Per produzione: docker-compose up --build -d"
echo ""
echo "🌐 URLs:"
echo "  - Backend API:    http://localhost:8000"
echo "  - Admin Panel:    http://localhost:3000"
echo "  - Public Site:    http://localhost:3001"
echo "  - Nginx Gateway:  http://localhost:80"
echo "  - PostgreSQL:     localhost:5432"
echo "  - Redis:          localhost:6379"
echo ""
