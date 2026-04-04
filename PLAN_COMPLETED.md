# PLAN COMPLETED LOG

## 2026-04-03 - Kickoff esecuzione piano Shopify-like

### Stato generale
- Fase avviata: `S1` (fondazioni tenancy)
- Scope completato in questo step: `A-001`, `DB-001`, `CTX-001`, `DB-002`, `DB-003`, `CTX-002`, `AUTH-001`, `CAT-001`, `CAT-002`

### A-001 - Tenancy ADR + data isolation model
- Stato: `DONE`
- Output:
  - ADR formale creata: `single DB + row-level isolation store_id`
  - File: `/docs/adr/ADR-001-tenancy-row-level-store-id.md`

### DB-001 - Tabelle accounts, stores, account_users
- Stato: `DONE`
- Output:
  - Nuove tabelle tenancy core introdotte:
    - `accounts`
    - `account_users`
    - `stores`
    - `store_domains`
    - `store_locales`
    - `store_currencies`
    - `store_settings`
  - File: `/database/migrations/2026_04_03_220300_create_accounts_and_stores_tables.php`
  - Model creati:
    - `/app/Models/Account.php`
    - `/app/Models/AccountUser.php`
    - `/app/Models/Store.php`
    - `/app/Models/StoreDomain.php`

### CTX-001 - Store Resolver (host/header/path)
- Stato: `DONE (baseline)`
- Output:
  - Middleware `StoreResolver` implementato con precedence:
    1. `store_domains.domain`
    2. subdomain su `SPOTEX_TENANCY_BASE_DOMAIN`
    3. path prefix `/{prefix}/{slug}`
    4. header `X-Store-Slug` / `X-Store-Id` in `local/testing`
    5. fallback store attivo default
  - Context request-scoped introdotto: `TenantContext`
  - Bootstrap middleware registrato per gruppi `web` e `api`
  - Variabili env tenancy aggiunte in `.env.example`
  - File:
    - `/app/Http/Middleware/StoreResolver.php`
    - `/app/Support/Tenancy/TenantContext.php`
    - `/app/Providers/AppServiceProvider.php`
    - `/bootstrap/app.php`
    - `/config/spotex.php`
    - `/.env.example`

### DB-002 - Add store_id a tabelle core
- Stato: `DONE (step additive)`
- Output:
  - Aggiunto `store_id` nullable + FK + index alle tabelle:
    - `products`
    - `categories`
    - `orders`
    - `order_items`
    - `pages`
    - `settings`
    - `coupons`
    - `navigation_items`
  - File: `/database/migrations/2026_04_03_220400_add_store_id_to_core_tables.php`

### DB-003 - Backfill dati + vincoli NOT NULL
- Stato: `DONE`
- Output:
  - Comando idempotente creato: `platform:backfill-store`
  - Supporta `--dry-run`
  - Esegue bootstrap account/store default + backfill `store_id` per dati legacy
  - Migrazione enforce completata:
    - crea default tenant se assente
    - backfill automatico `store_id` su dati core
    - applica `NOT NULL` su `store_id` (tabelle core)
    - converte unique globali in unique tenant-safe composite
  - File:
    - `/database/migrations/2026_04_03_223000_enforce_store_id_constraints_and_tenant_uniques.php`
  - File:
    - `/routes/console.php`
    - `/bootstrap/app.php` (registrazione commands route)

### Seed/factory alignment
- Stato: `DONE`
- Output:
  - Bootstrap tenant di default inserito nei seed:
    - `/database/seeders/TenantBootstrapSeeder.php`
    - `/database/seeders/DatabaseSeeder.php`
  - Seed aggiornati con `store_id`:
    - `/database/seeders/CategorySeeder.php`
    - `/database/seeders/ProductSeeder.php`
    - `/database/seeders/CouponSeeder.php`
    - `/database/seeders/NavigationItemSeeder.php`
  - Factory aggiornate:
    - `/database/factories/ProductFactory.php`
    - `/database/factories/OrderFactory.php`

### Runtime scoping (primo pass)
- Stato: `DONE (transitional scope + fallback legacy)`
- Output:
  - `store_id` integrato su model core (fillable + relazioni)
  - Scope transizionale su query pubbliche (store-specific con fallback legacy `NULL`) in:
    - `/app/Http/Controllers/ProductController.php`
    - `/app/Http/Controllers/FrontendPageController.php`
    - `/app/Services/Builder/BuilderPreviewCatalog.php`
    - `/app/Services/Builder/BuilderDocumentRenderer.php`
    - `/app/Http/Controllers/CartController.php`
    - `/app/Http/Controllers/CheckoutController.php`
  - `Setting::get/set` aggiornato con fallback `store-specific -> global`:
    - `/app/Models/Setting.php`

### CTX-002 - Scoping query in Filament + Policies
- Stato: `DONE`
- Output:
  - Scope centralizzato a livello model con global scope store-aware + auto-assign `store_id` in creazione:
    - `/app/Models/Concerns/BelongsToStore.php`
    - applicato a `Product`, `Category`, `Order`, `OrderItem`, `Page`, `Coupon`, `NavigationItem`, `Setting`
  - Filament resources hardenate con fail-closed quando manca `current_store`:
    - `/app/Filament/Resources/ProductResource.php`
    - `/app/Filament/Resources/CategoryResource.php`
    - `/app/Filament/Resources/PageResource.php`
    - `/app/Filament/Resources/CouponResource.php`
    - `/app/Filament/Resources/NavigationItemResource.php`
    - `/app/Filament/Resources/OrderResource.php`
    - `/app/Filament/Resources/FooterSettingResource.php`
    - `/app/Filament/Resources/FooterSettingResource/Pages/ListFooterSettings.php`
  - Validazioni unique Filament allineate ai nuovi vincoli tenant-safe (`store_id + slug`, `store_id + code`)
  - Policy anti cross-store introdotte/aggiornate:
    - `/app/Policies/Concerns/ChecksStoreBoundary.php`
    - `/app/Policies/OrderPolicy.php` (aggiornata)
    - `/app/Policies/ProductPolicy.php`
    - `/app/Policies/CategoryPolicy.php`
    - `/app/Policies/PagePolicy.php`
    - `/app/Policies/CouponPolicy.php`
    - `/app/Policies/NavigationItemPolicy.php`
    - `/app/Policies/SettingPolicy.php`
    - registrazione in `/app/Providers/AppServiceProvider.php`

