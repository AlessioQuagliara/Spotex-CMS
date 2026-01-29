# Implementazione Sistema Coupon e Spedizione Dinamici

## ✅ Completato

### 1. Modelli Database
- ✅ **Coupon Model** (`app/Models/Coupon.php`)
  - Supporta coupon percentuali e a importo fisso
  - Validazione date (valid_from, valid_until)
  - Limite di utilizzi totali e per cliente
  - Sconto massimo per percentuali
  - Importo minimo carrello

- ✅ **ShippingRule Model** (`app/Models/ShippingRule.php`)
  - Tre tipi: standard, express, pickup
  - Costo base configurabile
  - Soglia spedizione gratuita
  - Stato attivo/inattivo

### 2. Migrazioni
- ✅ `2026_01_29_170759_create_coupons_table.php`
- ✅ `2026_01_29_170759_create_shipping_rules_table.php`
- ✅ Eseguite con successo

### 3. Filament Resources (Admin)
- ✅ **CouponResource** (`app/Filament/Resources/CouponResource.php`)
  - Tabella con filtri per tipo e stato
  - Form con sezioni organizzate:
    - Informazioni Coupon (codice, tipo, valore)
    - Limiti Sconto (max_discount, min_cart_amount)
    - Utilizzi (max_uses, max_uses_per_customer)
    - Validità (date range, toggle attivo)
  - CRUD completo con azioni bulk

- ✅ **ShippingRuleResource** (`app/Filament/Resources/ShippingRuleResource.php`)
  - Tabella con colori badge per tipo
  - Form con sezioni:
    - Informazioni Spedizione (nome, tipo, costo base)
    - Spedizione Gratuita (soglia, descrizione, toggle)
  - CRUD completo

### 4. Seeder Dati Iniziali
- ✅ `ShippingRuleSeeder.php` - Crea 3 metodi di base:
  - Standard: €6.90
  - Express: €12.90
  - Pickup: €0.00

- ✅ `CouponSeeder.php` - Crea 3 coupon di test:
  - WELCOME10: 10% sconto (max €30)
  - SPOTEX5: 5% sconto (max €20)
  - WELCOME20: €20 fissi (min. carrello €100, valido 3 mesi)

### 5. CheckoutController Aggiornato
- ✅ Importa Coupon e ShippingRule
- ✅ `calculateShipping()` legge da database
- ✅ `calculateDiscount()` valida coupon da database
- ✅ Response JSON include: subtotal, shipping_cost, discount_amount, total

### 6. Checkout View Dinamica
- ✅ Metodi spedizione generati da database
- ✅ Descrizioni per ogni metodo
- ✅ JavaScript aggiornato:
  - `shippingRules` da JSON inline
  - `calculateShipping()` lookup da array
  - `calculateDiscount()` placeholder (calcolato nel server)
  - `updateTotalsFromServer()` per riflettere calcoli reali

### 7. API Pubblica
- ✅ `CouponController@list` (`/api/coupons`)
  - Ritorna solo coupon attivi e non scaduti
  - Valida date range
  - Response: `{ coupons: [...] }`

### 8. Routes
- ✅ Checkout spostato a rotta pubblica (no auth required)
- ✅ Pagamenti rimangono autenticati
- ✅ API coupon pubblica

## 📊 Database Schema

### Tabella `coupons`
```sql
- id (Primary Key)
- code (string, unique)
- type (enum: 'percentage', 'fixed')
- value (decimal:2)
- max_discount (decimal:2, nullable) - per percentuali
- min_cart_amount (decimal:2, nullable)
- max_uses (int, nullable)
- times_used (int, default: 0) - contatore
- max_uses_per_customer (int, default: 1)
- valid_from (date, nullable)
- valid_until (date, nullable)
- is_active (boolean, default: true)
- timestamps
```

### Tabella `shipping_rules`
```sql
- id (Primary Key)
- name (string)
- type (enum: 'standard', 'express', 'pickup', unique)
- base_cost (decimal:2)
- free_shipping_threshold (decimal:2, nullable)
- description (text, nullable)
- is_active (boolean, default: true)
- timestamps
```

## 🔧 Come Usare

### Per Amministratori (Filament)
1. Accedere a `/admin/login`
2. Pannello → Coupon: Gestire codici sconto
3. Pannello → Regole Spedizione: Gestire metodi e costi

### Per Clienti
1. Vai a `/checkout`
2. Scegli metodo di spedizione (dinamico da database)
3. Inserisci codice coupon
4. Sistema calcola automaticamente i totali

## 🧪 Test

```bash
# Seedare dati test
php artisan db:seed --class=ShippingRuleSeeder
php artisan db:seed --class=CouponSeeder

# Verificare dati
php artisan tinker
>>> App\Models\ShippingRule::all()
>>> App\Models\Coupon::all()

# Test API
curl http://localhost:8000/api/coupons
```

## 📝 Esempi di Configurazione Admin

### Coupon con Soglia Minima
```
Code: BUONO50
Type: Fixed (€50)
Min Cart Amount: €200
Max Uses: 100
Valid Until: 31/12/2026
```

### Spedizione Gratuita Sopra Soglia
```
Type: Standard
Base Cost: €8.00
Free Shipping Threshold: €150
Description: "Spedizione gratuita per ordini oltre €150"
```

### Coupon Scadente
```
Code: NATALE25
Type: Percentage (25%)
Max Discount: €50
Valid From: 01/12/2025
Valid Until: 31/12/2025
Max Uses Per Customer: 1
```

## 🚀 Prossimi Passi (Opzionali)

1. **Integrazione Analytics**
   - Tracciare utilizzi coupon
   - Monitorare metodi di spedizione preferiti

2. **Sconti Progressivi**
   - Sconti basati su numero ordini cliente
   - Programma fedeltà

3. **Zone Geografiche**
   - Costi spedizione per regione
   - Coupon per aree specifiche

4. **Email Notifiche**
   - Inviare coupon per attività specifiche
   - Ricordi di coupon in scadenza

## 📚 File Modificati

```
app/Models/Coupon.php (creato)
app/Models/ShippingRule.php (creato)
app/Filament/Resources/CouponResource.php (creato)
app/Filament/Resources/ShippingRuleResource.php (creato)
app/Http/Controllers/CheckoutController.php (modificato)
app/Http/Controllers/Api/CouponController.php (creato)
database/migrations/2026_01_29_170759_create_coupons_table.php (creato)
database/migrations/2026_01_29_170759_create_shipping_rules_table.php (creato)
database/seeders/CouponSeeder.php (creato)
database/seeders/ShippingRuleSeeder.php (creato)
resources/views/checkout/index.blade.php (modificato)
routes/web.php (modificato)
```

## ✨ Caratteristiche Implementate

✅ Gestione coupon completa (CRUD)
✅ Gestione spedizione dinamica
✅ Validazione date e limite utilizzi
✅ Interfaccia Filament intuitiva
✅ API pubblica per coupon attivi
✅ Calcoli server-side per sicurezza
✅ Supporto coupon fissi e percentuali
✅ Soglia spedizione gratuita
✅ Seeder con dati di test

---
**Data**: 29 Gennaio 2026
**Sistema**: Spotex CMS v1.0
