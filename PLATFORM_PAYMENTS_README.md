# SPOTEX CMS - Platform Payments Integration

## Panoramica

Questa implementazione aggiunge supporto per **commissioni platform automatiche** tramite:
- **Stripe Connect** - Application fees su pagamenti Stripe
- **PayPal Multiparty/Commerce Platform** - Platform fees su pagamenti PayPal

### ⚠️ Vincolo: ZERO REFACTORING

Questa implementazione **NON modifica** il flusso esistente di SPOTEX CMS. Usa pattern **Adapter/Shim** per:
- ✅ Aggiungere solo parametri extra ai metodi esistenti
- ✅ Mantenere compatibilità totale con codice attuale
- ✅ Permettere disattivazione immediata (`platform_mode=off`)

---

## 📦 Files Creati/Modificati

### Nuovi Files (NO refactoring)
```
database/migrations/
├── 2026_01_29_000001_add_platform_columns_to_orders.php
└── 2026_01_29_000002_create_merchant_payment_settings.php

app/Models/
└── MerchantPaymentSetting.php

app/Services/
├── CommissionCalculator.php
├── PlatformPaymentsAdapter.php

app/Filament/Resources/
├── MerchantPaymentSettingResource.php
└── MerchantPaymentSettingResource/Pages/
    ├── ListMerchantPaymentSettings.php
    ├── CreateMerchantPaymentSetting.php
    └── EditMerchantPaymentSetting.php

config/
└── spotex.php

.env.platform.example
```

### Files Patchati (modifiche minime)
```
app/Models/Order.php
├── ✅ Aggiunti campi fillable per platform columns

app/Services/StripeService.php
├── ✅ Inietta PlatformPaymentsAdapter in __construct
├── ✅ Merge parametri Connect in createCheckoutSession()
└── ✅ Salva provider_event_id in handlePaymentSuccess()

app/Services/PayPalService.php
├── ✅ Inietta PlatformPaymentsAdapter in __construct
└── ✅ Merge parametri multiparty in createOrder()

app/Jobs/ProcessStripeWebhook.php
└── ✅ Passa event_id a handlePaymentSuccess() per idempotenza
```

---

## 🚀 Setup

### 1. Esegui le migrazioni
```bash
php artisan migrate
```

### 2. Configura Platform Mode
Aggiungi al tuo `.env`:

```bash
# Modalità Platform: off|stripe_connect|paypal_multiparty
SPOTEX_PLATFORM_MODE=off  # Default: nessuna commissione
```

### 3. Configura Commissioni in Admin
1. Vai su `/admin/merchant-payment-settings`
2. Crea/modifica il record unico con:
   - **Commission Percent**: Es. `5.50` = 5.5%
   - **Commission Fixed**: Es. `0.50` = €0.50
   - Formula: `commission = (total * percent / 100) + fixed`

---

## 💳 Stripe Connect Setup

### Step 1: Crea Platform Account
1. Vai su https://dashboard.stripe.com/
2. Crea un **Connect Platform Account**
3. Ottieni il **Platform Secret Key** (`sk_...`)

### Step 2: Onboard Merchant
Due opzioni:

#### A) Express Account (più semplice)
```php
// Esempio: crea account link per onboarding
$stripe = new \Stripe\StripeClient(config('spotex.stripe_connect.platform_secret'));

$account = $stripe->accounts->create([
    'type' => 'express',
    'country' => 'IT',
    'email' => 'merchant@example.com',
]);

$accountLink = $stripe->accountLinks->create([
    'account' => $account->id,
    'refresh_url' => route('admin.stripe-connect.refresh'),
    'return_url' => route('admin.stripe-connect.return'),
    'type' => 'account_onboarding',
]);

// Redirect merchant a: $accountLink->url
```

#### B) Manual Account ID
Se il merchant ha già un account Stripe Connect:
1. Ottieni il `Connected Account ID` (formato: `acct_xxxx`)
2. Inseriscilo in `/admin/merchant-payment-settings`

### Step 3: Attiva in .env
```bash
SPOTEX_PLATFORM_MODE=stripe_connect
STRIPE_PLATFORM_SECRET=sk_test_YOUR_PLATFORM_KEY
```

