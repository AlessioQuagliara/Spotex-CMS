#!/bin/bash

# ========================================
# Deploy Script per Produzione
# ========================================

set -e

echo "🚀 Deploy Spotex CMS in Produzione"
echo ""

# Verifica che .env sia configurato
if [ ! -f .env ]; then
    echo "❌ File .env non trovato!"
    echo "Copia .env.example in .env e configuralo prima di procedere."
    exit 1
fi

# Verifica variabili critiche
if grep -q "your-very-long-and-secure-secret-key" .env; then
    echo "❌ JWT_SECRET_KEY non configurato in .env!"
    exit 1
fi

if grep -q "your_secure_password_here" .env; then
    echo "❌ POSTGRES_PASSWORD non configurato in .env!"
    exit 1
fi

# Backup del database (se esiste)
if [ -d "postgres_data" ]; then
    echo "💾 Backup database..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    docker-compose exec -T postgres pg_dump -U postgres spotex_cms_db > "backup_${timestamp}.sql" || true
fi

# Pull delle immagini aggiornate
echo "📥 Pull delle immagini Docker..."
docker-compose pull

# Build delle immagini custom
echo "🔨 Build delle immagini..."
docker-compose build --no-cache

# Stop dei servizi esistenti
echo "⏸️  Stop dei servizi esistenti..."
docker-compose down

# Avvio dei nuovi servizi
echo "▶️  Avvio dei nuovi servizi..."
docker-compose up -d

# Attendi che i servizi siano pronti
echo "⏳ Attesa che i servizi siano pronti..."
sleep 10

# Verifica health
echo "🏥 Verifica health dei servizi..."
curl -f http://localhost:8000/health || echo "⚠️  Backend non risponde"
curl -f http://localhost:80/health || echo "⚠️  Nginx non risponde"

# Mostra lo stato
echo ""
echo "📊 Stato dei servizi:"
docker-compose ps

echo ""
echo "✅ Deploy completato!"
echo ""
echo "🌐 URLs:"
echo "  - Nginx Gateway: http://localhost"
echo "  - Admin Panel:   http://localhost/admin"
echo "  - API:           http://localhost/api"
echo ""
echo "📝 Log: docker-compose logs -f"
echo ""
