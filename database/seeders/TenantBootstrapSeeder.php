<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\InventoryLocation;
use App\Models\Store;
use App\Models\StoreDomain;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TenantBootstrapSeeder extends Seeder
{
    public function run(): void
    {
        if (!class_exists(Store::class) || !class_exists(Account::class)) {
            return;
        }

        $adminEmail = trim((string) env('ADMIN_EMAIL', 'admin@spotex.test'));
        $owner = User::query()->where('email', $adminEmail)->first()
            ?? User::query()->whereIn('role', [User::ROLE_OWNER, User::ROLE_ADMIN])->orderBy('id')->first()
            ?? User::query()->orderBy('id')->first();

        $accountName = trim((string) env('SPOTEX_DEFAULT_ACCOUNT_NAME', 'Default Merchant Account'));
        $storeName = trim((string) env('SPOTEX_DEFAULT_STORE_NAME', 'Default Store'));
        $storeSlug = Str::slug(trim((string) env('SPOTEX_DEFAULT_STORE_SLUG', 'default')));

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

        if (class_exists(InventoryLocation::class)) {
            InventoryLocation::query()->firstOrCreate(
                [
                    'store_id' => $store->id,
                    'code' => 'main',
                ],
                [
                    'name' => 'Magazzino principale',
                    'priority' => 0,
                    'is_active' => true,
                ]
            );
        }
    }
}
