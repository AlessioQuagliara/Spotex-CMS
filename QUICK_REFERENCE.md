# ⚡ SPOTEX CMS - QUICK REFERENCE GUIDE

## 🚀 QUICK START (5 minuti)

```bash
# 1. Setup iniziale
cd Spotex-CMS
composer install
npm install
cp .env.example .env
php artisan key:generate

# 2. Database
php artisan migrate:fresh --seed

# 3. Storage link
php artisan storage:link

# 4. Dev server
php artisan serve
npm run dev

# 5. Accedi a:
# - Frontend: http://localhost:8000
# - Admin: http://localhost:8000/admin
```

---

## 📍 URLS PRINCIPALI

| URL | Descrizione | Auth |
|-----|-------------|------|
| `/` | Homepage con prodotti | No |
| `/prodotti` | Elenco prodotti | No |
| `/prodotto/{slug}` | Dettagli prodotto | No |
| `/carrello` | Carrello acquisti | Sì |
| `/checkout` | Pagina checkout | Sì |
| `/checkout/success/{id}` | Successo pagamento | Sì |
| `/api/webhooks/stripe` | Webhook Stripe | No CSRF |
| `/api/webhooks/paypal` | Webhook PayPal | No CSRF |
| `/admin` | Pannello admin Filament | Sì (admin) |
| `/admin/categories` | Gestione categorie | Sì (admin) |
| `/admin/products` | Gestione prodotti | Sì (admin) |
| `/admin/orders` | Gestione ordini | Sì (admin) |

---

## 🎯 TASK COMUNI

### Aggiungere un Prodotto
```bash
# Via Admin Panel (GUI)
1. Vai a /admin/products
2. Clicca "Create Product"
3. Compila i dati e salva

# Via Seeder (bulk)
1. Modifica database/seeders/ProductSeeder.php
2. Esegui: php artisan db:seed --class=ProductSeeder
```

### Creare una Categoria
```bash
# Via Admin Panel
1. Vai a /admin/categories
2. Clicca "Create Category"
3. Nome, Slug, Descrizione opzionale

# Categorie Gerarchiche
- Seleziona "Categoria Genitore" per sottocategorie
```

### Tracciare un Pagamento
```bash
# Log file
cat storage/logs/laravel.log

# Cerca "PayPal captured" o "Stripe webhook"
grep -i "payment" storage/logs/laravel.log | tail -20
```

### Reset Password Admin
```bash
# Crea nuovo utente admin
php artisan tinker
>>> User::create(['name' => 'Admin', 'email' => 'admin@spotex.com', 'password' => bcrypt('password')])
```

---

## 🔑 VARIABILI AMBIENTE ESSENZIALI

```env
# App
APP_NAME="SPOTEX CMS"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_DATABASE=spotex_cms
DB_USERNAME=root
DB_PASSWORD=

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
```

---

## 📁 FILE STRUCTURE REFERENCE

```
app/
├── Models/
│   ├── Product.php
│   ├── Order.php
│   ├── Category.php
│   ├── OrderItem.php
│   └── ProductImage.php
├── Services/
│   ├── StripeService.php
│   └── PayPalService.php
├── Http/Controllers/
│   ├── PaymentController.php
│   ├── ProductController.php
│   ├── CartController.php
│   └── CheckoutController.php
└── Filament/
    ├── Resources/
    │   ├── ProductResource.php
    │   ├── CategoryResource.php
    │   └── OrderResource.php
    └── Widgets/
        ├── MonthlySalesChart.php
        └── OrderStats.php
```

---

## 🐛 DEBUGGING

### Attiva debug mode
```env
APP_DEBUG=true
```

### Visualizza query SQL
```php
\DB::enableQueryLog();
// ... codice ...
dd(\DB::getQueryLog());
```

### Tinker (REPL)
```bash
php artisan tinker

# Esempi
>>> Product::all()
>>> Order::with('items')->find(1)
>>> Category::tree()
```

### Test webhook
```bash
# Stripe
curl -X POST http://localhost:8000/api/webhooks/stripe \
  -H "Stripe-Signature: test" \
  -d '{"type":"checkout.session.completed"}'

# PayPal
curl -X POST http://localhost:8000/api/webhooks/paypal \
  -H "PayPal-Transmission-Sig: test" \
  -d '{"event_type":"CHECKOUT.ORDER.COMPLETED"}'
```