### AUTH-001 - RBAC per account/store (`account_users.role`)
- Stato: `DONE`
- Output:
  - Ruolo effettivo per store/account introdotto nel model `User`:
    - `roleForAccount()`
    - `roleForStore()`
    - `effectiveRole()`
    - `isBackofficeUser()` e `canManageUsers()` ora account-aware
  - Membership bootstrap automatico per nuovi utenti backoffice senza membership esplicita (fallback account default)
  - Backfill migrazione ruoli legacy (`users.role` -> `account_users.role`) su account esistenti:
    - `/database/migrations/2026_04_03_224000_backfill_account_users_roles_from_users.php`
  - User management Filament riallineato a RBAC account-level:
    - query utenti scoped su `account_users` dell'account corrente
    - cambio ruolo e inviti sincronizzano `account_users.role`
    - role label/color mostrano ruolo membership corrente
  - File principali:
    - `/app/Models/User.php`
    - `/app/Filament/Resources/UserResource.php`
    - `/app/Filament/Resources/UserResource/Pages/ListUsers.php`
    - `/app/Filament/Resources/UserResource/Pages/CreateUser.php`
    - `/app/Filament/Resources/UserResource/Pages/EditUser.php`

### CAT-001 - Modello opzioni prodotto
- Stato: `DONE`
- Output:
  - Tabelle introdotte:
    - `product_options`
    - `product_option_values`
  - Model introdotti:
    - `/app/Models/ProductOption.php`
    - `/app/Models/ProductOptionValue.php`
  - CRUD base Filament:
    - `/app/Filament/Resources/ProductOptionResource.php`
    - `/app/Filament/Resources/ProductOptionResource/Pages/*`

### CAT-002 - Modello varianti prodotto
- Stato: `DONE`
- Output:
  - Tabelle introdotte:
    - `product_variants`
    - `variant_option_value`
  - SKU univoco per store con vincolo DB (`unique(store_id, sku)`)
  - Model introdotto:
    - `/app/Models/ProductVariant.php`
  - Relazioni aggiornate:
    - `/app/Models/Product.php` (`options()`, `variants()`)
  - CRUD base Filament varianti:
    - `/app/Filament/Resources/ProductVariantResource.php`
    - `/app/Filament/Resources/ProductVariantResource/Pages/*`
  - Policy aggiuntive:
    - `/app/Policies/ProductOptionPolicy.php`
    - `/app/Policies/ProductVariantPolicy.php`
    - registrazione policy in `/app/Providers/AppServiceProvider.php`

## 2026-04-03 - Inventory foundation (INV-001 + INV-002)

### Stato generale
- Fase in avanzamento: `S3` (inventory/tax minimum operable)
- Scope completato in questo step: `INV-001`, `INV-002`

### INV-001 - Inventory per location
- Stato: `DONE`
- Output:
  - Tabelle inventory introdotte:
    - `inventory_locations`
    - `inventory_levels`
  - Modelli tenancy-aware introdotti:
    - `/app/Models/InventoryLocation.php`
    - `/app/Models/InventoryLevel.php`
  - Relazioni inventory aggiunte a:
    - `/app/Models/Store.php`
    - `/app/Models/ProductVariant.php`
  - Bootstrap location di default per store (`code=main`) in:
    - `/database/seeders/TenantBootstrapSeeder.php`
  - Migrazione:
    - `/database/migrations/2026_04_03_230000_create_inventory_tables.php`

