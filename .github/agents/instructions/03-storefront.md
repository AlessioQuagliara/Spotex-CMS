# Storefront e-Commerce - Istruzioni Agente AI

## Obiettivo
Creare il frontend pubblico (storefront) per la piattaforma e-commerce con catalog, cart, checkout.

## Priorità
🟠 **MEDIA** - Feature principale per e-commerce funzionale

## Fase 1: Struttura Base Storefront

### 1.1 Setup Next.js App
```
frontend/render/                    # Public storefront
├── app/
│   ├── (storefront)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx            # Product listing
│   │   │   └── [id]/page.tsx       # Product detail
│   │   ├── cart/
│   │   │   └── page.tsx            # Shopping cart
│   │   ├── checkout/
│   │   │   ├── page.tsx            # Checkout form
│   │   │   └── success/page.tsx    # Order confirmation
│   │   └── account/
│   │       ├── page.tsx            # Dashboard
│   │       ├── orders/page.tsx     # Order history
│   │       └── profile/page.tsx    # Account settings
```

### 1.2 Componenti Storefront
- [ ] Header (navigazione, logo, cart icon)
- [ ] Footer (links, newsletter, social)
- [ ] ProductCard (display, add to cart button)
- [ ] ProductGallery (immagini product)
- [ ] CartSidebar / CartDrawer
- [ ] FilterSidebar (categoria, prezzo, rating)
- [ ] SearchBar (ricerca prodotti)

## Fase 2: Catalog & Shopping

### 2.1 Product Listing Page
- [ ] Visualizzare grid di prodotti
- [ ] Pagination o infinite scroll
- [ ] Filtri: categoria, prezzo, rating
- [ ] Sorting: price, popularity, newest
- [ ] Ricerca full-text
- [ ] Mobile responsive

### 2.2 Product Detail Page
- [ ] Galleria immagini (zoom, thumbnail)
- [ ] Descrizione prodotto
- [ ] Prezzo e disponibilità
- [ ] Selettore varianti (colore, taglia, ecc)
- [ ] Quantity selector
- [ ] Add to cart button
- [ ] Related products
- [ ] Reviews & ratings

### 2.3 Cart Management
- [ ] Visualizzare items nel cart
- [ ] Modificare quantità
- [ ] Rimuovere items
- [ ] Calcolo totale (tax, shipping)
- [ ] Coupon/discount code
- [ ] Persist cart (localStorage + DB)
- [ ] Clear cart

## Fase 3: Checkout

### 3.1 Checkout Process
- [ ] Informazioni cliente (email, phone)
- [ ] Indirizzo spedizione
- [ ] Metodo spedizione
- [ ] Metodo pagamento (Stripe)
- [ ] Order review
- [ ] Conferma ordine

### 3.2 Payment Integration
- [ ] Stripe integration
- [ ] Order creation
- [ ] Invoice generation
- [ ] Email confirmation
- [ ] Payment receipt

### 3.3 Order Management
- [ ] Order history
- [ ] Order tracking
- [ ] Order details
- [ ] Return/refund interface

## Fase 4: Account & Features

### 4.1 User Account
- [ ] Login / Register
- [ ] Profile management
- [ ] Address book
- [ ] Wishlist
- [ ] Order history
- [ ] Review history

### 4.2 Advanced Features
- [ ] Recommendations (based on browsing)
- [ ] Recently viewed products
- [ ] Newsletter signup
- [ ] Product notifications
- [ ] Reviews and ratings
- [ ] Q&A section

## API Endpoints Richiesti

```
GET    /api/v1/storefront/products           - List products
GET    /api/v1/storefront/products/{id}      - Product detail
GET    /api/v1/storefront/categories         - Categories
GET    /api/v1/storefront/search?q=...       - Search

POST   /api/v1/orders                        - Create order
GET    /api/v1/orders/{id}                   - Get order
GET    /api/v1/orders                        - List user orders

POST   /api/v1/cart/items                    - Add to cart
GET    /api/v1/cart                          - Get cart
PUT    /api/v1/cart/items/{id}               - Update item
DELETE /api/v1/cart/items/{id}               - Remove item

POST   /api/v1/payments/stripe               - Process payment
```

## Fase 5: SEO & Performance

### 5.1 SEO
- [ ] Meta tags (title, description, OG)
- [ ] Structured data (JSON-LD)
- [ ] Canonical URLs
- [ ] Sitemap
- [ ] Robots.txt

### 5.2 Performance
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Caching strategies
- [ ] Core Web Vitals

## File da Creare

### Components
```
frontend/render/components/storefront/
├── Header.tsx
├── Footer.tsx
├── ProductCard.tsx
├── ProductGallery.tsx
├── CartDrawer.tsx
├── FilterSidebar.tsx
└── PriceRange.tsx
```

### Pages
```
frontend/render/app/(storefront)/
├── page.tsx
├── products/page.tsx
├── products/[id]/page.tsx
├── cart/page.tsx
├── checkout/page.tsx
└── account/
    ├── page.tsx
    ├── orders/page.tsx
    └── profile/page.tsx
```

### Hooks
```
frontend/render/hooks/
├── useProducts.ts
├── useProduct.ts
├── useCart.ts
├── useOrder.ts
└── useWishlist.ts
```

## Comandi Test

```bash
# Frontend
npm run dev -- -p 3001  # Storefront on port 3001

# API test
curl http://localhost:8000/api/v1/storefront/products

# Lighthouse
npx lighthouse http://localhost:3001 --view
```

## Criteri di Completamento

✅ Task completato quando:
1. Homepage carica correttamente
2. Prodotti visualizzabili in catalog
3. Product details pagina funziona
4. Cart aggiunge/rimuove prodotti
5. Checkout è completo
6. Pagamento Stripe funziona
7. Order confirmation email inviata
8. Tests passano 85%+
9. Lighthouse score > 80

## Performance Targets

- FCP < 1.5s
- LCP < 2.5s
- CLS < 0.1
- TTFB < 200ms
- Mobile score > 75

## Prossimi Passi

1. Setup base Next.js structure
2. Creare componenti header/footer
3. Implementare product listing
4. Aggiungere product details
5. Creare cart management
6. Implementare checkout
7. Integrare Stripe
8. Aggiungere SEO
9. Optimize performance

---

**Created:** 2026-01-14
**Priority:** Medium
**Estimated Time:** 20-24 hours
**Status:** Not Started
**Dependencies:** [02-products-crud.md]