### Step 4: Configura in Admin
1. `/admin/merchant-payment-settings`
2. Abilita **Stripe Connect**
3. Inserisci **Connected Account ID** (`acct_xxxx`)
4. Salva

### Verifica
Crea un ordine test: vedrai `application_fee_amount` nel payment intent.

---

## 🌐 PayPal Multiparty Setup

### ⚠️ Requisiti
PayPal Multiparty richiede un **PayPal Partner Account**.

**Se NON hai permessi Partner:**
- Il sistema farà **fallback automatico** a PayPal standard
- Nessun errore: ordine processato normalmente senza commissioni

### Step 1: Diventa PayPal Partner
1. Richiesta partner: https://www.paypal.com/merchantapps/appcenter/partner
2. Ottieni **Partner Client ID** e **Secret**

### Step 2: Onboard Merchant
Usa **Partner Referrals API** per collegare merchant account:
```bash
POST https://api-m.paypal.com/v2/customer/partner-referrals
```
Salva il `merchant_id` ricevuto.

### Step 3: Attiva in .env
```bash
SPOTEX_PLATFORM_MODE=paypal_multiparty
PAYPAL_PARTNER_CLIENT_ID=YOUR_PARTNER_CLIENT_ID
PAYPAL_PARTNER_SECRET=YOUR_PARTNER_SECRET
```

### Step 4: Configura in Admin
1. `/admin/merchant-payment-settings`
2. Abilita **PayPal Multiparty**
3. Inserisci **Merchant ID PayPal**
4. Salva

### Fallback Automatico
Se l'API rifiuta la richiesta multiparty (es. permessi mancanti):
- ✅ Ordine procede con PayPal standard
- ⚠️ Log warning: `PayPal Multiparty mode active but API rejected`
- 💡 Check: permessi Partner attivi?

---

## 🔄 Comportamento Runtime

### Quando `SPOTEX_PLATFORM_MODE=off` (default)
- ✅ Comportamento identico a prima
- ✅ Nessun parametro extra nelle API
- ✅ Colonne `platform_mode`, `commission_amount` = default/null

### Quando `SPOTEX_PLATFORM_MODE=stripe_connect`
1. User avvia checkout → `createCheckoutSession()`
2. Adapter calcola commissione: `(total * 5.5 / 100) + 0.50`
3. Merge parametri in Stripe Session:
   ```php
   'payment_intent_data' => [
       'application_fee_amount' => 1234,  // cents
       'transfer_data' => [
           'destination' => 'acct_MERCHANT'
       ]
   ]
   ```
4. Ordine salvato con:
   - `payment_provider = 'stripe'`
   - `platform_mode = 'stripe_connect'`
   - `commission_amount = 1234` (cents)

### Quando `SPOTEX_PLATFORM_MODE=paypal_multiparty`
1. User avvia PayPal → `createOrder()`
2. Adapter calcola commissione
3. Merge parametri in PayPal purchase_units:
   ```php
   'payment_instruction' => [
       'platform_fees' => [[
           'amount' => [
               'currency_code' => 'EUR',
               'value' => '12.34'
           ]
       ]]
   ]
   ```
4. Ordine salvato con metadata platform

---

## 📊 Database Schema

### Nuove colonne in `orders`
```sql
payment_provider          VARCHAR  -- 'stripe'|'paypal'
platform_mode             VARCHAR  -- 'off'|'stripe_connect'|'paypal_multiparty'
commission_amount         INT      -- Commissione in cents (1234 = €12.34)
provider_payment_id       VARCHAR  -- session_id / paypal_order_id
provider_event_id         VARCHAR  -- webhook event_id (idempotenza)
```

### Tabella `merchant_payment_settings`
```sql
id                              BIGINT
stripe_connected_account_id     VARCHAR
stripe_connect_enabled          BOOLEAN
paypal_merchant_id              VARCHAR
paypal_multiparty_enabled       BOOLEAN
commission_percent              DECIMAL(5,2)  -- Es. 5.50
commission_fixed                DECIMAL(10,2) -- Es. 0.50
business_name                   VARCHAR
business_email                  VARCHAR
notes                           TEXT
created_at, updated_at          TIMESTAMP
```

---

## 🔍 Testing