### INV-002 - Inventory ledger append-only
- Stato: `DONE`
- Output:
  - Modello ledger append-only introdotto:
    - `/app/Models/InventoryLedger.php`
  - Service transazionale introdotto:
    - `/app/Services/Inventory/InventoryLedgerService.php`
  - Capacità implementate:
    - normalizzazione delta per `restock`, `reserve`, `release`, `sale`, `adjust`
    - aggiornamento atomico projection `inventory_levels` (`on_hand`, `reserved`, `available`)
    - guard rail anti-underflow stock
    - idempotenza movimenti via `idempotency_key`
    - hardening concorrenza su duplicate key (fallback safe senza doppio update livello)
  - Policy inventory aggiunte:
    - `/app/Policies/InventoryLocationPolicy.php`
    - `/app/Policies/InventoryLevelPolicy.php`
    - registrazione in `/app/Providers/AppServiceProvider.php`

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/StoreResolverTest.php` (3 test, OK)
  - `/tests/Feature/TenantIsolationPolicyTest.php` (2 test, OK)
  - `/tests/Feature/AccountRoleRbacTest.php` (3 test, OK)
  - `/tests/Feature/ProductVariantsCatalogTest.php` (2 test, OK)
  - `/tests/Feature/InventoryLedgerServiceTest.php` (4 test, OK)
- Test eseguiti:
  - `vendor/bin/phpunit --filter AccountRoleRbacTest` -> OK
  - `vendor/bin/phpunit --filter ProductVariantsCatalogTest` -> OK
  - `vendor/bin/phpunit --filter StoreResolverTest` -> OK
  - `vendor/bin/phpunit --filter TenantIsolationPolicyTest` -> OK
  - `vendor/bin/phpunit --filter InventoryLedgerServiceTest` -> OK
  - `vendor/bin/phpunit --filter 'ProductVariantsCatalogTest|TenantIsolationPolicyTest'` -> OK
  - `vendor/bin/phpunit --filter PaymentFlowTest` -> OK
  - `vendor/bin/phpunit --filter PageBuilderCrudTest` -> OK
  - `vendor/bin/phpunit --filter UserInvitationTest` -> OK
  - `vendor/bin/phpunit` -> OK (`38/38`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK
- Nota:
  - `php artisan test` non disponibile in questa codebase; usato `vendor/bin/phpunit`.

### Prossimi step immediati suggeriti
1. `INV-003`: reservation on checkout con expirations e release automatico.
2. Migrare checkout/order flow da `product_id` a `variant_id` (snapshot prezzo e stock per variante/location).
3. `API-001`: introdurre skeleton `/api/v1` con health endpoint, envelope error standard e middleware auth dedicato.

## 2026-04-04 - INV-003 + checkout/order migration verso `variant_id`

### Stato generale
- Fase in avanzamento: `S3` (inventory/tax minimum operable)
- Scope completato in questo step: `INV-003` + migrazione runtime checkout/order su varianti

### INV-003 - Reservation on checkout con expiry/release
- Stato: `DONE`
- Output:
  - Tabella reservation introdotta:
    - `inventory_reservations`
  - Modello introdotto:
    - `/app/Models/InventoryReservation.php`
  - Service reservation lifecycle introdotto:
    - `/app/Services/Inventory/InventoryReservationService.php`
  - Capacità implementate:
    - reserve stock su checkout (`status=active`, `expires_at`)
    - release reservation su cancel/replace/expiry
    - conversion reservation -> `sale` su pagamento confermato
    - comando operativo: `inventory:release-expired` + schedule `everyMinute`
  - File collegati:
    - `/routes/console.php`
    - `/config/spotex.php`
    - `/.env.example`

### Migrazione flow checkout/order verso `variant_id`
- Stato: `DONE`
- Output:
  - Schema aggiornato:
    - `order_items.variant_id`
    - `order_items.inventory_location_id`
    - `orders.inventory_reservation_expires_at`
  - Migrazione con backfill legacy:
    - crea varianti default per prodotti legacy senza varianti
    - bootstrap inventory levels da stock prodotto legacy
    - backfill `order_items.variant_id`
    - file: `/database/migrations/2026_04_04_000100_add_inventory_reservations_and_variant_order_flow.php`
  - Checkout/cart aggiornati a varianti:
    - `/app/Http/Controllers/CartController.php`
    - `/app/Http/Controllers/CheckoutController.php`
    - `/resources/views/layouts/app.blade.php`
    - `/resources/views/cart/show.blade.php`
    - `/resources/views/products/show.blade.php`
  - Payment lifecycle aggiornato:
    - `Order::markAsPaid()` converte reservation in sale (fallback legacy su product stock)
    - release reservation su `checkout.cancel`
    - `/app/Models/Order.php`
    - `/app/Http/Controllers/PaymentController.php`
    - `/app/Services/StripeService.php`
    - `/resources/views/checkout/success.blade.php`
    - `/resources/views/checkout/cancel.blade.php`
  - Seed/factory alignment varianti+inventory:
    - `/database/seeders/ProductSeeder.php`
    - `/database/factories/ProductFactory.php`

### Policy e governance
- Policy inventory reservation aggiunta:
  - `/app/Policies/InventoryReservationPolicy.php`
  - registrazione in `/app/Providers/AppServiceProvider.php`

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/InventoryReservationCheckoutTest.php` (3 test, OK)
- Test aggiornati:
  - `/tests/Feature/PaymentFlowTest.php` (throttle middleware disabilitato nel test setup)
