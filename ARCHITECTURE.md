# SPOTEX CMS - ARCHITETTURA E BEST PRACTICES

## 🏗️ ARCHITETTURA GENERALE

### Layer Separation
```
Frontend (Blade Templates + Tailwind CSS)
         ↓
Routing (web.php)
         ↓
Controllers (Business Logic)
         ↓
Models + Services (Database & External APIs)
         ↓
Database (MySQL/PostgreSQL)
```

### Services Architecture

#### StripeService
- Gestisce la creazione di sessioni Stripe Checkout
- Verifica la firma dei webhook
- Aggiorna lo stato dell'ordine dopo pagamento

```php
// Utilizzo
$session = $stripeService->createCheckoutSession($order);
$stripeService->handlePaymentSuccess($sessionId);
```

#### PayPalService
- Crea ordini in PayPal
- Cattura il pagamento via API REST
- Verifica i webhook PayPal
- Converte gli indirizzi nel formato richiesto da PayPal

```php
// Utilizzo
$paypalOrder = $paypalService->createOrder($order);
$paypalService->handlePaymentCapture($orderId, $localOrderId);
```

---

## 🔄 FLUSSO PAGAMENTO

### Stripe Checkout
```
1. Utente va a checkout
2. Frontend chiama PaymentController::initializeStripeCheckout()
3. StripeService crea una sessione e ritorna sessionId
4. Frontend reindirizza a Stripe Checkout
5. Utente paga sulla pagina Stripe
6. Stripe invia webhook success
7. PaymentController::stripeWebhook() aggiorna order payment_status → 'paid'
8. Utente reindirizzato a checkout.success
```

### PayPal Checkout
```
1. Utente va a checkout
2. Frontend chiama PaymentController::initializePayPalCheckout()
3. PayPalService crea ordine PayPal e ritorna orderId
4. Frontend carica PayPal JavaScript SDK e mostra pulsanti
5. Utente autorizza il pagamento
6. Frontend chiama PaymentController::capturePayPalOrder()
7. PayPalService cattura l'ordine via REST API
8. Ordine payment_status aggiornato a 'paid'
9. Utente reindirizzato a checkout.success
```

---

## 📊 DATABASE SCHEMA RELATIONSHIPS

```
Categories
  ├─ hasMany → Categories (self-referencing per gerarchie)
  └─ hasMany → Products

Products
  ├─ belongsTo → Category
  ├─ hasMany → ProductImages
  ├─ hasMany → OrderItems
  └─ hasOne → ProductImage (primary)

ProductImages
  └─ belongsTo → Product

Orders
  ├─ belongsTo → User
  └─ hasMany → OrderItems

OrderItems
  ├─ belongsTo → Order
  └─ belongsTo → Product
```

---

## 🔐 SICUREZZA

### CSRF Protection
- Disabilitato solo per i webhook API (/api/webhooks/stripe, /api/webhooks/paypal)
- Abilitato per tutte le altre rotte

### Validazione Input
```php
// Tutti i controller validano gli input
$validated = $request->validate([
    'product_id' => 'required|exists:products,id',
    'quantity' => 'required|integer|min:1',
]);
```

### Autorizzazione
```php
// CheckoutController verifica che l'ordine appartenga all'utente
if ($order->user_id !== auth()->id()) {
    return response()->json(['success' => false], 403);
}
```

### Ordini Protetti
```php
// Una volta pagato, i campi non sono modificabili (tranne shipping status)
->disabled(fn($record) => $record && $record->isPaid())
```

---

## 💾 CACHING STRATEGY

### Dati da Cachare
- Categorie prodotti (raramente cambiano)
- Prodotti principali (home page)
- Totali mensili nella dashboard

### Invalidamento Cache
- Quando un prodotto viene creato/modificato
- Quando viene completato un pagamento
- Quando un ordine cambia stato

```php
// Esempio di invalidamento
Cache::tags(['products'])->flush();
Cache::forget('monthly_sales');
```

---

## 🔍 LOGGING

### Log Locations
- Payment errors: `storage/logs/laravel.log`
- Webhook events: Log::info() in PaymentController
- Service errors: Log::error() in Services

