<?php

/**
 * SPOTEX CMS - FILAMENT BRAND CUSTOMIZATION
 * 
 * Personalizza il tema Filament con i colori brand SPOTEX
 * Aggiungi al file config/filament.php o AdminPanelProvider.php
 */

use Filament\Support\Colors\Color;

return [
    /*
    |--------------------------------------------------------------------------
    | Brand
    |--------------------------------------------------------------------------
    */
    'brand' => [
        'name' => 'SPOTEX CMS',
        'logo' => null, // Percorso al logo
        'logo_height' => '2.5rem',
    ],

    /*
    |--------------------------------------------------------------------------
    | Colors - SPOTEX Brand Colors
    |--------------------------------------------------------------------------
    */
    'colors' => [
        'primary' => Color::Blue,
        'danger' => Color::Red,
        'gray' => Color::Gray,
        'info' => Color::Blue,
        'success' => Color::Green,
        'warning' => Color::Amber,
    ],

    /*
    |--------------------------------------------------------------------------
    | Favicon
    |--------------------------------------------------------------------------
    */
    'favicon_url' => null, // Usa il logo ⚡

    /*
    |--------------------------------------------------------------------------
    | Dark Mode
    |--------------------------------------------------------------------------
    */
    'dark_mode' => true, // Abilita dark mode toggle

    /*
    |--------------------------------------------------------------------------
    | Database Notifications
    |--------------------------------------------------------------------------
    */
    'database_notifications' => [
        'enabled' => true,
        'polling_interval' => '5s',
    ],

    /*
    |--------------------------------------------------------------------------
    | Broadcasting - Notifiche Real-time
    |--------------------------------------------------------------------------
    */
    'broadcasting' => [
        'enabled' => false, // Abilita se usi WebSockets
    ],

    /*
    |--------------------------------------------------------------------------
    | Layout - Responsive Sidebar
    |--------------------------------------------------------------------------
    */
    'layout' => [
        'actions' => [
            'modal' => [
                'actions' => [
                    'alignment' => 'center',
                ],
            ],
        ],
        'forms' => [
            'actions' => [
                'alignment' => 'start',
            ],
        ],
        'footer' => [
            'should_show_logo' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pages
    |--------------------------------------------------------------------------
    */
    'pages' => [
        'auth' => [
            'login' => \Filament\Pages\Auth\Login::class,
            'register' => \Filament\Pages\Auth\Register::class,
            'request_password_reset' => \Filament\Pages\Auth\RequestPasswordReset::class,
            'reset_password' => \Filament\Pages\Auth\ResetPassword::class,
            'verify_email' => \Filament\Pages\Auth\VerifyEmail::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Widgets
    |--------------------------------------------------------------------------
    */
    'widgets' => [
        'account' => [
            'class' => \Filament\Widgets\AccountWidget::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Locale
    |--------------------------------------------------------------------------
    */
    'locale' => 'it', // Italiano
];
