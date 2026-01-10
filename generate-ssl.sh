#!/bin/bash

# ========================================
# Generate Self-Signed SSL Certificate
# ========================================
# Script per generare certificati SSL auto-firmati per sviluppo

set -e

SSL_DIR="./ssl"
DAYS_VALID=365
DOMAIN="localhost"

echo "🔐 Generazione certificati SSL auto-firmati..."

# Crea directory SSL se non esiste
mkdir -p "$SSL_DIR"

# Genera chiave privata
echo "📝 Generazione chiave privata..."
openssl genrsa -out "$SSL_DIR/key.pem" 2048

# Genera CSR (Certificate Signing Request)
echo "📝 Generazione CSR..."
openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.csr" \
    -subj "/C=IT/ST=Italy/L=City/O=Spotex/OU=Development/CN=$DOMAIN"

# Genera certificato auto-firmato
echo "📝 Generazione certificato auto-firmato..."
openssl x509 -req -days $DAYS_VALID \
    -in "$SSL_DIR/cert.csr" \
    -signkey "$SSL_DIR/key.pem" \
    -out "$SSL_DIR/cert.pem" \
    -extfile <(printf "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN,DNS:*.localhost,IP:127.0.0.1")

# Genera Diffie-Hellman parameters per maggiore sicurezza
echo "📝 Generazione DH parameters (può richiedere qualche minuto)..."
openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048

# Pulisci file temporanei
rm "$SSL_DIR/cert.csr"

# Imposta permessi corretti
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"
chmod 644 "$SSL_DIR/dhparam.pem"

echo ""
echo "✅ Certificati SSL generati con successo!"
echo ""
echo "📁 File generati in $SSL_DIR/:"
ls -lh "$SSL_DIR"
echo ""
echo "⚠️  ATTENZIONE: Questi sono certificati auto-firmati per SVILUPPO."
echo "   Per PRODUZIONE usa certificati da Let's Encrypt o un'altra CA."
echo ""
echo "📋 Per usare SSL, decommenta la configurazione in nginx/conf.d/ssl.conf.example"
echo "   e rinominalo in ssl.conf"
echo ""
