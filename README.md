# ⚡ SPOTEX CMS - E-Commerce Platform

<div align="center">

![SPOTEX Logo](https://img.shields.io/badge/SPOTEX-CMS-010f20?style=for-the-badge&logo=lightning)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat-square&logo=laravel)
![Filament](https://img.shields.io/badge/Filament-v3-1A73E8?style=flat-square&logo=php)
![Stripe](https://img.shields.io/badge/Stripe-Ready-008CDE?style=flat-square&logo=stripe)
![PayPal](https://img.shields.io/badge/PayPal-Ready-003087?style=flat-square&logo=paypal)

**Una piattaforma E-Commerce moderna e scalabile costruita con Laravel 11 e Filament PHP v3**

[Documentazione](#-documentazione) • [Installazione](#-installazione) • [Features](#-features) • [API](#-api) • [Deploy](#-deployment)

</div>

---

## 🎯 Features

### 🛍️ E-Commerce Core
- ✅ Gestione Prodotti con immagini multiple
- ✅ Categorie gerarchiche (parent-child)
- ✅ Carrello persistente con sessioni
- ✅ Sistema Ordini completo
- ✅ Tracciamento ordini in tempo reale

### 💳 Pagamenti
- ✅ **Stripe Checkout** - Pagamenti carta di credito
- ✅ **PayPal JavaScript SDK** - Pagamenti PayPal
- ✅ **Webhook Async** - Aggiornamento ordini asincrono
- ✅ **REST API Capture** - Cattura pagamenti PayPal

### 👨‍💼 Admin Panel (Filament)
- ✅ Dashboard con widget statistiche
- ✅ Grafico vendite mensili
- ✅ Gestione Prodotti con upload immagini
- ✅ Gestione Categorie (gerarchiche)
- ✅ Gestione Ordini (readonly una volta pagati)
- ✅ Filtri e ricerca avanzata
- ✅ Tema personalizzabile

### 🎨 Frontend
- ✅ Homepage responsive con Tailwind CSS
- ✅ Elenco prodotti con filtri
- ✅ Dettagli prodotto
- ✅ Carrello intuitivo
- ✅ Checkout multi-step
- ✅ Pagine successo/cancellazione

### 🔐 Sicurezza
- ✅ CSRF Protection
- ✅ Input Validation
- ✅ Authorization Check
- ✅ Webhook Signature Verification
- ✅ SSL/TLS Ready

---

## 📁 Struttura Progetto

```
Spotex-CMS/
├── app/
│   ├── Filament/
│   │   ├── Resources/         # Admin Resources
│   │   │   ├── CategoryResource.php
│   │   │   ├── ProductResource.php
│   │   │   └── OrderResource.php
│   │   ├── Pages/
│   │   └── Widgets/           # Dashboard Widgets
│   │       ├── MonthlySalesChart.php
│   │       └── OrderStats.php
│   ├── Http/Controllers/      # Business Logic
│   │   ├── PaymentController.php
│   │   ├── ProductController.php
│   │   ├── CartController.php
│   │   └── CheckoutController.php
│   ├── Models/                # Eloquent Models
│   │   ├── Product.php
│   │   ├── Category.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   └── ProductImage.php
│   └── Services/              # Business Services
│       ├── StripeService.php
│       └── PayPalService.php
├── database/
│   ├── migrations/            # Schema
│   └── seeders/              # Dummy Data
├── resources/
│   └── views/
│       ├── layouts/           # Master templates
│       ├── products/          # Product pages
│       ├── cart/              # Cart page
│       └── checkout/          # Checkout & Success
├── routes/
│   └── web.php               # All routes
├── config/
│   ├── services.php          # Payment config
│   └── filament.php          # Admin config
├── tests/                    # Test suite
│   └── Feature/PaymentFlowTest.php
├── INSTALLATION_GUIDE.md     # Setup guide
├── ARCHITECTURE.md           # Tech decisions
├── API_REFERENCE.md         # API docs
├── DEPLOYMENT.md            # Deploy guide
└── QUICK_REFERENCE.md       # Quick guide
```

---

## 🚀 Installazione Rapida

### Requisiti
- PHP 8.2+
- Laravel 11
- Composer
- Node.js
- MySQL 8.0+ / PostgreSQL

### Setup (5 minuti)

```bash
# 1. Clone & Install
git clone <repo>
cd Spotex-CMS
composer install
npm install

# 2. Environment
cp .env.example .env
php artisan key:generate

# 3. Database
# Configura DB in .env
php artisan migrate:fresh --seed
php artisan storage:link

# 4. Payment Credentials
# Aggiungi Stripe e PayPal keys in .env

# 5. Run
php artisan serve
npm run dev

# 6. Access
# Frontend: http://localhost:8000
# Admin: http://localhost:8000/admin
```

**Documentazione completa:** Vedi [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)

---

## 💡 Architettura

### Database Schema
```
Categories (hierarchical)
    └─ Products
        └─ ProductImages
    
Orders
    └─ OrderItems (pivot tra orders e products, con snapshot prezzo)
    
Users (1:many) Orders
```

### Payment Flow
```
1. User → Checkout
2. Frontend → Initialize Payment (Stripe/PayPal)
3. User → Payment Gateway
4. Gateway → Webhook
5. Backend → Update Order Status
6. User → Success Page
```

### Service Architecture
```
Controllers
    ↓
Services (StripeService, PayPalService)
    ↓
External APIs (Stripe, PayPal)
    ↓
Database (Orders, OrderItems)
```

Vedi [ARCHITECTURE.md](./ARCHITECTURE.md) per dettagli

---

## 🔗 API Endpoints

### Products (Public)
```
GET    /              - Homepage
GET    /prodotti      - Product listing
GET    /prodotto/{slug} - Product details
```

### Cart (Protected)
```
POST   /carrello/aggiungi    - Add item
GET    /carrello             - View cart
POST   /carrello/aggiorna    - Update quantity
POST   /carrello/rimuovi     - Remove item
```

### Payment (Protected)
```
POST   /pagamento/stripe/checkout    - Stripe session
POST   /pagamento/paypal/checkout    - PayPal order
POST   /pagamento/paypal/capture     - Capture payment
GET    /checkout/success/{order}    - Success page
GET    /checkout/cancel/{order}     - Cancel page
```

### Webhooks
```
POST   /api/webhooks/stripe    - Stripe events
POST   /api/webhooks/paypal    - PayPal events
```

Vedi [API_REFERENCE.md](./API_REFERENCE.md) per complete documentation

---

## 👨‍💼 Admin Panel Features

### Dashboard
- Statistiche ordini (totali, in sospeso, completati)
- Grafico vendite mensili
- Widget customizzabili

### Prodotti
- CRUD completo con validazione
- Upload immagini multiple
- Gestione categoria
- Toggle attivazione
- Filtri e ricerca

### Categorie
- Gerarchia parent-child
- Ordinamento
- Bulk operations

### Ordini
- Visualizzazione dettagli
- Stato pagamento (pending → paid → failed → refunded)
- Stato spedizione (not_shipped → shipped → delivered → returned)
- Campi readonly una volta pagati (tranne shipping status)
- Storico transazioni

---

## 🔐 Security Features

- ✅ **CSRF Protection**: Token validation su tutti i form
- ✅ **Input Validation**: Validazione richieste lato server
- ✅ **Authorization**: Controllo accesso risorse
- ✅ **Webhook Verification**: Firma validation Stripe/PayPal
- ✅ **Webhook Idempotency**: Deduplica eventi Stripe/PayPal con DB unique
- ✅ **Password Hashing**: bcrypt con Laravel
- ✅ **HTTPS Ready**: Configurazione SSL/TLS
- ✅ **Rate Limiting**: Protezione brute-force
- ✅ **SQL Injection Protection**: Eloquent ORM

---

## 📊 Database

### Tables
- `categories` - Categorie (con parent_id per gerarchie)
- `products` - Prodotti
- `product_images` - Immagini prodotti
- `orders` - Ordini (payment_status + shipping_status separati)
- `order_items` - Articoli ordine (prezzo storico)
- `users` - Utenti

### Relationships
```
User 1:N Orders
Order 1:N OrderItems
Product 1:N OrderItems
Category 1:N Products
Product 1:N ProductImages
```

---

## 🧪 Testing

```bash
# Run test suite
php artisan test

# Run specific test
php artisan test tests/Feature/PaymentFlowTest.php

# Coverage
php artisan test --coverage
```

Test Coverage:
- ✅ Payment flows (Stripe/PayPal)
- ✅ Order creation
- ✅ Cart operations
- ✅ Authorization
- ✅ Webhook processing

---

## 🚀 Deployment

### Supporta
- ✅ VPS Linux (Apache/Nginx)
- ✅ Cloud Providers (AWS, DigitalOcean, Heroku)
- ✅ Docker-ready
- ✅ CI/CD ready (GitHub Actions)

### Quick Deploy Checklist
```bash
# 1. Prepara server
ssh user@server.com

# 2. Clone & install
git clone <repo> /var/www/spotex-cms
cd /var/www/spotex-cms
composer install --optimize-autoloader --no-dev
npm run build

# 3. Configure
cp .env.example .env
php artisan key:generate

# 4. Database & migrations
php artisan migrate --force

# 5. Optimize
php artisan optimize
php artisan route:cache

# 6. Web server (nginx/apache)
# Vedi DEPLOYMENT.md
```

**Documentazione completa:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📚 Documentazione

| Documento | Contenuto |
|-----------|-----------|
| [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) | Setup e configurazione |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Decisioni architetturali |
| [API_REFERENCE.md](./API_REFERENCE.md) | Endpoint e payloads |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deploy production |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Quick guide |

---

## 🛠️ Tech Stack

### Backend
- **Laravel 11** - Web framework
- **Filament v3** - Admin panel
- **Eloquent ORM** - Database
- **Laravel Migrations** - Schema versioning

### Frontend
- **Blade Templates** - Server-side rendering
- **Tailwind CSS** - Styling
- **Vite** - Asset bundling
- **Alpine.js** (optional) - Interactivity

### Payments
- **Stripe API** - Carte di credito
- **PayPal SDK** - Pagamenti PayPal
- **Webhook Management** - Notifiche asincrone

### DevOps
- **Docker** (optional)
- **GitHub Actions** (CI/CD)
- **MySQL** - Database
- **Redis** (optional - caching)

---

## 🎯 Roadmap

### v1.1 (Q1 2026)
- [ ] Email notifications (order confirmation, shipping)
- [ ] Refunds management
- [ ] Advanced inventory management
- [ ] Discounts & coupons

### v1.2 (Q2 2026)
- [ ] Product reviews & ratings
- [ ] Wishlist feature
- [ ] User account dashboard
- [ ] Multiple languages

### v2.0 (Q3 2026)
- [ ] GraphQL API
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Shipping integration
- [ ] Subscription products

---

## 🤝 Contribuire

1. Fork il repository
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

---

## 📞 Support

- 📧 Email: support@spotex.com
- 💬 Issues: GitHub Issues
- 📚 Docs: Vedi cartella `/docs`
- 🐛 Bugs: Report su GitHub

---

## 📄 Licenza

Questo progetto è licensato sotto MIT License - vedi [LICENSE](./LICENSE) per dettagli

---

## 👥 Autore

**Spotex SRL** - Senior Full Stack Developer
- Laravel Specialist
- Filament Expert
- Payment Integration Expert

---

<div align="center">

**⚡ Built with ⚡ for Performance and Maintainability**

[Torna su](#-spotex-cms---e-commerce-platform)

</div>

---

**Version:** 1.0.0
**Status:** Production Ready ✅
**Last Updated:** Gennaio 2026
