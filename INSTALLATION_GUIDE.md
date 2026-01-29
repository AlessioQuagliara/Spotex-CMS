# 🚀 SPOTEX CMS - Guida Installazione e Setup

## Requisiti Minimi
- PHP 8.2+
- Laravel 11
- Composer
- Node.js e npm
- Database MySQL/PostgreSQL

---

## 📦 INSTALLAZIONE

### 1️⃣ Inizializzazione Progetto Laravel

```bash
# Clone il repo
git clone <your-repo>
cd Spotex-CMS

# Installa dipendenze PHP
composer install

# Installa dipendenze Node.js
npm install

# Copia il file .env
cp .env.example .env

# Genera la chiave applicazione
php artisan key:generate
```

### 2️⃣ Configurazione Database

Modifica il file `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=spotex_cms
DB_USERNAME=root
DB_PASSWORD=
```

Poi esegui:

```bash
# Crea il database
php artisan migrate:fresh

# (Opzionale) Esegui i seed
php artisan db:seed
```

---

## 💳 CONFIGURAZIONE PAGAMENTI

### Stripe

1. **Ottieni le credenziali** da [https://dashboard.stripe.com](https://dashboard.stripe.com)

2. **Aggiungi al file `.env`**:
```env
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

3. **Configura il webhook** in Stripe Dashboard:
   - Events to send: `checkout.session.completed`, `payment_intent.succeeded`
   - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`

### PayPal

1. **Ottieni le credenziali** da [https://developer.paypal.com](https://developer.paypal.com)

2. **Aggiungi al file `.env`**:
```env
PAYPAL_CLIENT_ID=YOUR_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=YOUR_WEBHOOK_ID_HERE
```

3. **Configura il webhook** in PayPal Dashboard:
   - Endpoint URL: `https://yourdomain.com/api/webhooks/paypal`
   - Events: `PAYMENT.CAPTURE.COMPLETED`
   - Salva il `Webhook ID` e mettilo in `PAYPAL_WEBHOOK_ID`

---

## 📊 FILAMENT SETUP

### Installa Filament (se non già installato)

```bash
composer require filament/filament

php artisan filament:install --panels
```

### Registra le Resources

Le resources sono già create. Verifica che il Panel sia configurato in:
`app/Filament/AdminPanelProvider.php`

Accedi al pannello admin:
```
https://yourdomain.com/admin
```

---

## 🎨 BUILD FRONTEND (Tailwind + Vite)

```bash
# Development
npm run dev

# Production
npm run build
```

---

## 📝 ARTISAN COMMANDS ESSENZIALI

### Migrazioni

```bash
# Esegui tutte le migrazioni
php artisan migrate

# Rollback ultimo batch
php artisan migrate:rollback

# Rollback tutto e ricrea
php artisan migrate:fresh

# Refresca e esegui i seed
php artisan migrate:fresh --seed
```

### Creazione Modelli e Risorse (per futuri sviluppi)

```bash
# Crea un Model con Migration
php artisan make:model ModelName -m

# Crea un Controller
php artisan make:controller ControllerName

# Crea una Filament Resource
php artisan make:filament-resource ResourceName
```

### Cache e Ottimizzazione

```bash
# Svuota cache applicazione
php artisan cache:clear

# Svuota cache config
php artisan config:clear

# Ottimizza l'app per produzione
php artisan optimize:clear

# Carica le rotte in cache
php artisan route:cache
```

### Storage e File Upload

```bash
# Crea link simbolico storage
php artisan storage:link
```

### Database

```bash
# Crea un seeder
php artisan make:seeder CategorySeeder

# Esegui i seeder
php artisan db:seed
```

---

## 🔧 CONFIGURAZIONE PERSONALIZZATA

### Aggiungere un Nuovo Prodotto via Admin

1. Accedi a `/admin` con credenziali admin
2. Vai su "Prodotti"
3. Clicca "Crea Prodotto"
4. Compila i campi:
   - **Nome**: Nome del prodotto
   - **Slug**: URL-friendly (auto-generato)
   - **Descrizione**: Testo descrittivo
   - **Categoria**: Seleziona categoria
   - **Prezzo**: Prezzo in EUR
   - **Stock**: Quantità disponibile
   - **Immagini**: Upload multiple immagini (per ogni immagine puoi marcare quale è principale)
   - **Attivo**: Toggle per attivare/disattivare il prodotto

### Gestione Ordini

1. Vai su "Ordini" nel pannello admin
2. **Ordini in Sospeso (pending)**: Campi modificabili
3. **Ordini Pagati (paid)**: Solo lo stato spedizione è modificabile
4. Stati disponibili:
   - Payment: `pending` → `paid` → `failed` → `refunded`
   - Shipping: `not_shipped` → `shipped` → `delivered` → `returned`

### Dashboard Widget

Il widget "Vendite Mensili" mostra:
- Grafico a linea con vendite mensili
- Solo ordini con payment_status = 'paid'
- Aggiornato automaticamente

---

## 🛠️ TROUBLESHOOTING

### Errore: "CSRF Token Mismatch" nei webhook

I webhook sono configurati per escludere la verifica CSRF. Se ricevi errore:

```php
// In bootstrap/app.php (Laravel 11+)
$middleware->validateCsrfTokens(except: [
   'api/webhooks/stripe',
   'api/webhooks/paypal',
]);
```

### Immagini non si caricano

```bash
# Assicurati che lo storage link sia creato
php artisan storage:link

# Verifica permessi
chmod -R 755 storage/app/public
```

### Pagamento Stripe fallisce

1. Verifica che le credenziali siano corrette in `.env`
2. Controlla i log: `storage/logs/laravel.log`
3. Assicurati che il webhook secret sia configurato

### PayPal non funziona

1. Assicurati di essere in modalità `sandbox` durante lo sviluppo
2. Verifica i log per errori di autenticazione
3. Controlla le credenziali API REST

---

## 📧 NOTIFICHE EMAIL (Opzionale)

Configura i servizi email nel `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=465
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@spotex.com
```

Poi crea una notifica:

```bash
php artisan make:notification OrderConfirmation
```

---

## 🔐 SICUREZZA - CHECKLIST PRODUZIONE

- [ ] Imposta `APP_DEBUG=false` in `.env`
- [ ] Imposta `APP_ENV=production` in `.env`
- [ ] Usa HTTPS su tutte le pagine
- [ ] Configura le rate limits per i webhook
- [ ] Abilita il CORS se necessario
- [ ] Proteggi le credenziali in variabili d'ambiente
- [ ] Configura backup del database
- [ ] Monitora i log per errori

---

## 📚 STRUTTURA CARTELLE

```
Spotex-CMS/
├── app/
│   ├── Filament/
│   │   ├── Resources/
│   │   │   ├── CategoryResource.php
│   │   │   ├── ProductResource.php
│   │   │   └── OrderResource.php
│   │   └── Widgets/
│   │       ├── MonthlySalesChart.php
│   │       └── OrderStats.php
│   ├── Http/Controllers/
│   │   ├── PaymentController.php
│   │   ├── ProductController.php
│   │   ├── CartController.php
│   │   └── CheckoutController.php
│   ├── Models/
│   │   ├── Product.php
│   │   ├── Category.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   └── ProductImage.php
│   └── Services/
│       ├── StripeService.php
│       └── PayPalService.php
├── database/
│   └── migrations/
│       ├── 2024_01_01_000001_create_categories_table.php
│       ├── 2024_01_01_000002_create_products_table.php
│       ├── 2024_01_01_000003_create_product_images_table.php
│       ├── 2024_01_01_000004_create_orders_table.php
│       └── 2024_01_01_000005_create_order_items_table.php
├── resources/
│   └── views/
│       ├── layouts/
│       │   └── app.blade.php
│       ├── products/
│       │   ├── index.blade.php
│       │   └── show.blade.php
│       ├── cart/
│       │   └── show.blade.php
│       └── checkout/
│           ├── index.blade.php
│           ├── success.blade.php
│           └── cancel.blade.php
└── routes/
    └── web.php
```

---

## 🚀 DEPLOYMENT (Vercel/Heroku/VPS)

### Per VPS Linux (Apache/Nginx)

1. **Copia i file del progetto**
2. **Installa dipendenze**:
   ```bash
   composer install --optimize-autoloader --no-dev
   npm run build
   ```

3. **Configura il server web** (root: `/public`)

4. **Imposta permessi**:
   ```bash
   chmod -R 755 storage bootstrap/cache
   chown -R www-data:www-data .
   ```

5. **Esegui le migrazioni**:
   ```bash
   php artisan migrate --force
   ```

---

## 📞 SUPPORTO E RISORSE

- **Laravel Docs**: https://laravel.com/docs
- **Filament Docs**: https://filamentphp.com/docs
- **Stripe API**: https://stripe.com/docs/api
- **PayPal Docs**: https://developer.paypal.com/docs

---

**SPOTEX CMS v1.0** - Creato con ⚡ per il massimo delle prestazioni