- Test eseguiti:
  - `vendor/bin/phpunit --filter InventoryReservationCheckoutTest` -> OK
  - `vendor/bin/phpunit --filter 'PaymentFlowTest|InventoryLedgerServiceTest|InventoryReservationCheckoutTest|ProductVariantsCatalogTest|TenantIsolationPolicyTest'` -> OK
  - `vendor/bin/phpunit` -> OK (`41/41`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK
  - `php artisan inventory:release-expired --limit=50` -> OK (`0` rilasciate nel run di verifica)
- Nota:
  - `php artisan test` non disponibile in questa codebase; usato `vendor/bin/phpunit`.

### Prossimi step immediati suggeriti
1. `PRC-001`: price list multi-currency + fallback `default_currency` store-aware.
2. `TAX-001`: tax engine minimo in checkout (zone/class/rate) con snapshot tassa su ordine.
3. `API-001`: skeleton `/api/v1` con error envelope standard + auth middleware dedicato.

## 2026-04-04 - PRC-001 + TAX-001 (chiusura S3)

### Stato generale
- Fase completata: `S3` (inventory/tax minimum operable)
- Scope completato in questo step: `PRC-001`, `TAX-001`

### PRC-001 - Price list multi-currency
- Stato: `DONE`
- Output:
  - Tabelle pricing introdotte:
    - `price_lists`
    - `price_list_prices`
  - Snapshot pricing su ordine/riga introdotti:
    - `orders.currency`
    - `orders.fx_rate`
    - `order_items.price_list_id`
  - Backfill bootstrap pricing:
    - default price list per store (`channel=online`, currency default store)
    - prezzi varianti backfillati su `price_list_prices`
    - enable default currency in `store_currencies`
  - Service pricing introdotto:
    - `/app/Services/Pricing/PriceResolver.php`
    - risoluzione prezzo per variante con fallback store-aware su `default_currency`
  - Integrazione runtime:
    - checkout line items valorizzano prezzo/currency/price_list snapshot
    - provider payment payload allineati a `order.currency`:
      - `/app/Services/StripeService.php`
      - `/app/Services/PayPal/PayPalOrderPayloadBuilder.php`
  - File schema:
    - `/database/migrations/2026_04_04_010000_create_pricing_and_tax_tables.php`
    - `/database/migrations/2026_04_04_010100_add_pricing_and_tax_snapshot_columns.php`

### TAX-001 - Tax engine per paese
- Stato: `DONE`
- Output:
  - Tabelle tax introdotte:
    - `tax_classes`
    - `tax_zones`
    - `tax_rates`
  - Snapshot tax su ordine/riga introdotti:
    - `orders.tax_total`
    - `products.tax_class_id`
    - `order_items.tax_class_id`
    - `order_items.tax_rate_snapshot`
    - `order_items.tax_amount`
  - Service tax engine introdotto:
    - `/app/Services/Tax/TaxCalculator.php`
    - matching zona per `country/region/postal_pattern`
    - supporto rate inclusive/exclusive
  - Integrazione checkout:
    - calcolo tasse su `createOrder` con update snapshot su `order_items`
    - update ordine (`tax_total`, `total`) e risposta API checkout
    - riallineamento UI riepilogo checkout con riga tasse e totals server-aligned
    - file principale: `/app/Http/Controllers/CheckoutController.php`
    - view aggiornata: `/resources/views/checkout/index.blade.php`
  - Modelli pricing/tax introdotti:
    - `/app/Models/PriceList.php`
    - `/app/Models/PriceListPrice.php`
    - `/app/Models/TaxClass.php`
    - `/app/Models/TaxZone.php`
    - `/app/Models/TaxRate.php`
  - Relazioni model aggiornate:
    - `/app/Models/Product.php`
    - `/app/Models/ProductVariant.php`
    - `/app/Models/Store.php`
    - `/app/Models/Order.php`
    - `/app/Models/OrderItem.php`

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/PricingTaxCheckoutTest.php` (2 test, OK)
- Test regressione eseguiti:
  - `vendor/bin/phpunit --filter PricingTaxCheckoutTest` -> OK
  - `vendor/bin/phpunit --filter 'InventoryReservationCheckoutTest|PaymentFlowTest'` -> OK
  - `vendor/bin/phpunit` -> OK (`43/43`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK
- Nota:
  - `php artisan test` non disponibile in questa codebase; usato `vendor/bin/phpunit`.

### Prossimi step immediati suggeriti
1. `API-001`: skeleton `/api/v1` con envelope error standard + middleware auth dedicato.
2. `API-002`/`API-003`: scelta baseline auth per app pubbliche/private (OAuth2 + API key).
3. `WEB-001`: transactional outbox per eventi dominio (`order.*`, `inventory.*`).

## 2026-04-04 - API-001 (/api/v1 skeleton + error envelope + auth middleware)

### Stato generale
- Fase in avanzamento: `S4` (API platform foundation)
- Scope completato in questo step: `API-001`

### API-001 - Framework `/api/v1`
- Stato: `DONE`
- Output:
  - Routing versionato introdotto in:
    - `/routes/api.php`
  - Endpoint base disponibili:
    - `GET /api/v1/health` (public)
    - `GET /api/v1/me` (protected)
    - `GET /api/v1/products` (protected, paginato + filter/sort)
  - Controller API v1 introdotti:
    - `/app/Http/Controllers/Api/V1/HealthController.php`
    - `/app/Http/Controllers/Api/V1/MeController.php`
    - `/app/Http/Controllers/Api/V1/ProductController.php`

### Error envelope standard
- Stato: `DONE`
- Output:
  - Envelope standard introdotto:
    - success: `{ success, data, meta }`
    - error: `{ success:false, error:{code,message,details?}, meta }`
  - Helper centralizzato introdotto:
    - `/app/Support/Api/V1/ApiResponse.php`
  - Rendering JSON forzato su namespace `/api/v1/*`:
    - evita redirect HTML su validation/auth failure
  - Wrapping uniforme degli errori framework (422/401/404/500 ecc.) via exception finalizer:
    - `/bootstrap/app.php`

### Auth middleware dedicato
- Stato: `DONE`
- Output:
  - Middleware token-based introdotto:
    - `/app/Http/Middleware/AuthenticateApiV1.php`
  - Alias middleware registrato:
    - `api.v1.auth` in `/bootstrap/app.php`
  - Supporto header:
    - `Authorization: Bearer <token>`
    - `X-Api-Token: <token>`
  - Configurazione token/pagination introdotta:
    - `/config/spotex.php` (`spotex.api.v1.*`)
    - `/.env.example`:
      - `SPOTEX_API_V1_TOKENS`
      - `SPOTEX_API_V1_DEFAULT_PER_PAGE`
      - `SPOTEX_API_V1_MAX_PER_PAGE`

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/ApiV1SkeletonTest.php` (4 test, OK)
- Test eseguiti:
  - `vendor/bin/phpunit --filter ApiV1SkeletonTest` -> OK
  - `vendor/bin/phpunit --filter 'PricingTaxCheckoutTest|InventoryReservationCheckoutTest'` -> OK
  - `vendor/bin/phpunit` -> OK (`47/47`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK
- Nota:
  - durante un run intermedio `platform:backfill-store --dry-run` è fallito perché lanciato in parallelo a `migrate:fresh` (race condition su tabelle in creazione); rieseguito in seriale con esito `OK`.
  - `php artisan test` non disponibile in questa codebase; usato `vendor/bin/phpunit`.

### Prossimi step immediati suggeriti
1. `API-002`: OAuth2 provider + scope matrix endpoint-by-endpoint.
2. `API-003`: API key private apps con hash/rotation su DB (`api_keys`) e revoca.
3. `SEC-001`: idempotency keys su write API (`POST/PATCH`) con request hash + response cache.

## 2026-04-04 - API-002 (OAuth2 + scopes, fallback static token)

### Stato generale
- Fase in avanzamento: `S4` (API platform foundation)
- Scope completato in questo step: `API-002`

### OAuth2 provider (client_credentials)
- Stato: `DONE`
- Output:
  - Schema OAuth introdotto:
    - `oauth_clients`
    - `oauth_access_tokens`
    - file: `/database/migrations/2026_04_04_020000_create_oauth_api_v1_tables.php`
  - Modelli OAuth introdotti:
    - `/app/Models/OAuthClient.php`
    - `/app/Models/OAuthAccessToken.php`
  - Service OAuth introdotto:
    - `/app/Services/Api/V1/OAuth/OAuthTokenService.php`
    - `/app/Services/Api/V1/OAuth/OAuthException.php`
  - Endpoint token OAuth2 introdotto:
    - `POST /api/v1/oauth/token` (grant supportato: `client_credentials`)
    - controller: `/app/Http/Controllers/Api/V1/OAuthTokenController.php`
  - Command operativo introdotto:
    - `php artisan api:v1:oauth-client:create`
    - registrazione: `/routes/console.php`

### Scope enforcement su `/api/v1`
- Stato: `DONE`
- Output:
  - Middleware scope introduced:
    - `/app/Http/Middleware/EnsureApiV1Scope.php`
    - alias `api.v1.scope` registrato in `/bootstrap/app.php`
  - Route scope-aware:
    - `GET /api/v1/me` -> `read_profile`
    - `GET /api/v1/products` -> `read_products`
    - wiring in `/routes/api.php`

### Compatibilità middleware attuale (fallback)
- Stato: `DONE`
- Output:
  - `AuthenticateApiV1` aggiornato per modalità duale:
    1. prova bearer OAuth access token (`oauth_access_tokens`)
    2. fallback su token statici legacy (`SPOTEX_API_V1_TOKENS`)
  - static token mode mantiene compatibilità piena impostando scope virtuale `*`
  - file aggiornato: `/app/Http/Middleware/AuthenticateApiV1.php`

### Configurazione
- Stato: `DONE`
- Output:
  - Nuove config OAuth in `/config/spotex.php`:
    - `spotex.api.v1.oauth.access_token_ttl_minutes`
    - `spotex.api.v1.oauth.allowed_scopes`
  - Variabili aggiunte in `/.env.example`:
    - `SPOTEX_API_V1_OAUTH_ACCESS_TOKEN_TTL_MINUTES`
    - `SPOTEX_API_V1_OAUTH_ALLOWED_SCOPES`

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/ApiV1OAuthScopesTest.php` (5 test, OK)
- Test aggiornati/ri-eseguiti:
  - `/tests/Feature/ApiV1SkeletonTest.php` (compatibilità fallback + envelope invariato)
- Test eseguiti:
  - `vendor/bin/phpunit --filter 'ApiV1OAuthScopesTest|ApiV1SkeletonTest'` -> OK
  - `vendor/bin/phpunit --filter 'PricingTaxCheckoutTest|InventoryReservationCheckoutTest|PaymentFlowTest'` -> OK
  - `vendor/bin/phpunit` -> OK (`52/52`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK
  - `php artisan list | rg 'api:v1:oauth-client:create'` -> comando disponibile
- Nota:
  - durante una verifica intermedia, `platform:backfill-store --dry-run` è fallito perché lanciato in parallelo a `migrate:fresh`; rieseguito in seriale con esito `OK`.
  - `php artisan test` non disponibile in questa codebase; usato `vendor/bin/phpunit`.

### Prossimi step immediati suggeriti
1. `API-003`: private API keys su tabella dedicata (`api_keys`) con hashing, rotazione e revoca.
2. `SEC-001`: idempotency keys per write API (`POST/PATCH`) con request hash e replay-safe response cache.
3. Estendere scope matrix ai prossimi endpoint business (`orders`, `inventory`, `customers`) prima di `API-004`/`API-005`.

## 2026-04-04 - API-003 (private API keys con hash/rotation/revoke)

### Stato generale
- Fase in avanzamento: `S4` (API platform foundation)
- Scope completato in questo step: `API-003`

### Private API keys (`api_keys`)
- Stato: `DONE`
- Output:
  - Tabella dedicata introdotta:
    - `api_keys`
    - file: `/database/migrations/2026_04_04_030000_create_api_keys_table.php`
  - Modello introdotto:
    - `/app/Models/ApiKey.php`
  - Relazione store aggiornata:
    - `/app/Models/Store.php` (`apiKeys()`)

### Service API keys (hash + rotate + revoke)
- Stato: `DONE`
- Output:
  - Service introdotto:
    - `/app/Services/Api/V1/ApiKey/ApiKeyService.php`
    - `/app/Services/Api/V1/ApiKey/ApiKeyException.php`
  - Capacità implementate:
    - emissione chiave privata con salvataggio solo hash (`sha256`)
    - risoluzione key by-hash + update `last_used_at`
    - rotazione atomica (crea nuova key + revoca precedente nella stessa transazione)
    - revoca esplicita idempotente
    - validazione scope riusando la stessa infrastructure di scope (`OAuthTokenService`)

### Integrazione middleware `/api/v1`
- Stato: `DONE`
- Output:
  - `AuthenticateApiV1` aggiornato in modalità tri-level compatibile:
    1. OAuth bearer token (`oauth_access_tokens`)
    2. Private API key hashata (`api_keys`)
    3. Fallback static token legacy (`SPOTEX_API_V1_TOKENS`)
  - Header supportati:
    - `Authorization: Bearer <token>`
    - `X-Api-Token: <token>`
    - `X-Api-Key: <token>`
  - auth mode esposto su `/api/v1/me`: `api_key`
  - file aggiornato:
    - `/app/Http/Middleware/AuthenticateApiV1.php`

### Operatività (command line)
- Stato: `DONE`
- Output:
  - Nuovi comandi Artisan:
    - `php artisan api:v1:api-key:create`
    - `php artisan api:v1:api-key:rotate`
    - `php artisan api:v1:api-key:revoke`
  - File:
    - `/routes/console.php`

### Configurazione
- Stato: `DONE`
- Output:
  - Config API v1 privata aggiunta in `/config/spotex.php`:
    - `spotex.api.v1.private_keys.prefix`
  - Variabile env aggiunta in `/.env.example`:
    - `SPOTEX_API_V1_PRIVATE_KEY_PREFIX`

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/ApiV1PrivateApiKeysTest.php` (5 test)
- Copertura test:
  - scope enforcement riusato da middleware `api.v1.scope`
  - supporto header `X-Api-Key`
  - rotazione (old revoked + new active)
  - revoke
  - store isolation

### Prossimi step immediati suggeriti
1. `SEC-001`: idempotency keys su write API (`POST/PATCH`) con request hash e replay-safe response cache.
2. Estendere scope matrix ai prossimi endpoint business (`orders`, `inventory`, `customers`) prima di `API-004`/`API-005`.
3. Hardening operativo API key: policy rotazione periodica + audit event (`OBS-001`).

## 2026-04-04 - SEC-001 (Idempotency-Key su write API)

### Stato generale
- Fase in avanzamento: `S4` (API platform foundation)
- Scope completato in questo step: `SEC-001`

### Idempotency storage
- Stato: `DONE`
- Output:
  - Tabella dedicata introdotta:
    - `idempotency_keys`
    - file: `/database/migrations/2026_04_04_040000_create_idempotency_keys_table.php`
  - Modello introdotto:
    - `/app/Models/IdempotencyKey.php`
  - Relazione store aggiornata:
    - `/app/Models/Store.php` (`idempotencyKeys()`)

### Middleware write-safe per `/api/v1`
- Stato: `DONE`
- Output:
  - Middleware introdotto:
    - `/app/Http/Middleware/EnsureApiV1Idempotency.php`
    - alias `api.v1.idempotency` registrato in `/bootstrap/app.php`
  - Wiring route aggiornato:
    - gruppo protected `/api/v1` ora usa `api.v1.auth + api.v1.idempotency`
    - i `GET` restano compatibili: enforcement solo sui metodi write configurati (`POST/PATCH/PUT`)
  - Regole implementate:
    - header obbligatorio `Idempotency-Key` sui write
    - conflict `409` se stessa key con payload diverso
    - replay response originale se stessa key + stesso payload
    - rilascio reservation key se la request lancia eccezione prima della risposta

### Service idempotency
- Stato: `DONE`
- Output:
  - Service introdotto:
    - `/app/Services/Api/V1/Idempotency/IdempotencyService.php`
  - Capacità implementate:
    - hash deterministico request (`method + path + query + body + content-type`)
    - reserve key con TTL
    - replay response + header `Idempotency-Replayed`
    - prune record scaduti

### Configurazione
- Stato: `DONE`
- Output:
  - Nuove config in `/config/spotex.php`:
    - `spotex.api.v1.idempotency.enabled`
    - `spotex.api.v1.idempotency.header`
    - `spotex.api.v1.idempotency.required_methods`
    - `spotex.api.v1.idempotency.ttl_hours`
    - `spotex.api.v1.idempotency.key_max_length`
  - Variabili env aggiunte in `/.env.example`:
    - `SPOTEX_API_V1_IDEMPOTENCY_ENABLED`
    - `SPOTEX_API_V1_IDEMPOTENCY_HEADER`
    - `SPOTEX_API_V1_IDEMPOTENCY_REQUIRED_METHODS`
    - `SPOTEX_API_V1_IDEMPOTENCY_TTL_HOURS`
    - `SPOTEX_API_V1_IDEMPOTENCY_KEY_MAX_LENGTH`

### Operatività (command line)
- Stato: `DONE`
- Output:
  - Comando Artisan introdotto:
    - `php artisan api:v1:idempotency:prune`
  - Scheduling:
    - prune hourly registrato in `/routes/console.php`

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/ApiV1IdempotencyTest.php` (4 test)
- Copertura test:
  - `Idempotency-Key` obbligatoria su write
  - replay stesso payload
  - conflict con payload diverso
  - compatibilità GET senza header idempotency
- Test eseguiti:
  - `vendor/bin/phpunit --filter 'ApiV1IdempotencyTest|ApiV1PrivateApiKeysTest|ApiV1OAuthScopesTest|ApiV1SkeletonTest'` -> OK
  - `vendor/bin/phpunit` -> OK (`61/61`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK (rieseguito serialmente)
  - `php artisan list | rg 'api:v1:idempotency:prune'` -> comando disponibile

### Nota operativa
- Durante una verifica intermedia in parallelo, `platform:backfill-store --dry-run` ha fallito per race con `migrate:fresh`; rieseguito in seriale con esito `OK`.

### Prossimi step immediati suggeriti
1. Estendere la scope matrix ai primi endpoint write business (`orders`, `inventory`) prima di `API-004`.
2. Applicare `api.v1.idempotency` ai write endpoint business man mano che vengono introdotti (oltre gli endpoint test scaffold).
3. Aggiungere audit event su replay/conflict (`OBS-001`) per monitoraggio operativo.

## 2026-04-04 - API-004 prep (scope matrix estesa + primi endpoint write business)

### Stato generale
- Fase in avanzamento: transizione `S4 -> S5`
- Scope completato in questo step: `API-004 prep` (baseline catalog write)

### Scope matrix estesa su `/api/v1`
- Stato: `DONE (baseline products)`
- Output:
  - Matrix endpoint-by-endpoint aggiornata:
    - `GET /api/v1/products` -> `read_products`
    - `GET /api/v1/products/{product}` -> `read_products`
    - `POST /api/v1/products` -> `write_products`
    - `PATCH /api/v1/products/{product}` -> `write_products`
  - Wiring routes aggiornato in:
    - `/routes/api.php`

### Primi endpoint write business (catalog)
- Stato: `DONE (products MVP write)`
- Output:
  - `ProductController` esteso con:
    - `show()`
    - `store()`
    - `update()`
  - Capacità incluse:
    - validazioni input per create/update
    - slug generation + dedup per store
    - validazione category nel perimetro store corrente
    - payload uniforme `item` con campi catalogo principali
  - File:
    - `/app/Http/Controllers/Api/V1/ProductController.php`

### Compatibilità idempotency/auth
- Stato: `DONE`
- Output:
  - Endpoint write nuovi sono automaticamente protetti da:
    - `api.v1.auth`
    - `api.v1.idempotency` (header obbligatorio su write)
    - `api.v1.scope:write_products`
  - Compatibilità confermata per auth mode:
    - static token legacy
    - OAuth2 scope-based
    - private API key scope-based

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/ApiV1CatalogWritePrepTest.php` (4 test)
- Copertura test:
  - scope matrix: read vs write scope enforcement
  - create/update prodotto via static token
  - replay idempotent su endpoint write reale (`POST /products`)
  - write con private API key scope-aware
- Test eseguiti:
  - `vendor/bin/phpunit --filter 'ApiV1CatalogWritePrepTest|ApiV1IdempotencyTest|ApiV1PrivateApiKeysTest|ApiV1OAuthScopesTest|ApiV1SkeletonTest'` -> OK
  - `vendor/bin/phpunit` -> OK (`65/65`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK (rieseguito serialmente)
  - `php artisan route:list --path=api/v1` -> route v1 aggiornate

### Nota operativa
- Durante una verifica in parallelo, `platform:backfill-store --dry-run` ha fallito per race con `migrate:fresh`; rieseguito in seriale con esito `OK`.

### Prossimi step immediati suggeriti
1. Estendere `API-004` a varianti (`product_variants`) con scope `read_products/write_products`.
2. Aggiungere endpoint inventory API (`read_inventory/write_inventory`) collegati a `InventoryLedgerService`.
3. Preparare primi endpoint `API-005` (`orders`) con scope `read_orders/write_orders` e idempotency nativa sulle write.

## 2026-04-04 - API-004 prep avanzamento (varianti + inventory API + scope matrix)

### Stato generale
- Fase in avanzamento: transizione `S4 -> S5`
- Scope completato in questo step: estensione `API-004 prep` su `variants` + `inventory`

### Scope matrix estesa su `/api/v1`
- Stato: `DONE (products + variants + inventory baseline)`
- Output:
  - Matrix endpoint-by-endpoint aggiornata:
    - `GET /api/v1/variants` -> `read_products`
    - `GET /api/v1/variants/{variant}` -> `read_products`
    - `POST /api/v1/variants` -> `write_products`
    - `PATCH /api/v1/variants/{variant}` -> `write_products`
    - `GET /api/v1/inventory/levels` -> `read_inventory`
    - `POST /api/v1/inventory/movements` -> `write_inventory`
  - Wiring routes aggiornato in:
    - `/routes/api.php`

### Endpoint business introdotti
- Stato: `DONE`
- Output:
  - Controller varianti introdotto/esteso:
    - `/app/Http/Controllers/Api/V1/ProductVariantController.php`
    - endpoint `index/show/store/update`
    - validazioni scope/store-aware + payload uniforme `item`
  - Controller inventory introdotto:
    - `/app/Http/Controllers/Api/V1/InventoryController.php`
    - endpoint `levels` (projection) + `movement` (write via `InventoryLedgerService`)
    - mapping errori business (`inventory_underflow`) e ritorno stato level aggiornato

### Configurazione scope default
- Stato: `DONE`
- Output:
  - Scope di default OAuth/API key estesi in:
    - `/config/spotex.php`
    - `/.env.example`
  - Scope aggiunti:
    - `read_inventory`
    - `write_inventory`

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/ApiV1VariantsInventoryPrepTest.php` (5 test)
- Copertura test:
  - enforcement scope su varianti e inventory
  - write varianti con idempotency replay
  - movement inventory con replay idempotente
  - errore underflow inventory con codice dominio
- Test eseguiti:
  - `vendor/bin/phpunit --filter ApiV1VariantsInventoryPrepTest` -> OK
  - `vendor/bin/phpunit --filter 'ApiV1CatalogWritePrepTest|ApiV1IdempotencyTest|ApiV1PrivateApiKeysTest|ApiV1OAuthScopesTest|ApiV1SkeletonTest|ApiV1VariantsInventoryPrepTest'` -> OK
  - `vendor/bin/phpunit` -> OK (`70/70`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK
  - `php artisan route:list --path=api/v1` -> route v1 aggiornate (`13` route)

### Nota operativa
- Durante il primo run del nuovo test inventory movement c'era un falso negativo dovuto al riuso della stessa `Idempotency-Key` tra caso `403` e caso `201`; corretto separando le key nei due scenari.

### Prossimi step immediati suggeriti
1. Avviare `API-005` con primi endpoint `orders` (`read_orders/write_orders`) riusando middleware auth/scope/idempotency già in place.
2. Introdurre endpoint read/write `customers` con scope dedicati e payload envelope coerente.
3. Iniziare `WEB-001` (outbox transazionale) per eventi `order.*` e `inventory.*` emessi dai write API.

## 2026-04-04 - API-005 initial (primi endpoint orders + scope/idempotency)

### Stato generale
- Fase in avanzamento: transizione `S4 -> S5`
- Scope completato in questo step: `API-005 initial` (orders baseline read/write)

### Scope matrix estesa su `/api/v1`
- Stato: `DONE (orders baseline)`
- Output:
  - Matrix endpoint-by-endpoint aggiornata:
    - `GET /api/v1/orders` -> `read_orders`
    - `GET /api/v1/orders/{order}` -> `read_orders`
    - `POST /api/v1/orders` -> `write_orders`
  - Wiring routes aggiornato in:
    - `/routes/api.php`

### Endpoint orders introdotti
- Stato: `DONE (initial baseline)`
- Output:
  - Controller introdotto:
    - `/app/Http/Controllers/Api/V1/OrderController.php`
  - Capacità implementate:
    - `index()` con paginazione/filter/sort standard envelope v1
    - `show()` con dettaglio ordine + righe ordine
    - `store()` con:
      - validazione payload items (`variant_id`, `quantity`) store-aware
      - pricing resolution via `PriceResolver`
      - tax snapshot via `TaxCalculator`
      - creazione transazionale `orders` + `order_items`
      - flag opzionale `reserve_inventory` con integrazione `InventoryReservationService`
  - Error mapping dominio:
    - errore reservation stock -> `inventory_reservation_failed` (`409`)

### Compatibilità auth/idempotency
- Stato: `DONE`
- Output:
  - Endpoint write `/api/v1/orders` protetto da:
    - `api.v1.auth`
    - `api.v1.idempotency` (header obbligatorio su write)
    - `api.v1.scope:write_orders`
  - Compatibilità confermata con token OAuth scope-based e replay response su stessa key/payload

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/ApiV1OrdersPrepTest.php` (3 test)
- Copertura test:
  - enforcement `read_orders` su endpoint read
  - enforcement `write_orders` su endpoint write
  - create ordine con replay idempotente + verifica endpoint show
- Test eseguiti:
  - `vendor/bin/phpunit --filter ApiV1OrdersPrepTest` -> OK
  - `vendor/bin/phpunit --filter 'ApiV1CatalogWritePrepTest|ApiV1IdempotencyTest|ApiV1PrivateApiKeysTest|ApiV1OAuthScopesTest|ApiV1SkeletonTest|ApiV1VariantsInventoryPrepTest|ApiV1OrdersPrepTest'` -> OK
  - `vendor/bin/phpunit` -> OK (`73/73`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK (rieseguito serialmente)
  - `php artisan route:list --path=api/v1` -> route v1 aggiornate (`16` route)

### Nota operativa
- Durante un run intermedio `platform:backfill-store --dry-run` e `route:list` sono falliti per race con `migrate:fresh` eseguito in parallelo; rieseguiti in seriale con esito `OK`.

### Prossimi step immediati suggeriti
1. Estendere `API-005` ai primi endpoint `customers` (read/write) con scope dedicati.
2. Aggiungere endpoint write orders incrementali (`PATCH` status/fulfillment hooks) mantenendo idempotency.
3. Avviare `WEB-001` outbox transazionale per eventi `order.created`/`order.updated`.

## 2026-04-04 - API-005 progress (customers read/write + scope matrix)

### Stato generale
- Fase in avanzamento: transizione `S4 -> S5`
- Scope completato in questo step: estensione `API-005` su `customers` (read/write baseline)

### Scope matrix estesa su `/api/v1`
- Stato: `DONE (customers baseline)`
- Output:
  - Matrix endpoint-by-endpoint aggiornata:
    - `GET /api/v1/customers` -> `read_customers`
    - `GET /api/v1/customers/{customer}` -> `read_customers`
    - `POST /api/v1/customers` -> `write_customers`
    - `PATCH /api/v1/customers/{customer}` -> `write_customers`
  - Wiring routes aggiornato in:
    - `/routes/api.php`

### Endpoint customers introdotti
- Stato: `DONE (initial baseline)`
- Output:
  - Controller introdotto:
    - `/app/Http/Controllers/Api/V1/CustomerController.php`
  - Capacità implementate:
    - `index()` con paginazione/filter/sort standard envelope v1
    - `show()` con dettaglio customer e metriche (`orders_count`, `total_spent`)
    - `store()` con creazione customer + membership account-level (`account_users.role=customer`)
    - `update()` con modifica profilo customer + ban/unban
  - Tenant isolation:
    - query customers scoped via `account_users.account_id` (no cross-account leak)
    - guard su `show/update` con `404` per customer non appartenente all’account corrente

### Configurazione scope default
- Stato: `DONE`
- Output:
  - Scope di default OAuth/API key estesi in:
    - `/config/spotex.php`
    - `/.env.example`
  - Scope aggiunti:
    - `read_customers`
    - `write_customers`

### Compatibilità auth/idempotency
- Stato: `DONE`
- Output:
  - Endpoint write `/api/v1/customers` e `/api/v1/customers/{customer}` protetti da:
    - `api.v1.auth`
    - `api.v1.idempotency` (header obbligatorio su write)
    - `api.v1.scope:write_customers`
  - Replay response confermato su create customer (`POST`) con stessa key/payload

### Testing e verifica
- Nuovi test:
  - `/tests/Feature/ApiV1CustomersPrepTest.php` (4 test)
- Copertura test:
  - enforcement `read_customers` su endpoint read
  - enforcement `write_customers` su endpoint write
  - create/update customer con replay idempotente
  - isolamento cross-account su endpoint show
- Test eseguiti:
  - `vendor/bin/phpunit --filter ApiV1CustomersPrepTest` -> OK
  - `vendor/bin/phpunit --filter 'ApiV1CatalogWritePrepTest|ApiV1IdempotencyTest|ApiV1PrivateApiKeysTest|ApiV1OAuthScopesTest|ApiV1SkeletonTest|ApiV1VariantsInventoryPrepTest|ApiV1OrdersPrepTest|ApiV1CustomersPrepTest'` -> OK
  - `vendor/bin/phpunit` -> OK (`77/77`)
  - `php artisan migrate:fresh --seed --force` -> OK
  - `php artisan platform:backfill-store --dry-run` -> OK
  - `php artisan route:list --path=api/v1` -> route v1 aggiornate (`20` route)

### Prossimi step immediati suggeriti
1. Completare `API-005` con endpoint write incrementali ordini (`PATCH status/fulfillment hooks`) con matrix scope dettagliata.
2. Avviare `WEB-001` outbox transazionale su eventi `order.created`, `order.updated`, `inventory.movement`.
3. Introdurre `WEB-002` webhook endpoint config + secret rotation policy.