---

## ✅ CHECKLISTS

### Deployment
- [ ] `.env` configurato per produzione
- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] Database migrato
- [ ] Storage link creato
- [ ] HTTPS abilitato
- [ ] Webhooks configurati nei servizi
- [ ] Backup database pianificato
- [ ] Error tracking configurato

### Testing
- [ ] Pagamento Stripe completato
- [ ] Pagamento PayPal completato
- [ ] Ordine salvo nel database
- [ ] Email di conferma inviata
- [ ] Webhook ricevuto e elaborato
- [ ] Status ordine aggiornato
- [ ] Immagini caricate correttamente
- [ ] Carrello funziona bene

### Security
- [ ] Credenziali in .env (non in codice)
- [ ] CSRF token su tutti i form
- [ ] Rate limiting sui webhook
- [ ] Validazione input ovunque
- [ ] Autorizzazione verificata
- [ ] SSL/TLS abilitato
- [ ] Database password sicura
- [ ] Log errors monitorate

---

## 📦 COMANDI FREQUENTI

```bash
# Database
php artisan migrate                    # Esegui migrazioni
php artisan migrate:fresh --seed       # Reset e seed
php artisan migrate:rollback           # Rollback ultimo batch

# Cache
php artisan cache:clear                # Svuota cache
php artisan config:clear               # Svuota config

# Storage
php artisan storage:link               # Crea symlink

# Development
php artisan serve                      # Dev server
npm run dev                            # Vite dev server
npm run build                          # Build production

# Production
php artisan optimize                   # Cache routes/config
php artisan route:cache                # Cache routes
composer install --optimize-autoloader # Optimize

# Seeding
php artisan db:seed                    # Tutti i seeder
php artisan db:seed --class=CategorySeeder  # Specifico

# Filament
php artisan make:filament-resource Product  # Nuova resource
php artisan filament:install --panels # Setup Filament

# Tinker
php artisan tinker                     # REPL interattivo
```

---

## 🎨 COLOR SCHEME

**Brand Colors**
- Primary: `#010f20` (Blue Navy)
- Secondary: White
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Danger: `#ef4444` (Red)

**Tailwind Palette**
```html
<!-- Primary Button -->
<button class="bg-[#010f20] text-white">Button</button>

<!-- Secondary -->
<div class="bg-white border-2 border-[#010f20]">Card</div>

<!-- Status Colors -->
<span class="text-green-600">✓ Pagato</span>
<span class="text-yellow-600">⚠ In Sospeso</span>
<span class="text-red-600">✕ Annullato</span>
```

---

## 💡 TIPS & TRICKS

### Slug Auto-Generation
```php
TextInput::make('name')
    ->live()
    ->afterStateUpdated(fn($state, $set) => $set('slug', str()->slug($state)))
```

### Disabling Fields Conditionally
```php
TextInput::make('status')
  ->disabled(fn($record) => $record && $record->payment_status !== 'pending')
```

### Eager Loading
```php
$orders = Order::with('items.product', 'user')->paginate();
```

### Formatting Money
```php
// In Blade
€{{ number_format($price, 2, ',', '.') }}

// In Model
protected $casts = ['price' => 'decimal:2'];
```

---

## 🔗 LINK UTILI

- **Laravel Docs**: https://laravel.com/docs/11
- **Filament Docs**: https://filamentphp.com
- **Stripe API**: https://stripe.com/docs/api
- **PayPal Docs**: https://developer.paypal.com/docs
- **Tailwind CSS**: https://tailwindcss.com
- **Vite**: https://vitejs.dev

---

## 🆘 COMMON ISSUES

| Problema | Soluzione |
|----------|-----------|
| "Class not found" | `composer dump-autoload` |
| Immagini non visibili | `php artisan storage:link` |
| CSRF token mismatch | Escludi URI in bootstrap/app.php (validateCsrfTokens) |
| Database locked | Chiudi altre connessioni o reset |
| Webpack errors | `npm install` e `npm run build` |
| Payment failed | Controlla credenziali .env e webhook |
| 404 in admin | Assicurati che User sia admin |

---

**Last Updated**: Gennaio 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
