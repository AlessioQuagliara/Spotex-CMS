0) Stato avanzamento (snapshot 2026-04-04)
- Completati: `A-001`, `DB-001`, `CTX-001`, `DB-002`, `DB-003`, `CTX-002`, `AUTH-001`, `CAT-001`, `CAT-002`, `INV-001`, `INV-002`, `INV-003`, `PRC-001`, `TAX-001`, `API-001`, `API-002`, `API-003`, `SEC-001`, `API-005` (initial orders baseline).
- In corso: transizione `S4 -> S5` con `API-004/API-005` in progress (scope matrix estesa a catalog + inventory + orders + customers; endpoint `products`, `variants`, `inventory`, `orders`, `customers` disponibili; fulfillment/events outbox ancora pending).
- Dettaglio operativo e file toccati: vedere `PLAN_COMPLETED.md`.

1) Backlog tecnico ordinato per impatto
Impatto Alto
ID	Titolo	Descrizione	Fase	Impatto	Dipendenze
A-001	Tenancy ADR + data isolation model	Decisione architetturale: single DB con store_id + guardrail applicativi + policy accesso	1	Alto	-
DB-001	Tabelle accounts, stores, account_users	Introduzione entità merchant/account e membership ruoli per account	1	Alto	A-001
CTX-001	Store Resolver (host/header/path)	Middleware che risolve current_store da dominio custom o subdomain	1	Alto	DB-001
DB-002	Add store_id a tabelle core	Aggiunta store_id su catalogo, ordini, carrello, coupon, pagine, settings	1	Alto	DB-001
DB-003	Backfill dati + vincoli NOT NULL	Migrazione dati esistenti al primo store + enforcement FK e unique composite	1	Alto	DB-002
AUTH-001	RBAC per account/store	Spostamento ruoli da global user a membership (account_users.role)	1	Alto	DB-001
CTX-002	Scoping query in Filament + Policies	Scope automatico store_id, blocco accesso cross-store	1	Alto	CTX-001, DB-003
CAT-001	Modello opzioni prodotto	Tabelle product_options, product_option_values	1	Alto	DB-002
CAT-002	Modello varianti prodotto	product_variants con SKU, barcode, prezzo, peso, status	1	Alto	CAT-001
INV-001	Inventory per location	Tabelle inventory_locations, inventory_levels	1	Alto	CAT-002
INV-002	Inventory ledger append-only	inventory_ledger con movimenti (sale, reserve, release, restock, adjust)	1	Alto	INV-001
INV-003	Reservation on checkout	Lock stock a livello variante/location durante checkout	1	Alto	INV-002
PRC-001	Price list multi-currency	price_lists, price_list_prices per store/paese/valuta	1	Alto	DB-003, CAT-002
TAX-001	Tax engine per paese	tax_classes, tax_zones, tax_rates, calcolo tasse in checkout	1	Alto	PRC-001
API-001	API framework /api/v1	Versioning, envelope error, pagination, filtering, sort standard	2	Alto	CTX-001, AUTH-001
API-002	OAuth2 provider + scopes	Flusso app pubbliche con token scope-based (read_products, write_orders)	2	Alto	API-001
API-003	API key private apps	Chiavi statiche firmate e ruotate per app private merchant	2	Alto	API-001
API-004	Endpoint catalogo pubblici	CRUD prodotti/varianti/inventory via API	2	Alto	CAT-002, INV-002, API-001
API-005	Endpoint ordini/clienti	Read/write ordini, clienti, fulfillment events	2	Alto	OMS-001, API-001
WEB-001	Outbox events	Tabella outbox transazionale per eventi dominio	2	Alto	DB-003
WEB-002	Webhook endpoint config	webhook_endpoints con secret, eventi sottoscritti, status	2	Alto	WEB-001
WEB-003	Delivery engine retry/DLQ	Worker con exponential backoff, dead letter, replay	2	Alto	WEB-002
OMS-001	Fulfillment parziale	fulfillments, fulfillment_items, stato per riga ordine	3	Alto	API-005, INV-002
OMS-002	Resi (RMA)	returns, return_items, motivazioni, status workflow	3	Alto	OMS-001
OMS-003	Refund orchestration	Rimborso parziale/totale Stripe/PayPal con audit trail	3	Alto	OMS-002
ANL-001	Event tracking pipeline	Eventi merchant-first (view, add_to_cart, checkout_step, paid)	3	Alto	API-001
ANL-002	KPI dashboard merchant	Conversion funnel, GMV, AOV, ordini, resi in near-real-time	3	Alto	ANL-001
BILL-001	Catalogo piani + feature matrix	plans, plan_features, limiti base	4	Alto	DB-001
BILL-002	Subscriptions + trial	subscriptions, ciclo trial/start/cancel/past_due	4	Alto	BILL-001
BILL-003	Metering + enforcement limiti	usage_meters, usage_records, blocco soft/hard feature	4	Alto	BILL-002
APP-001	App install lifecycle	apps, app_installs, install/uninstall token revoke	4	Alto	API-002, WEB-002
MKT-001	Abandoned cart engine	rilevazione carrelli abbandonati + trigger eventi	4	Alto	ANL-001
MKT-002	Automation engine	Workflow builder base (trigger, delay, condition, action)	4	Alto	MKT-001
OBS-001	Audit log critico	audit_logs per azioni admin/app/api (before/after)	1	Alto	DB-001
OBS-002	SLO + alerting stack	Metriche coda/webhook/API/payment con allarmi	2	Alto	API-001
Impatto Medio
ID	Titolo	Descrizione	Fase	Impatto	Dipendenze
SEC-001	Idempotency keys API write	Supporto header Idempotency-Key su POST/PATCH sensibili	2	Medio	API-001
WEB-004	Firma webhook outbound HMAC	Firma payload + timestamp anti-replay	2	Medio	WEB-002
FEED-001	Google Merchant feed	Export feed prodotti varianti per store	2	Medio	API-004
FEED-002	Meta Catalog feed	Export feed Meta con mapping availability/price	2	Medio	API-004
CRM-001	Customer timeline	Vista eventi cliente (ordini, ticket, email, ritorni)	3	Medio	OMS-001, ANL-001
CRM-002	Segmentazione RFM	Segmenti dinamici recency/frequency/monetary	3	Medio	ANL-001
ANL-003	LTV e cohort jobs	Job notturni per cohort retention e LTV 30/60/90	3	Medio	ANL-001
MKT-003	Email templates + provider abstraction	Template versionati, provider failover, tracking opens/clicks	4	Medio	MKT-002
APP-002	Marketplace minimal UI	Listing app private/public, stato review, changelog	4	Medio	APP-001
OPS-001	Queue topology multi-queue	Separazione queue: payments, webhooks, automation, analytics	2	Medio	WEB-003
QA-001	Contract test suite API	Pact/OpenAPI tests + smoke E2E install app	2	Medio	API-001
QA-002	Multi-tenant isolation tests	Test automatici anti data-leak cross-store	1	Medio	CTX-002
Impatto Basso
ID	Titolo	Descrizione	Fase	Impatto	Dipendenze
OPS-002	Tenant onboarding wizard	Setup guidato store iniziale, dominio, valuta, tasse	4	Basso	DB-001, CTX-001
OBS-003	Cost dashboards	Costo per ordine, costo webhook, costo email per store	4	Basso	ANL-002, OBS-002
DOC-001	Developer portal API	Docs interactive + snippet SDK	2	Basso	API-001
DOC-002	Runbook incidenti	Runbook webhook down, queue backlog, payment mismatch	2	Basso	OBS-002
2) Schema database evolutivo
2.1 Nuove tabelle (core multi-tenant)
Tabella	Colonne chiave	Indici suggeriti
accounts	id, name, status, owner_user_id	status, owner_user_id
account_users	account_id, user_id, role, status	unique(account_id,user_id), role
stores	id, account_id, name, slug, default_locale, default_currency, timezone, status	unique(account_id,slug), account_id,status
store_domains	store_id, domain, is_primary, verified_at	unique(domain), store_id,is_primary
store_locales	store_id, locale, is_default	unique(store_id,locale)
store_currencies	store_id, currency, is_default, is_enabled	unique(store_id,currency)
store_settings	store_id, key, value_json	unique(store_id,key)
2.2 Nuove tabelle (catalogo, varianti, inventory)
Tabella	Colonne chiave	Indici suggeriti
product_options	id, store_id, product_id, name, position	product_id,position
product_option_values	id, store_id, product_option_id, value, position	product_option_id,position, unique(product_option_id,value)
product_variants	id, store_id, product_id, sku, barcode, price, compare_at_price, status, weight	unique(store_id,sku), product_id,status
variant_option_value	variant_id, option_value_id	unique(variant_id,option_value_id), option_value_id
inventory_locations	id, store_id, name, code, priority, is_active	unique(store_id,code), store_id,is_active
inventory_levels	store_id, variant_id, location_id, on_hand, reserved, available	unique(variant_id,location_id), store_id,available
inventory_ledger	id, store_id, variant_id, location_id, event_type, qty_delta, reference_type, reference_id, idempotency_key, created_at	store_id,variant_id,created_at, unique(store_id,idempotency_key)
inventory_reservations	id, store_id, variant_id, order_id, qty, expires_at, status	store_id,status,expires_at, order_id
2.3 Nuove tabelle (pricing e tax)
Tabella	Colonne chiave	Indici suggeriti
price_lists	id, store_id, name, currency, country_code, channel, is_default	store_id,currency,country_code,channel
price_list_prices	price_list_id, variant_id, amount, compare_at_amount	unique(price_list_id,variant_id), variant_id
tax_classes	id, store_id, name, code	unique(store_id,code)
tax_zones	id, store_id, country_code, region_code, postal_pattern	store_id,country_code,region_code
tax_rates	id, store_id, tax_zone_id, tax_class_id, rate, is_inclusive, priority	tax_zone_id,tax_class_id,priority
2.4 Nuove tabelle (API, app ecosystem, webhook)
Tabella	Colonne chiave	Indici suggeriti
apps	id, owner_account_id, name, type(private/public), status	owner_account_id,status
app_installs	id, app_id, store_id, status, installed_at, uninstalled_at	unique(app_id,store_id), store_id,status
api_keys	id, store_id, name, key_hash, scopes_json, last_used_at, revoked_at	store_id,revoked_at, last_used_at
webhook_endpoints	id, store_id, url, secret_hash, events_json, status, timeout_ms	store_id,status
outbox_events	id, store_id, event_name, aggregate_type, aggregate_id, payload_json, status, available_at	status,available_at, store_id,event_name
webhook_deliveries	id, store_id, endpoint_id, outbox_event_id, attempt, status, next_retry_at, response_code	status,next_retry_at, endpoint_id,status
idempotency_keys	id, store_id, key, request_hash, response_json, expires_at	unique(store_id,key), expires_at
2.5 Nuove tabelle (OMS/WMS)
Tabella	Colonne chiave	Indici suggeriti
fulfillments	id, store_id, order_id, location_id, status, carrier, tracking_number, shipped_at	store_id,status, order_id
fulfillment_items	fulfillment_id, order_item_id, qty	unique(fulfillment_id,order_item_id), order_item_id
returns	id, store_id, order_id, customer_id, status, reason, requested_at, approved_at	store_id,status, order_id
return_items	return_id, order_item_id, qty, condition, resolution	return_id, order_item_id
refunds	id, store_id, order_id, payment_provider, provider_ref, amount, status	store_id,status, order_id
2.6 Nuove tabelle (marketing, analytics, billing, audit)
Tabella	Colonne chiave	Indici suggeriti
abandoned_carts	id, store_id, cart_id, customer_id, abandoned_at, recovered_at, status	store_id,status,abandoned_at, customer_id
segments	id, store_id, name, rule_json, is_dynamic	store_id,is_dynamic
automations	id, store_id, name, trigger, flow_json, status	store_id,status
automation_runs	id, store_id, automation_id, entity_type, entity_id, status, scheduled_at, executed_at	store_id,status,scheduled_at, automation_id
event_stream	id, store_id, event_name, entity_type, entity_id, payload_json, occurred_at	store_id,event_name,occurred_at, entity_type,entity_id
kpi_daily_snapshots	store_id, day, gmv, orders, aov, conversion_rate	unique(store_id,day)
plans	id, code, name, price_monthly, trial_days, is_active	unique(code), is_active
plan_features	plan_id, feature_code, limit_value	unique(plan_id,feature_code)
subscriptions	id, account_id, plan_id, status, trial_ends_at, current_period_end	account_id,status, plan_id
usage_records	id, account_id, feature_code, qty, period_start, period_end	account_id,feature_code,period_start
audit_logs	id, store_id, account_id, actor_type, actor_id, action, entity_type, entity_id, before_json, after_json, ip, created_at	store_id,created_at, entity_type,entity_id
2.7 Modifiche tabelle esistenti
Tabella esistente	Modifica
products	aggiungere store_id, tax_class_id, status, published_at; unique store_id+slug
categories	aggiungere store_id; unique store_id+slug
orders	aggiungere store_id, customer_id, currency, fx_rate, tax_total, discount_total, fulfillment_status
order_items	aggiungere store_id, variant_id, inventory_location_id, tax_class_id, unit_price_snapshot
carts (se persistente)	aggiungere store_id, currency, locale, abandoned_at
coupons	aggiungere store_id, channel, starts_at, ends_at, usage_limit
pages, settings, navigation_items	aggiungere store_id per CMS per-store
users	mantenere utenti backoffice piattaforma; ruoli spostati in account_users
2.8 Relazioni chiave
Relazione	Cardinalità
accounts -> stores	1:N
accounts -> account_users <- users	N:M con ruolo
stores -> products -> product_variants	1:N:N
product_variants -> inventory_levels -> inventory_locations	1:N:N
orders -> order_items -> product_variants	1:N:1
orders -> fulfillments -> fulfillment_items	1:N:N
orders -> returns -> return_items	1:N:N
stores -> webhook_endpoints -> webhook_deliveries	1:N:N
plans -> subscriptions -> accounts	1:N:N
2.9 Pattern architetturali raccomandati
Pattern	Uso concreto
Inventory ledger append-only	inventory_ledger come source of truth, inventory_levels come projection
Transactional outbox	Creazione evento nello stesso commit DB dell’azione business
Idempotency keys	Protezione write API e webhook processing
Tenant-safe unique constraints	Sempre includere store_id o account_id nelle unique
Queue segregation	Code separate per payment/webhook/automation/analytics
Soft delete strategico	products, variants, webhook_endpoints, apps
3) Milestone sprint-by-sprint (team 2-3 senior full-stack)
Pianificazione
Sprint	Durata	Obiettivo	Task inclusi	Effort stimato	Rischio principale	Mitigazione
S1	2 settimane	Fondazioni tenancy	A-001, DB-001, CTX-001, AUTH-001, OBS-001 (base)	190-210h (24-28 gg-uomo)	Scelta tenancy non sostenibile	ADR firmata entro giorno 3 + spike tecnico
S2	2 settimane	Scoping dati e varianti base	DB-002, DB-003, CTX-002, CAT-001, CAT-002, QA-002	190-220h (24-30 gg-uomo)	Data leak cross-store	Test isolamento obbligatori in CI + policy review
S3	1 settimana	Inventory/tax minimum operable	INV-001, INV-002, INV-003, PRC-001, TAX-001	90-110h (12-14 gg-uomo)	Incongruenze stock checkout	Ledger append-only + reconciliation job giornaliero
S4	2 settimane	API platform foundation	API-001, API-002, API-003, SEC-001	190-210h (24-28 gg-uomo)	Scope OAuth incompleti	Matrice scope-by-endpoint + test contract
S5	2 settimane	API business + webhook outbox	API-004, API-005, WEB-001, WEB-002, WEB-004	190-220h (24-30 gg-uomo)	Eventi duplicati/perduti	Outbox transazionale + idempotency obbligatoria
S6	1 settimana	Omnichannel hardening	WEB-003, FEED-001, FEED-002, OPS-001, DOC-001	90-110h (12-14 gg-uomo)	Backlog coda webhook	Retry policy + alert queue lag
S7	2 settimane	OMS/WMS profondo	OMS-001, OMS-002, OMS-003	190-210h (24-28 gg-uomo)	Complessità stati fulfillment/resi	State machine esplicita + transition tests
S8	2 settimane	CRM + BI merchant-first	CRM-001, CRM-002, ANL-001, ANL-002, ANL-003	190-220h (24-30 gg-uomo)	KPI incoerenti con source data	Data dictionary + validazione daily snapshot
S9	2 settimane	Marketing automation nativa	MKT-001, MKT-002, MKT-003	190-210h (24-28 gg-uomo)	Rumore email e spam score	Throttling campaign + warm-up domini
S10	2 settimane	SaaS billing + app ecosystem	BILL-001, BILL-002, APP-001, APP-002	190-220h (24-30 gg-uomo)	Edge case billing/trial	Test matrix piani+trial+upgrade+downgrade
S11	1 settimana	Growth hardening + go-live	BILL-003, OBS-002, OBS-003, QA-001, DOC-002, OPS-002	90-120h (12-16 gg-uomo)	Limiti non applicati correttamente	Metering shadow mode 3 giorni + switch
4) Priorità immediate per i prossimi 14 giorni
Obiettivi dei prossimi 14 giorni
Priorità	Task operativo	Output atteso	Effort
P0	Formalizzare ADR tenancy (store_id row-level)	Documento decisionale con alternative e tradeoff	6-8h
P0	Creare accounts, stores, account_users	Migrazioni + model + seed bootstrap merchant default	12-16h
P0	Implementare StoreResolver middleware	current_store risolto da dominio e testato	10-14h
P0	Aggiungere store_id a products/categories/orders/order_items/pages/settings	Migrazioni additive con FK e index	16-22h
P0	Script backfill dati esistenti	Command idempotente platform:backfill-store	8-12h
P0	Scoping Filament per store	Query e policy filtrate, no cross-store	14-20h
P1	Modello opzioni + varianti	CRUD base varianti con SKU univoco per store	16-24h
P1	Inventory location + levels	Tabelle + servizi base di aggiornamento stock	14-20h
P1	Test isolamento multi-store	Feature tests per leakage prevention	10-14h
P1	API skeleton /api/v1	Routing versionato + auth middleware + formato errore standard	12-16h
Deliverable “Done” entro giorno 14
Deliverable	Criterio di accettazione
Multi-tenant base attivo	Ogni record business core ha store_id e viene filtrato correttamente
Backfill completato	Dati legacy agganciati al store default senza perdita
Varianti MVP	Un prodotto può avere N varianti con SKU e prezzo
Inventory MVP	Disponibilità variante leggibile e aggiornabile per location
API v1 skeleton	Endpoint health + auth funzionanti con test automatici
5) Raccomandazioni architettura & osservabilità
5.1 Architettura runtime
Area	Raccomandazione
Multi-tenant	Single DB + row-level isolation (store_id) + policy centralizzate
Write model	Comandi applicativi (service layer) con transazioni esplicite
Event delivery	Outbox pattern + worker dedicati webhooks
Inventory	Ledger append-only + projection table inventory_levels
API	Versioning /api/v1, scope OAuth granulari, idempotency write
Extensibility	Eventi dominio canonici (order.created, order.paid, order.fulfilled)
5.2 Audit log (azioni critiche)
Evento da loggare	Campi minimi
Modifica prezzi/stock	store_id, actor, entity, before, after, reason
Cambi stato ordine/fulfillment/reso	order_id, from_status, to_status, actor
Refund e operazioni pagamento	provider, provider_ref, amount, result
Install/uninstall app	app_id, store_id, actor, scopes
Cambi piano billing	account_id, old_plan, new_plan, effective_at
5.3 Metriche business e sistema
Tipo	Metriche
Business	GMV, AOV, conversion rate, checkout drop-off, recovery abandoned cart, repeat purchase rate, LTV 30/90
API	RPS, p95 latency, 4xx/5xx rate, OAuth token errors
Webhook	delivery success rate, retry count, DLQ size, p95 delivery lag
Queue	queue depth, lag time, failed jobs, retry age
Pagamenti	auth success rate, webhook-to-order lag, mismatch paid/order_status
DB	slow query count, lock wait, connection pool saturation
5.4 Stack osservabilità consigliato
Livello	Tool consigliato
App insights rapidi	Laravel Pulse
Metriche/SLO	Prometheus + Grafana
Error tracking	Sentry
Tracing distribuito	OpenTelemetry SDK + Collector
Log centralizzati	Loki oppure ELK, formato JSON strutturato
5.5 Alerting operativo minimo
Alert	Soglia iniziale
Webhook failure rate	> 2% per 10 minuti
Queue lag webhooks	> 60s per 5 minuti
Queue lag payments	> 20s per 3 minuti
API 5xx	> 1% per 5 minuti
Payment mismatch	> 3 ordini in 10 minuti
DB slow queries	> 50 query > 500ms in 10 minuti
5.6 Governance tecnica
Pratica	Regola
Migrazioni	Solo additive + backfill + enforce (3 step)
Feature flags	Ogni capability nuova dietro flag per account/store
API contracts	OpenAPI versionata + contract tests in CI
Rollout	Canary su subset store interni prima del go-live merchant
Security	Secret rotation webhook/app keys ogni 90 giorni
