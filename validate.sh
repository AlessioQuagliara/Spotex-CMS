#!/bin/bash

# ========================================
# Validation Script - Verifica Setup
# ========================================

set -e

echo "🔍 Validazione setup Spotex CMS..."
echo ""

ERRORS=0

# Verifica file .env
echo "📋 Verifica file .env..."
if [ ! -f .env ]; then
    echo "❌ File .env non trovato!"
    echo "   Esegui: make setup"
    ERRORS=$((ERRORS+1))
else
    echo "✅ File .env presente"
    
    # Verifica variabili critiche
    if grep -q "your_secure_password_here" .env; then
        echo "⚠️  POSTGRES_PASSWORD non configurato!"
        ERRORS=$((ERRORS+1))
    fi
    
    if grep -q "your-very-long-and-secure-secret-key" .env; then
        echo "⚠️  JWT_SECRET_KEY non configurato!"
        ERRORS=$((ERRORS+1))
    fi
fi

# Verifica directory necessarie
echo ""
echo "📁 Verifica directory..."
DIRS=("backend/uploads" "ssl" "nginx/conf.d" "postgres/init.sql" "redis")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir presente"
    else
        echo "⚠️  $dir mancante (verrà creata al primo avvio)"
    fi
done

# Verifica file di configurazione
echo ""
echo "📄 Verifica file di configurazione..."
FILES=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "backend/Dockerfile"
    "backend/requirements.txt"
    "frontend/admin/Dockerfile"
    "frontend/render/Dockerfile"
    "nginx/nginx.conf"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file presente"
    else
        echo "❌ $file mancante!"
        ERRORS=$((ERRORS+1))
    fi
done

# Verifica Docker
echo ""
echo "🐳 Verifica Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker installato: $(docker --version)"
else
    echo "❌ Docker non installato!"
    ERRORS=$((ERRORS+1))
fi

if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose installato: $(docker-compose --version)"
else
    echo "❌ Docker Compose non installato!"
    ERRORS=$((ERRORS+1))
fi

# Verifica porte disponibili
echo ""
echo "🔌 Verifica porte disponibili..."
PORTS=(80 443 3000 3001 5432 6379 8000)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Porta $port già in uso"
    else
        echo "✅ Porta $port disponibile"
    fi
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Setup validato con successo!"
    echo ""
    echo "🚀 Puoi procedere con:"
    echo "   - make dev    (sviluppo)"
    echo "   - make prod   (produzione)"
else
    echo "❌ Trovati $ERRORS errori nella configurazione"
    echo ""
    echo "🔧 Risolvi i problemi e riesegui la validazione"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $ERRORS
