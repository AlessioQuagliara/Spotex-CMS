<?php

use App\Models\Account;
use App\Models\OAuthClient;
use App\Models\Store;
use App\Models\StoreDomain;
use App\Models\User;
use App\Services\Api\V1\ApiKey\ApiKeyException;
use App\Services\Api\V1\ApiKey\ApiKeyService;
use App\Services\Api\V1\Idempotency\IdempotencyService;
use App\Services\Api\V1\OAuth\OAuthTokenService;
use App\Services\Inventory\InventoryReservationService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

Artisan::command('platform:backfill-store {--dry-run : Mostra le operazioni senza scrivere sul DB}', function () {
    if (!Schema::hasTable('accounts') || !Schema::hasTable('stores')) {
        $this->error('Tenancy non inizializzata: esegui prima le migrazioni.');
        return self::FAILURE;
    }

    $dryRun = (bool) $this->option('dry-run');
    $adminEmail = trim((string) env('ADMIN_EMAIL', 'admin@spotex.test'));

    $owner = User::query()->where('email', $adminEmail)->first()
        ?? User::query()->whereIn('role', [User::ROLE_OWNER, User::ROLE_ADMIN])->orderBy('id')->first()
        ?? User::query()->orderBy('id')->first();

    $accountName = trim((string) env('SPOTEX_DEFAULT_ACCOUNT_NAME', 'Default Merchant Account'));
    $storeName = trim((string) env('SPOTEX_DEFAULT_STORE_NAME', 'Default Store'));
    $storeSlug = Str::slug(trim((string) env('SPOTEX_DEFAULT_STORE_SLUG', 'default')));

    $persist = function (callable $callback) use ($dryRun) {
        if ($dryRun) {
            return $callback(false);
        }

        return DB::transaction(fn () => $callback(true));
    };

    [$account, $store] = $persist(function (bool $apply) use ($accountName, $storeName, $storeSlug, $owner) {
        if ($apply) {
            $account = Account::query()->firstOrCreate(
                ['name' => $accountName !== '' ? $accountName : 'Default Merchant Account'],
                [
                    'status' => 'active',
                    'owner_user_id' => $owner?->id,
                ]
            );

            if ($owner && !$account->users()->where('users.id', $owner->id)->exists()) {
                $account->users()->attach($owner->id, [
                    'role' => User::ROLE_OWNER,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $store = Store::query()->firstOrCreate(
                [
                    'account_id' => $account->id,
                    'slug' => $storeSlug !== '' ? $storeSlug : 'default',
                ],
                [
                    'name' => $storeName !== '' ? $storeName : 'Default Store',
                    'default_locale' => 'it_IT',
                    'default_currency' => 'EUR',
                    'timezone' => 'Europe/Rome',
                    'status' => Store::STATUS_ACTIVE,
                ]
            );

            $host = parse_url((string) config('app.url'), PHP_URL_HOST);
            if (is_string($host) && $host !== '') {
                StoreDomain::query()->firstOrCreate(
                    ['domain' => strtolower($host)],
                    [
                        'store_id' => $store->id,
                        'is_primary' => true,
                        'verified_at' => now(),
                    ]
                );
            }

            return [$account, $store];
        }

        return [null, null];
    });

    if ($dryRun) {
        $this->warn('[DRY-RUN] Nessuna modifica persistita.');
        $storeId = Store::query()->orderBy('id')->value('id');
        if ($storeId === null) {
            $this->line('[DRY-RUN] Verrebbe creato uno store default.');
            $storeId = 0;
        }
    } else {
        $this->info(sprintf('Store target: #%d (%s)', $store->id, $store->slug));
        $storeId = $store->id;
    }

    $tables = [
        'products',
        'categories',
        'orders',
        'pages',
        'settings',
        'coupons',
        'navigation_items',
    ];

    foreach ($tables as $table) {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'store_id')) {
            continue;
        }

        $count = DB::table($table)->whereNull('store_id')->count();
        if ($count === 0) {
            $this->line("{$table}: niente da backfillare");
            continue;
        }

        if ($dryRun) {
            $this->line("[DRY-RUN] {$table}: {$count} record da aggiornare");
            continue;
        }

        DB::table($table)->whereNull('store_id')->update(['store_id' => $storeId]);
        $this->info("{$table}: aggiornati {$count} record");
    }

    if (Schema::hasTable('order_items') && Schema::hasColumn('order_items', 'store_id')) {
        $rows = DB::table('order_items')
            ->select(['id', 'order_id'])
            ->whereNull('store_id')
            ->orderBy('id')
            ->get();

        if ($rows->isEmpty()) {
            $this->line('order_items: niente da backfillare');
        } elseif ($dryRun) {
            $this->line("[DRY-RUN] order_items: {$rows->count()} record da aggiornare");
        } else {
            foreach ($rows as $row) {
                $resolvedStoreId = DB::table('orders')->where('id', $row->order_id)->value('store_id') ?? $storeId;

                DB::table('order_items')
                    ->where('id', $row->id)
                    ->update(['store_id' => $resolvedStoreId]);
            }

            $this->info('order_items: backfill completato');
        }
    }

    return self::SUCCESS;
})->purpose('Backfill store_id per dati legacy e bootstrap del tenant di default');

Artisan::command('inventory:release-expired {--store-id= : Rilascia solo reservation di uno store specifico} {--limit=200 : Batch size per iterazione}', function () {
    /** @var InventoryReservationService $service */
    $service = app(InventoryReservationService::class);
    $storeId = $this->option('store-id');
    $limit = (int) $this->option('limit');

    $released = $service->releaseExpiredReservations(
        storeId: is_numeric($storeId) ? (int) $storeId : null,
        limit: max(1, $limit)
    );

    $this->info(sprintf('Reservation rilasciate: %d', $released));

    return self::SUCCESS;
})->purpose('Rilascia le inventory reservation scadute e riallinea la disponibilità.');

Artisan::command('api:v1:oauth-client:create {name : Nome client OAuth} {--store-id= : Limita il client a uno store} {--scopes= : Scope separati da virgola} {--client-id= : Client ID custom}', function () {
    if (!Schema::hasTable('oauth_clients')) {
        $this->error('OAuth non inizializzato: esegui prima le migrazioni.');
        return self::FAILURE;
    }

    /** @var OAuthTokenService $oauth */
    $oauth = app(OAuthTokenService::class);

    $name = trim((string) $this->argument('name'));
    $storeIdOption = $this->option('store-id');
    $storeId = is_numeric($storeIdOption) ? (int) $storeIdOption : null;

    if ($storeId !== null && !Store::query()->whereKey($storeId)->exists()) {
        $this->error("Store #{$storeId} non trovato.");
        return self::FAILURE;
    }

    $configuredScopes = $oauth->configuredAllowedScopes();
    if (empty($configuredScopes)) {
        $this->error('Nessuno scope OAuth configurato in spotex.api.v1.oauth.allowed_scopes.');
        return self::FAILURE;
    }

    $scopeOption = $this->option('scopes');
    $requestedScopes = $scopeOption !== null && trim((string) $scopeOption) !== ''
        ? $oauth->parseScopes((string) $scopeOption)
        : $configuredScopes;

    $invalidScopes = array_values(array_diff($requestedScopes, $configuredScopes));
    if (!empty($invalidScopes)) {
        $this->error('Scope non validi: ' . implode(', ', $invalidScopes));
        $this->line('Scope consentiti: ' . implode(', ', $configuredScopes));
        return self::FAILURE;
    }

    $providedClientId = trim((string) ($this->option('client-id') ?? ''));
    $clientId = $providedClientId !== '' ? $providedClientId : ('stx_cli_' . Str::lower(Str::random(20)));

    if (OAuthClient::query()->where('client_id', $clientId)->exists()) {
        $this->error('Client ID già esistente: ' . $clientId);
        return self::FAILURE;
    }

    $clientSecret = 'stx_sec_' . Str::random(40);

    $client = OAuthClient::query()->create([
        'store_id' => $storeId,
        'name' => $name !== '' ? $name : 'OAuth Client',
        'client_id' => $clientId,
        'client_secret_hash' => Hash::make($clientSecret),
        'allowed_scopes_json' => $requestedScopes,
        'is_active' => true,
    ]);

    $this->info('OAuth client creato con successo.');
    $this->line('id: ' . $client->id);
    $this->line('store_id: ' . ($client->store_id ?? 'global'));
    $this->line('client_id: ' . $clientId);
    $this->line('client_secret: ' . $clientSecret);
    $this->line('allowed_scopes: ' . implode(' ', $requestedScopes));
    $this->warn('Salva ora il client_secret: non verrà più mostrato.');

    return self::SUCCESS;
})->purpose('Crea un OAuth client per API v1 (grant client_credentials).');

Artisan::command('api:v1:api-key:create {name : Nome chiave API privata} {--store-id= : Store ID owner della chiave} {--scopes= : Scope separati da virgola}', function () {
    if (!Schema::hasTable('api_keys')) {
        $this->error('API keys non inizializzate: esegui prima le migrazioni.');
        return self::FAILURE;
    }

    /** @var ApiKeyService $apiKeyService */
    $apiKeyService = app(ApiKeyService::class);
    /** @var OAuthTokenService $oauth */
    $oauth = app(OAuthTokenService::class);

    $name = trim((string) $this->argument('name'));
    $storeIdOption = $this->option('store-id');
    $storeId = is_numeric($storeIdOption) ? (int) $storeIdOption : null;

    if ($storeId === null) {
        $storeId = Store::query()->orderBy('id')->value('id');
    }

    if ($storeId === null || !Store::query()->whereKey($storeId)->exists()) {
        $this->error('Store non trovato. Passa --store-id=<id>.');
        return self::FAILURE;
    }

    $scopeOption = $this->option('scopes');
    $requestedScopes = $scopeOption !== null && trim((string) $scopeOption) !== ''
        ? $oauth->parseScopes((string) $scopeOption)
        : [];

    try {
        $created = $apiKeyService->issueKey(
            name: $name,
            storeId: $storeId,
            requestedScopes: $requestedScopes
        );
    } catch (ApiKeyException $exception) {
        $this->error($exception->getMessage());
        return self::FAILURE;
    }

    $this->info('Private API key creata con successo.');
    $this->line('api_key_id: ' . $created['api_key_id']);
    $this->line('store_id: ' . $created['store_id']);
    $this->line('scope: ' . $created['scope']);
    $this->line('api_key: ' . $created['api_key']);
    $this->warn('Salva ora la chiave API: non verrà più mostrata.');

    return self::SUCCESS;
})->purpose('Crea una private API key hashata per API v1.');

Artisan::command('api:v1:api-key:rotate {api_key_id : ID chiave API da ruotare} {--store-id= : Verifica ownership store}', function () {
    if (!Schema::hasTable('api_keys')) {
        $this->error('API keys non inizializzate: esegui prima le migrazioni.');
        return self::FAILURE;
    }

    /** @var ApiKeyService $apiKeyService */
    $apiKeyService = app(ApiKeyService::class);
    $apiKeyId = (int) $this->argument('api_key_id');
    $storeIdOption = $this->option('store-id');
    $storeId = is_numeric($storeIdOption) ? (int) $storeIdOption : null;

    try {
        $rotated = $apiKeyService->rotateKey(
            apiKeyId: $apiKeyId,
            storeId: $storeId
        );
    } catch (ApiKeyException $exception) {
        $this->error($exception->getMessage());
        return self::FAILURE;
    }

    $this->info('Private API key ruotata con successo.');
    $this->line('new_api_key_id: ' . $rotated['api_key_id']);
    $this->line('store_id: ' . $rotated['store_id']);
    $this->line('scope: ' . $rotated['scope']);
    $this->line('api_key: ' . $rotated['api_key']);
    $this->warn('La chiave precedente è stata revocata. Salva ora la nuova chiave.');

    return self::SUCCESS;
})->purpose('Ruota una private API key revocando quella precedente.');

Artisan::command('api:v1:api-key:revoke {api_key_id : ID chiave API da revocare} {--store-id= : Verifica ownership store}', function () {
    if (!Schema::hasTable('api_keys')) {
        $this->error('API keys non inizializzate: esegui prima le migrazioni.');
        return self::FAILURE;
    }

    /** @var ApiKeyService $apiKeyService */
    $apiKeyService = app(ApiKeyService::class);
    $apiKeyId = (int) $this->argument('api_key_id');
    $storeIdOption = $this->option('store-id');
    $storeId = is_numeric($storeIdOption) ? (int) $storeIdOption : null;

    try {
        $revoked = $apiKeyService->revokeKey(
            apiKeyId: $apiKeyId,
            storeId: $storeId
        );
    } catch (ApiKeyException $exception) {
        $this->error($exception->getMessage());
        return self::FAILURE;
    }

    if (!$revoked) {
        $this->warn('La chiave era già revocata.');
        return self::SUCCESS;
    }

    $this->info('Private API key revocata con successo.');

    return self::SUCCESS;
})->purpose('Revoca una private API key per API v1.');

Artisan::command('api:v1:idempotency:prune {--store-id= : Prune solo per uno store specifico} {--limit=1000 : Numero massimo di record da eliminare}', function () {
    if (!Schema::hasTable('idempotency_keys')) {
        $this->error('Idempotency storage non inizializzato: esegui prima le migrazioni.');
        return self::FAILURE;
    }

    /** @var IdempotencyService $idempotency */
    $idempotency = app(IdempotencyService::class);

    $storeIdOption = $this->option('store-id');
    $storeId = is_numeric($storeIdOption) ? (int) $storeIdOption : null;
    $limit = max(1, (int) $this->option('limit'));

    $deleted = $idempotency->pruneExpired(
        storeId: $storeId,
        limit: $limit
    );

    $this->info(sprintf('Idempotency keys eliminate: %d', $deleted));

    return self::SUCCESS;
})->purpose('Rimuove idempotency keys scadute.');

Schedule::command('inventory:release-expired')->everyMinute();
Schedule::command('api:v1:idempotency:prune')->hourly();
