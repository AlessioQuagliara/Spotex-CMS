# ADR-001: Tenancy con Row-Level Isolation (`store_id`)

- Data: 2026-04-03
- Stato: Accepted
- Owner: Platform Engineering

## Contesto
Il CMS è nato single-tenant con dati globali (`products`, `orders`, `pages`, `settings`, `coupons`, ecc.).
Per evolvere verso un modello Shopify-like multi-store serve isolamento forte senza bloccare la delivery incrementale.

## Decisione
Adottiamo **single database + row-level isolation** con colonna `store_id` nelle tabelle business.

### Regole principali
1. Ogni nuova tabella business tenant-aware deve includere `store_id` (o `account_id` se dominio account-level).
2. Le query runtime devono essere scoped sul `current_store`.
3. Il `current_store` viene risolto da middleware `StoreResolver` con precedenza:
   1. custom domain (`store_domains.domain`)
   2. subdomain (`{slug}.{base_domain}`)
   3. path (`/{prefix}/{slug}`)
   4. header (`X-Store-Slug`/`X-Store-Id`) solo in `local/testing`
   5. fallback store attivo di default
4. Migrazione dati in 3 step: **additive columns -> backfill -> enforce constraints**.

## Alternative valutate
1. **Database per tenant**:
   - Pro: isolamento forte infra-level.
   - Contro: complessità operativa elevata (migrations, reporting cross-tenant, connessioni).
2. **Schema per tenant**:
   - Pro: buon isolamento logico.
   - Contro: governance complessa su MySQL/PostgreSQL misti e tooling più fragile.
3. **Single DB row-level** (scelta):
   - Pro: rollout incrementale, costo operativo basso, compatibile con codice esistente.
   - Contro: richiede disciplina su policy/scopes e test anti-leak.

## Conseguenze
1. Introduzione tabelle tenancy core: `accounts`, `account_users`, `stores`, `store_domains`, `store_locales`, `store_currencies`, `store_settings`.
2. Colonna `store_id` aggiunta progressivamente alle tabelle core.
3. Necessità di test automatici anti cross-store su flussi frontend, Filament, API, job.

## Rollout
1. S1: fondazioni tenancy (`DB-001`, `CTX-001`) + bootstrap store default.
2. S2: `store_id` su tabelle core + command di backfill idempotente.
3. S2+: enforcement `NOT NULL`, unique composite tenant-safe, policy fail-closed.
