<?php

return [
    'defaults' => [
        'guard' => 'customer',
        'passwords' => 'users',
    ],

    'guards' => [
        'customer' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        'admin' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        // Alias di compatibilità per codice legacy/tests che usa ancora "web".
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,

    'verification' => [
        'throttle' => 60,
    ],

    'invitations' => [
        'expires_hours' => (int) env('USER_INVITATION_EXPIRES_HOURS', 72),
    ],

    'admin_session_cookie' => env('ADMIN_SESSION_COOKIE', 'spotex_admin_session'),
];
