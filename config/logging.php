<?php

$stackChannels = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('LOG_STACK', 'single')),
)));

return [
    'default' => env('LOG_CHANNEL', env('APP_LOG', 'single')),

    'deprecations' => env('LOG_DEPRECATIONS_CHANNEL', 'deprecations'),

    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => $stackChannels === [] ? ['single'] : $stackChannels,
            'ignore_exceptions' => false,
        ],

        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'daily' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 14,
            'replace_placeholders' => true,
        ],

        'null' => [
            'driver' => 'null',
        ],

        'deprecations' => [
            'driver' => 'single',
            'path' => storage_path('logs/php-deprecations.log'),
            'level' => env('LOG_DEPRECATIONS_LEVEL', 'notice'),
            'replace_placeholders' => true,
        ],

        'emergency' => [
            'path' => storage_path('logs/laravel.log'),
        ],
    ],
];