### Monitoraggio
```php
Log::info('PayPal order captured successfully', [
    'local_order_id' => $localOrderId,
    'paypal_order_id' => $paypalOrderId,
    'transaction_id' => $paymentId,
]);
```

---

## 🚀 PERFORMANCE OPTIMIZATION

### Database Queries
- Eager loading con `with()` per evitare N+1 queries
- Indexing su foreign keys e slug
- Paginazione sui risultati

```php
// ✅ BENE
$products = Product::with('category', 'primaryImage')->paginate();

// ❌ MALE
$products = Product::paginate();
foreach ($products as $product) {
    echo $product->category->name; // N+1 query!
}
```

### Frontend Assets
- Assets compilati con Vite
- CSS e JS minificati
- Images ottimizzate
- Lazy loading delle immagini

### API Responses
- JSON leggero
- Solo dati necessari
- Validazione client-side

---

## 🧪 TESTING

### Unit Tests (Services)
```bash
php artisan make:test StripeServiceTest
php artisan make:test PayPalServiceTest
```

### Feature Tests (Controllers)
```bash
php artisan make:test PaymentControllerTest
```

### Test Database
```php
// In tests usa SQLite in memoria
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
```

---

## 📈 SCALABILITÀ

### Per Grandi Volumi
1. **Database**: Implementa sharding per ordini storici
2. **Cache**: Usa Redis per sessions e cache
3. **Queue**: Sposta i webhook processing in queue asincrona
4. **CDN**: Carica le immagini su CDN (Cloudflare, AWS S3)
5. **Load Balancing**: Usa LB per distribuire il traffico

### Implementazione Queue per Webhook
```php
// PaymentController
dispatch(new ProcessStripeWebhook($event))->onQueue('webhooks');
```

---

## 🛡️ VALIDAZIONE WEBHOOK

### Stripe
```php
$event = \Stripe\Webhook::constructEvent(
    $request->getContent(),
    $request->header('Stripe-Signature'),
    config('services.stripe.webhook_secret')
);
```

### PayPal
```php
$verified = $paypalService->verifyWebhookSignature($request);
if (!$verified) return abort(400);
```

---

## 📋 CHECKLIST PRE-PRODUZIONE

- [ ] Tutte le credenziali in variabili d'ambiente
- [ ] HTTPS configurato
- [ ] Webhook endpoints testati
- [ ] Rate limiting configurato
- [ ] Backup database pianificato
- [ ] Monitoring dei log attivo
- [ ] Error tracking (Sentry/Bugsnag)
- [ ] CDN configurato
- [ ] Email notifications configurate
- [ ] SSL certificato valido
- [ ] Database replica/replication
- [ ] Load testing completato

---

## 🔗 ESTENSIONI FUTURE

### Possibili Aggiunte
1. **Payment Methods**: Apple Pay, Google Pay
2. **Inventory Management**: Stock tracking avanzato
3. **Discounts**: Codici sconto, promozioni
4. **Reviews**: Valutazioni e commenti prodotti
5. **Wishlist**: Lista desideri utenti
6. **Advanced Analytics**: Dashboard analytics dettagliato
7. **Multi-language**: Supporto multilingua
8. **API GraphQL**: Per mobile app
9. **Shipping Integration**: Integrazione con corrieri
10. **Refunds**: Gestione resi e rimborsi

---

## 🎓 PATTERN UTILIZZATI

### Service Container
```php
// Services registrati nel service provider
$this->app->singleton(StripeService::class);
$this->app->singleton(PayPalService::class);
```

### Repository Pattern (Opzionale)
```php
interface OrderRepository {
    public function findById($id);
    public function create(array $data);
    public function update($id, array $data);
}
```

### Observer Pattern
```php
// Auto-trigger azioni quando un ordine cambia
OrderObserver watches Order changes
```

### Factory Pattern
```php
// Factories per testing
Product::factory()->create();
Order::factory()->create();
```

---

**ARCHITECTURE v1.0** - Built for scalability and maintainability ⚡