### Test Stripe Connect
1. **Setup Test Mode:**
   ```bash
   SPOTEX_PLATFORM_MODE=stripe_connect
   STRIPE_PLATFORM_SECRET=sk_test_...
   ```

2. **Crea Test Connected Account:**
   ```bash
   # Usa Stripe CLI
   stripe accounts create --type=express --country=IT
   ```

3. **Inserisci in Admin:** account ID ricevuto

4. **Esegui Checkout:** verifica payment intent ha `application_fee`

5. **Check Dashboard:** vai su Platform Dashboard → vedi commissioni

### Test PayPal Multiparty
1. **Usa Sandbox Partner Account**
2. **Mock merchant_id:** inserisci test merchant ID
3. **Ordine test:** verifica API response
4. **Fallback test:** disabilita permessi → verifica fallback standard

### Test Webhook Idempotency
```bash
# Invia stesso evento Stripe 2+ volte
curl -X POST http://localhost:8000/webhook/stripe \
  -H "Stripe-Signature: xxx" \
  -d @webhook_event.json
```
Verifica: ordine aggiornato 1 sola volta (check `provider_event_id`)

---

## 🛠️ Troubleshooting

### Stripe: "No such destination"
- ❌ `stripe_connected_account_id` non valido
- ✅ Verifica formato: `acct_xxxxxxxxxxxx`
- ✅ Check account attivo in Dashboard

### PayPal: "PERMISSION_DENIED"
- ❌ Account non ha permessi Partner
- ✅ Sistema fa fallback automatico
- ✅ Check log: `PayPal Multiparty mode active`

### Commissione = 0
- ❌ `commission_percent` e `commission_fixed` = 0 in settings
- ✅ Configura valori in `/admin/merchant-payment-settings`

### Order non aggiornato da webhook
- ❌ `provider_event_id` già presente (duplicato)
- ✅ Check tabella `webhook_events` per event_id

---

## 📚 API References

### Stripe Connect
- Docs: https://stripe.com/docs/connect
- Application Fees: https://stripe.com/docs/connect/direct-charges
- Onboarding: https://stripe.com/docs/connect/custom/hosted/onboarding

### PayPal Multiparty
- Commerce Platform: https://developer.paypal.com/docs/multiparty/
- Platform Fees: https://developer.paypal.com/docs/multiparty/checkout/advanced/platform-fees/
- Partner Referrals: https://developer.paypal.com/docs/api/partner-referrals/v2/

---

## 🔐 Security Notes

1. **Platform Keys:** NON committare in git
   - Usa `.env` per tutte le chiavi
   - Aggiungi `.env` a `.gitignore`

2. **Webhook Signature:** Sempre verificata
   - Stripe: usa `constructEvent()` (built-in verify)
   - PayPal: usa API `/verify-webhook-signature`

3. **Idempotency:** Garantita via `provider_event_id`
   - Stripe può inviare stesso evento 2+ volte
   - Sistema processa 1 sola volta

4. **Connected Account Validation:**
   - Verifica account attivo prima di usare
   - Handle errori "No such destination"

---

## 🎯 Roadmap Future

### Fase 2: Hub Platform (opzionale)
Se serve un **Hub multi-tenant** separato:
1. Nuovo progetto Laravel per Hub
2. API: onboarding, webhook forwarding
3. SPOTEX CMS diventa "client" dell'Hub
4. Zero cambiamento al CMS attuale (ancora pattern adapter)

### Fase 3: Subscriptions
Abbonamenti mensili merchant con Stripe Billing:
- Model `Subscription`
- Cron job per charge mensile
- Admin UI per gestione subscriptions

---

## 📞 Support

Per domande:
- **Stripe Connect:** https://support.stripe.com/
- **PayPal Partner:** https://developer.paypal.com/support/
- **SPOTEX CMS:** [Contatta team di sviluppo]

---

**🎉 Implementazione Completata**

Sistema pronto per production con:
- ✅ Zero breaking changes
- ✅ Backward compatibility 100%
- ✅ Fallback automatici
- ✅ Test mode supportato
- ✅ Admin UI completa

Attiva semplicemente `SPOTEX_PLATFORM_MODE` quando pronto! 🚀
