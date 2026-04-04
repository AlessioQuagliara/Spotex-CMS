<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $coreTables = [
        'products',
        'categories',
        'orders',
        'order_items',
        'pages',
        'settings',
        'coupons',
        'navigation_items',
    ];

    public function up(): void
    {
        if (!Schema::hasTable('stores')) {
            return;
        }

        $defaultStoreId = $this->ensureDefaultStoreId();
        if ($defaultStoreId === null) {
            return;
        }

        $this->backfillStoreIds($defaultStoreId);
        $this->switchToTenantSafeUniqueConstraints();
        $this->enforceStoreIdNotNull();
    }

    public function down(): void
    {
        $this->safeSchema('products', fn (Blueprint $table) => $table->dropUnique('products_store_slug_unique'));
        $this->safeSchema('categories', fn (Blueprint $table) => $table->dropUnique('categories_store_slug_unique'));
        $this->safeSchema('pages', fn (Blueprint $table) => $table->dropUnique('pages_store_slug_unique'));
        $this->safeSchema('settings', fn (Blueprint $table) => $table->dropUnique('settings_store_key_unique'));
        $this->safeSchema('coupons', fn (Blueprint $table) => $table->dropUnique('coupons_store_code_unique'));

        $this->safeSchema('products', fn (Blueprint $table) => $table->unique('slug', 'products_slug_unique'));
        $this->safeSchema('categories', fn (Blueprint $table) => $table->unique('slug', 'categories_slug_unique'));
        $this->safeSchema('categories', fn (Blueprint $table) => $table->unique('name', 'categories_name_unique'));
        $this->safeSchema('pages', fn (Blueprint $table) => $table->unique('slug', 'pages_slug_unique'));
        $this->safeSchema('pages', fn (Blueprint $table) => $table->unique('title', 'pages_title_unique'));
        $this->safeSchema('settings', fn (Blueprint $table) => $table->unique('key', 'settings_key_unique'));
        $this->safeSchema('coupons', fn (Blueprint $table) => $table->unique('code', 'coupons_code_unique'));

        foreach ($this->coreTables as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'store_id')) {
                continue;
            }

            $this->safeSchema($tableName, fn (Blueprint $table) => $table->unsignedBigInteger('store_id')->nullable()->change());
        }
    }

    private function ensureDefaultStoreId(): ?int
    {
        $storeId = DB::table('stores')->orderBy('id')->value('id');
        if (is_numeric($storeId)) {
            return (int) $storeId;
        }

        if (!Schema::hasTable('accounts')) {
            return null;
        }

        $ownerUserId = Schema::hasTable('users')
            ? DB::table('users')->orderBy('id')->value('id')
            : null;

        $accountId = DB::table('accounts')->insertGetId([
            'name' => 'Default Merchant Account',
            'status' => 'active',
            'owner_user_id' => is_numeric($ownerUserId) ? (int) $ownerUserId : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return (int) DB::table('stores')->insertGetId([
            'account_id' => $accountId,
            'name' => 'Default Store',
            'slug' => 'default',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function backfillStoreIds(int $defaultStoreId): void
    {
        $directTables = [
            'products',
            'categories',
            'orders',
            'pages',
            'settings',
            'coupons',
            'navigation_items',
        ];

        foreach ($directTables as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'store_id')) {
                continue;
            }

            DB::table($tableName)
                ->whereNull('store_id')
                ->update(['store_id' => $defaultStoreId]);
        }

        if (!Schema::hasTable('order_items') || !Schema::hasColumn('order_items', 'store_id')) {
            return;
        }

        $rows = DB::table('order_items')
            ->select(['id', 'order_id'])
            ->whereNull('store_id')
            ->orderBy('id')
            ->get();

        foreach ($rows as $row) {
            $storeId = DB::table('orders')->where('id', $row->order_id)->value('store_id');
            $resolvedStoreId = is_numeric($storeId) ? (int) $storeId : $defaultStoreId;

            DB::table('order_items')
                ->where('id', $row->id)
                ->update(['store_id' => $resolvedStoreId]);
        }
    }

    private function switchToTenantSafeUniqueConstraints(): void
    {
        $this->safeSchema('products', fn (Blueprint $table) => $table->dropUnique('products_slug_unique'));
        $this->safeSchema('categories', fn (Blueprint $table) => $table->dropUnique('categories_slug_unique'));
        $this->safeSchema('categories', fn (Blueprint $table) => $table->dropUnique('categories_name_unique'));
        $this->safeSchema('pages', fn (Blueprint $table) => $table->dropUnique('pages_slug_unique'));
        $this->safeSchema('pages', fn (Blueprint $table) => $table->dropUnique('pages_title_unique'));
        $this->safeSchema('settings', fn (Blueprint $table) => $table->dropUnique('settings_key_unique'));
        $this->safeSchema('coupons', fn (Blueprint $table) => $table->dropUnique('coupons_code_unique'));

        $this->safeSchema('products', fn (Blueprint $table) => $table->unique(['store_id', 'slug'], 'products_store_slug_unique'));
        $this->safeSchema('categories', fn (Blueprint $table) => $table->unique(['store_id', 'slug'], 'categories_store_slug_unique'));
        $this->safeSchema('pages', fn (Blueprint $table) => $table->unique(['store_id', 'slug'], 'pages_store_slug_unique'));
        $this->safeSchema('settings', fn (Blueprint $table) => $table->unique(['store_id', 'key'], 'settings_store_key_unique'));
        $this->safeSchema('coupons', fn (Blueprint $table) => $table->unique(['store_id', 'code'], 'coupons_store_code_unique'));
    }

    private function enforceStoreIdNotNull(): void
    {
        foreach ($this->coreTables as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'store_id')) {
                continue;
            }

            $this->safeSchema($tableName, fn (Blueprint $table) => $table->unsignedBigInteger('store_id')->nullable(false)->change());
        }
    }

    private function safeSchema(string $table, callable $callback): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        try {
            Schema::table($table, $callback);
        } catch (\Throwable) {
            // no-op: protegge da divergenze locali su indici già presenti/non presenti
        }
    }
};
