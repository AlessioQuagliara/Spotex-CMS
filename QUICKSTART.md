# 🚀 SPOTEX Platform Payments - Quick Start Guide

## Setup in 5 minuti

### Step 1: Verifica Database
```bash
php artisan migrate:status | grep platform
php artisan migrate:status | grep merchant
```
✅ Dovresti vedere "Ran" per entrambe

### Step 2: Accedi all'Admin
```bash
# Apri browser
http://localhost:8000/admin/merchant-payment-settings
```

### Step 3: Configura Commissioni
1. Clicca "Crea" (o modifica record esistente)
2. Imposta:
   - **Commission Percent:** `5.50` (= 5.5%)
   - **Commission Fixed:** `0.50` (= €0.50)
3. Salva

**Test:** Ordine €100 → Commissione = €6.00

---

## Modalità 1: Stripe Connect (Raccomandato)

### Setup
1. **In `.env`:**
   ```bash
   SPOTEX_PLATFORM_MODE=stripe_connect
   STRIPE_PLATFORM_SECRET=sk_test_YOUR_KEY
   ```

2. **In Admin (`/admin/merchant-payment-settings`):**
   - Abilita "Stripe Connect"
   - Inserisci Connected Account ID: `acct_TEST123`
   - Salva

3. **Test:**
   ```bash
   # Crea ordine test dal frontend
   # Verifica payment intent ha application_fee_amount
   ```

### Ottenere Connected Account ID

**Opzione A: Stripe Dashboard**
1. Vai su https://dashboard.stripe.com/connect/accounts
2. Crea account test
3. Copia ID (formato: `acct_xxxx`)

**Opzione B: Stripe CLI**
```bash
stripe accounts create --type=express --country=IT
# Output: acct_xxxxxxxxxxxxx
```

**Opzione C: API Call**
```php
$stripe = new \Stripe\StripeClient(env('STRIPE_PLATFORM_SECRET'));

$account = $stripe->accounts->create([
    'type' => 'express',
    'country' => 'IT',
    'email' => 'merchant@example.com',
]);

echo $account->id; // acct_xxxxxxxxxxxxx
```

### Verifica Funzionamento
```bash
# Log Laravel
tail -f storage/logs/laravel.log | grep "Stripe"

# Cerca: "session created with platform params"
```

---

## Modalità 2: PayPal Multiparty (Richiede Partner Account)

### Setup
1. **In `.env`:**
   ```bash
   SPOTEX_PLATFORM_MODE=paypal_multiparty
   PAYPAL_PARTNER_CLIENT_ID=YOUR_PARTNER_ID
   PAYPAL_PARTNER_SECRET=YOUR_SECRET
   ```

2. **In Admin:**
   - Abilita "PayPal Multiparty"
   - Inserisci Merchant ID PayPal
   - Salva

3. **Test:**
   ```bash
   # Crea ordine PayPal dal frontend
   # Verifica log per "PayPal Multiparty mode active"
   ```

### ⚠️ Fallback Automatico
Se NON hai account Partner:
- ✅ Ordine procede con PayPal standard
- ⚠️ Log: "PayPal Multiparty attempted but permission denied"
- ❌ NO commissione applicata

---

## Modalità 3: Standard (Default - NO commissioni)

```bash
# .env
SPOTEX_PLATFORM_MODE=off
```
✅ Comportamento identico a prima dell'implementazione

---

## Test Rapido

### 1. Test Calcolo Commissione
```bash
php artisan tinker
```

```php
$settings = App\Models\MerchantPaymentSetting::create([
    'commission_percent' => 5.00,
    'commission_fixed' => 1.00,
]);

$calculator = new App\Services\CommissionCalculator();
$commission = $calculator->calculateCommission(100.00);
echo "Commissione su €100: €" . ($commission / 100);
// Output: Commissione su €100: €6
```

### 2. Test Adapter Mode Detection
```php
config(['spotex.platform_mode' => 'stripe_connect']);

$adapter = app(App\Services\PlatformPaymentsAdapter::class);
$isActive = $adapter->isStripeConnectActive();
echo $isActive ? "ACTIVE" : "INACTIVE";
```

### 3. Test Order con Platform Data
```php
$order = App\Models\Order::factory()->create([
    'total' => 100.00,
    'payment_provider' => 'stripe',
    'platform_mode' => 'stripe_connect',
    'commission_amount' => 600, // €6.00
]);

echo "Order #{$order->id} has commission: €" . ($order->commission_amount / 100);
```

---

## Troubleshooting

### Errore: "Column not found: payment_provider"
**Causa:** Migrazioni non eseguite
**Fix:**
```bash
php artisan migrate
```

### Errore: "No such destination: acct_xxx"
**Causa:** Connected Account ID non valido
**Fix:**
1. Verifica formato: `acct_` + 16 caratteri
2. Check Stripe Dashboard: account esiste e attivo?

### Commissione sempre 0
**Causa:** Settings non configurati
**Fix:**
1. Vai su `/admin/merchant-payment-settings`
2. Imposta `commission_percent` > 0 o `commission_fixed` > 0

### PayPal Multiparty non applica fee
**Causa:** Account non ha permessi Partner
**Fix:**
- ✅ Fallback automatico: sistema funziona comunque
- 📝 Richiedi upgrade a PayPal Partner Account

---

## Query Utili

### Vedere tutti gli ordini con commissioni
```sql
SELECT 
    id,
    total,
    payment_provider,
    platform_mode,
    commission_amount / 100 as commission_eur,
    paid_at
FROM orders
WHERE platform_mode != 'off'
  AND payment_status = 'paid'
ORDER BY paid_at DESC
LIMIT 10;
```

### Totale commissioni mese corrente
```sql
SELECT 
    payment_provider,
    COUNT(*) as orders,
    SUM(commission_amount) / 100 as total_commission_eur
FROM orders
WHERE platform_mode != 'off'
  AND payment_status = 'paid'
  AND MONTH(paid_at) = MONTH(CURRENT_DATE)
GROUP BY payment_provider;
```

### Check webhook duplicati (idempotenza)
```sql
SELECT 
    provider_event_id,
    COUNT(*) as count
FROM orders
WHERE provider_event_id IS NOT NULL
GROUP BY provider_event_id
HAVING count > 1;
-- Risultato atteso: 0 rows (nessun duplicato)
```

---

## Next Steps

### 1. Produzione
- [ ] Cambia da test keys a live keys
- [ ] Configura webhook URL in Stripe/PayPal Dashboard
- [ ] Test end-to-end con ordine reale (piccolo importo)

### 2. Onboarding Automatico (Opzionale)
- [ ] Implementa UI per Stripe Account Link
- [ ] Crea flow PayPal Partner Referral
- [ ] Aggiungi status check account

### 3. Analytics (Opzionale)
- [ ] Widget Filament per commissioni totali
- [ ] Grafico trend mensile
- [ ] Export CSV per accounting

---

## Support

- **Documentazione completa:** `PLATFORM_PAYMENTS_README.md`
- **Implementation summary:** `IMPLEMENTATION_SUMMARY.md`
- **Stripe Docs:** https://stripe.com/docs/connect
- **PayPal Docs:** https://developer.paypal.com/docs/multiparty/

---

**🎉 Setup completato!**

Il sistema è pronto. Scegli una modalità, configura le impostazioni, e sei operativo! 🚀
