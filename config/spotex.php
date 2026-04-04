<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Platform Mode
    |--------------------------------------------------------------------------
    |
    | Determina se il CMS opera in modalità Platform per commissioni automatiche
    |
    | Opzioni:
    | - 'off': Modalità standard (default) - nessuna commissione
    | - 'stripe_connect': Abilita Stripe Connect per commissioni platform
    | - 'paypal_multiparty': Abilita PayPal Multiparty/Commerce Platform
    |
    | NOTA: Per attivare una modalità, configurare anche le credenziali
    | nella tabella merchant_payment_settings tramite admin Filament
    |
    */
    'platform_mode' => env('SPOTEX_PLATFORM_MODE', 'off'),

    /*
    |--------------------------------------------------------------------------
    | Platform Settings
    |--------------------------------------------------------------------------
    */
    'stripe_connect' => [
        // Stripe platform account secret key (NON quella del merchant)
        'platform_secret' => env('STRIPE_PLATFORM_SECRET'),
    ],

    'paypal_multiparty' => [
        // PayPal partner credentials (se disponibili)
        'partner_client_id' => env('PAYPAL_PARTNER_CLIENT_ID'),
        'partner_secret' => env('PAYPAL_PARTNER_SECRET'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenancy Settings
    |--------------------------------------------------------------------------
    |
    | Strategia attuale: single DB + isolamento row-level su store_id.
    | Il resolver prova in ordine:
    | 1) Dominio custom mappato in store_domains
    | 2) Subdomain rispetto a base_domain
    | 3) Path prefix /{path_prefix}/{store_slug}
    | 4) Header X-Store-Slug / X-Store-Id (solo ambienti consentiti)
    | 5) Fallback allo store attivo più vecchio
    |
    */
    'tenancy' => [
        'base_domain' => env('SPOTEX_TENANCY_BASE_DOMAIN'),
        'path_prefix_enabled' => env('SPOTEX_TENANCY_PATH_PREFIX_ENABLED', true),
        'path_prefix' => env('SPOTEX_TENANCY_PATH_PREFIX', 's'),
        'allow_header_resolution' => env('SPOTEX_TENANCY_ALLOW_HEADER_RESOLUTION', true),
        'header_resolution_environments' => ['local', 'testing'],
        'fallback_to_default_store' => env('SPOTEX_TENANCY_FALLBACK_TO_DEFAULT_STORE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Inventory Settings
    |--------------------------------------------------------------------------
    */
    'inventory' => [
        'reservation_ttl_minutes' => (int) env('SPOTEX_INVENTORY_RESERVATION_TTL_MINUTES', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | API v1 Settings
    |--------------------------------------------------------------------------
    */
    'api' => [
        'v1' => [
            'tokens' => array_values(array_filter(array_map(
                static fn (string $value): string => trim($value),
                explode(',', (string) env('SPOTEX_API_V1_TOKENS', ''))
            ))),
            'oauth' => [
                'access_token_ttl_minutes' => (int) env('SPOTEX_API_V1_OAUTH_ACCESS_TOKEN_TTL_MINUTES', 120),
                'allowed_scopes' => array_values(array_filter(array_map(
                    static fn (string $value): string => trim($value),
                    explode(',', (string) env(
                        'SPOTEX_API_V1_OAUTH_ALLOWED_SCOPES',
                        'read_profile,read_products,write_products,read_inventory,write_inventory,read_orders,write_orders,read_customers,write_customers'
                    ))
                ))),
            ],
            'private_keys' => [
                'prefix' => env('SPOTEX_API_V1_PRIVATE_KEY_PREFIX', 'stx_pk_'),
            ],
            'idempotency' => [
                'enabled' => filter_var(env('SPOTEX_API_V1_IDEMPOTENCY_ENABLED', true), FILTER_VALIDATE_BOOL),
                'header' => env('SPOTEX_API_V1_IDEMPOTENCY_HEADER', 'Idempotency-Key'),
                'required_methods' => array_values(array_filter(array_map(
                    static fn (string $value): string => strtoupper(trim($value)),
                    explode(',', (string) env('SPOTEX_API_V1_IDEMPOTENCY_REQUIRED_METHODS', 'POST,PATCH,PUT'))
                ))),
                'ttl_hours' => (int) env('SPOTEX_API_V1_IDEMPOTENCY_TTL_HOURS', 24),
                'key_max_length' => (int) env('SPOTEX_API_V1_IDEMPOTENCY_KEY_MAX_LENGTH', 255),
            ],
            'pagination' => [
                'default_per_page' => (int) env('SPOTEX_API_V1_DEFAULT_PER_PAGE', 20),
                'max_per_page' => (int) env('SPOTEX_API_V1_MAX_PER_PAGE', 100),
            ],
        ],
    ],
];
