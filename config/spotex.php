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
];
