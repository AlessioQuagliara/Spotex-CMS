# SPOTEX CMS - API ENDPOINTS REFERENCE

## 🔐 Authentication Required (routes protected by `auth` middleware)

### Products (Public)
```
GET    /
GET    /prodotti
GET    /prodotto/{slug}
```

### Cart (Authenticated)
```
POST   /carrello/aggiungi              (product_id, quantity)
GET    /carrello
POST   /carrello/aggiorna              (product_id, quantity)
POST   /carrello/rimuovi               (product_id)
```

### Checkout (Authenticated)
```
GET    /checkout
POST   /checkout/crea-ordine           (order_id, addresses)
GET    /checkout/success/{order}
GET    /checkout/cancel/{order}
```

### Payment (Authenticated)
```
POST   /pagamento/stripe/checkout      (order_id)
POST   /pagamento/paypal/checkout      (order_id)
POST   /pagamento/paypal/capture       (order_id, local_order_id)
```

---

## 🌐 Webhooks (No Auth Required, No CSRF)

### Stripe Webhook
```
POST   /api/webhooks/stripe

Request Headers:
- Stripe-Signature: <signature>

Payload Example:
{
  "id": "evt_...",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "payment_status": "paid",
      "metadata": { "order_id": 123 }
    }
  }
}
```

### PayPal Webhook
```
POST   /api/webhooks/paypal

Request Headers:
- PayPal-Transmission-ID: <id>
- PayPal-Transmission-Time: <time>
- PayPal-Cert-URL: <url>
- PayPal-Auth-Algo: <algo>
- PayPal-Transmission-Sig: <signature>

Payload Example:
{
  "id": "WH-...",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "status": "COMPLETED",
    "purchase_units": [{
      "reference_id": "123"
    }]
  }
}
```

---

## 📝 REQUEST/RESPONSE EXAMPLES

### 1️⃣ Add to Cart
**Request:**
```bash
POST /carrello/aggiungi
Content-Type: application/json
X-CSRF-TOKEN: <token>

{
  "product_id": 1,
  "quantity": 2
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### 2️⃣ Initialize Stripe Checkout
**Request:**
```bash
POST /pagamento/stripe/checkout
Content-Type: application/json
X-CSRF-TOKEN: <token>

{
  "order_id": 123
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "sessionId": "cs_test_..."
}
```

**Error (500):**
```json
{
  "success": false,
  "message": "Errore nell'inizializzazione del pagamento"
}
```

---

### 3️⃣ Initialize PayPal Checkout
**Request:**
```bash
POST /pagamento/paypal/checkout
Content-Type: application/json
X-CSRF-TOKEN: <token>

{
  "order_id": 123
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "orderId": "8FJ3H-3KHD-..."
}
```

---

### 4️⃣ Capture PayPal Order
**Request:**
```bash
POST /pagamento/paypal/capture
Content-Type: application/json
X-CSRF-TOKEN: <token>

{
  "order_id": "8FJ3H-3KHD-...",
  "local_order_id": 123
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Pagamento elaborato con successo"
}
```

---

### 5️⃣ Create Order (Checkout)
**Request:**
```bash
POST /checkout/crea-ordine
Content-Type: application/json
X-CSRF-TOKEN: <token>

{
  "order_id": 123,
  "shipping_address": "Via Roma 123",
  "shipping_city": "Milano",
  "shipping_zip": "20100",
  "shipping_country": "Italia",
  "billing_address": "Via Roma 123",
  "billing_city": "Milano",
  "billing_zip": "20100",
  "billing_country": "Italia"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "order_id": 123
}
```

---

## 🔒 STATUS CODES

| Code | Meaning |
|------|---------|
| 200  | Success |
| 400  | Bad Request (validation failed) |
| 401  | Unauthorized (not authenticated) |
| 403  | Forbidden (not authorized) |
| 404  | Not Found |
| 500  | Server Error |

---

## 🛠️ Error Handling

### Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "product_id": ["The product id field is required."]
  }
}
```

### Payment Error
```json
{
  "success": false,
  "message": "Errore nell'inizializzazione del pagamento"
}
```

### Webhook Error
```json
{
  "error": "Invalid signature"
}
```

---

## 📊 Data Models

### Product
```json
{
  "id": 1,
  "name": "Laptop Pro",
  "slug": "laptop-pro",
  "description": "High performance laptop",
  "price": 1299.99,
  "stock": 15,
  "category_id": 1,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Order
```json
{
  "id": 123,
  "user_id": 1,
  "status": "paid",
  "payment_status": "paid",
  "shipping_status": "not_shipped",
  "transaction_id": "pi_test_...",
  "total": 2599.98,
  "payment_method": "stripe",
  "shipping_address": "Via Roma 123, Milano, 20100, Italia",
  "billing_address": "Via Roma 123, Milano, 20100, Italia",
  "paid_at": "2024-01-15T10:30:00Z",
  "shipped_at": null,
  "delivered_at": null,
  "tracking_number": null,
  "created_at": "2024-01-15T09:00:00Z"
}
```

### OrderItem
```json
{
  "id": 456,
  "order_id": 123,
  "product_id": 1,
  "quantity": 2,
  "unit_price": 1299.99,
  "subtotal": 2599.98
}
```

### Category
```json
{
  "id": 1,
  "name": "Elettronica",
  "slug": "elettronica",
  "description": "Electronic products",
  "parent_id": null,
  "order": 1
}
```

---

## 🧪 Testing Endpoints

### Using cURL

**Add to Cart:**
```bash
curl -X POST http://localhost:8000/carrello/aggiungi \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: <csrf_token>" \
  -d '{"product_id": 1, "quantity": 2}'
```

**Stripe Webhook:**
```bash
curl -X POST http://localhost:8000/api/webhooks/stripe \
  -H "Stripe-Signature: t=123456789,v1=..." \
  -d '{...webhook_payload...}'
```

### Using Postman

1. Import the API collection
2. Set environment variables: `base_url`, `csrf_token`
3. Set up auth in Postman (Cookie: XSRF-TOKEN)
4. Run requests in sequence

### Using Laravel Dusk (E2E Testing)

```php
$this->browse(function (Browser $browser) {
    $browser->visit('/prodotti')
            ->waitForText('Laptop Pro')
            ->click('@add-to-cart-1')
            ->assertSee('Prodotto aggiunto al carrello');
});
```

---

## 🔄 Payment Flow Diagram

```
User              Frontend         Backend         Stripe/PayPal
 |                  |               |                  |
 |--Add Products--->|               |                  |
 |                  |--POST /cart-->|                  |
 |<--Cart Updated---|<--JSON OK-----|                  |
 |                  |               |                  |
 |--Checkout------->|               |                  |
 |                  |--GET /check-->|                  |
 |<--Form-------|<--HTML--------|                  |
 |                  |               |                  |
 |--Pay------->|               |                  |
 |                  |--POST /pay--->|                  |
 |                  |<--sessionID---|                  |
 |                  |               |                  |
 |--Redirect------->|--Redirect---->|                  |
 |                  |               |--Redirect------->|
 |                  |               |                  |
 |                  |               |<--Payment Token--|
 |<--Success Page---|<--Redirect----|<--Webhook------|
 |                  |               |--Save Status--->|
```

---

## 📱 CORS Configuration (for Mobile Apps)

```php
// config/cors.php
'paths' => ['api/*', '/pagamento/*'],
'allowed_methods' => ['*'],
'allowed_origins' => ['https://app.spotex.com'],
'allowed_origins_patterns' => ['*.spotex.com'],
```

---

**API Version:** 1.0.0
**Last Updated:** Gennaio 2026
