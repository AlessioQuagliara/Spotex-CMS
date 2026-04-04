<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class TenantIsolationPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_model_scope_returns_only_records_for_current_store(): void
    {
        [$storeA, $storeB] = $this->createTwoStores();

        $categoryA = Category::withoutGlobalScopes()->create([
            'store_id' => $storeA->id,
            'name' => 'Cat A',
            'slug' => 'cat-a',
            'description' => 'A',
            'order' => 0,
        ]);

        $categoryB = Category::withoutGlobalScopes()->create([
            'store_id' => $storeB->id,
            'name' => 'Cat B',
            'slug' => 'cat-b',
            'description' => 'B',
            'order' => 0,
        ]);

        Product::withoutGlobalScopes()->create([
            'store_id' => $storeA->id,
            'name' => 'Prod A',
            'slug' => 'prod-a',
            'description' => 'A',
            'price' => 10.00,
            'stock' => 5,
            'category_id' => $categoryA->id,
            'is_active' => true,
        ]);

        Product::withoutGlobalScopes()->create([
            'store_id' => $storeB->id,
            'name' => 'Prod B',
            'slug' => 'prod-b',
            'description' => 'B',
            'price' => 20.00,
            'stock' => 8,
            'category_id' => $categoryB->id,
            'is_active' => true,
        ]);

        app(TenantContext::class)->setStore($storeA);

        $products = Product::query()->pluck('slug')->all();

        $this->assertSame(['prod-a'], $products);
    }

    public function test_order_policy_blocks_cross_store_access_for_backoffice_user(): void
    {
        [$storeA, $storeB] = $this->createTwoStores();

        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'is_admin' => true,
        ]);

        DB::table('account_users')->updateOrInsert(
            [
                'account_id' => $storeA->account_id,
                'user_id' => $admin->id,
            ],
            [
                'role' => User::ROLE_ADMIN,
                'status' => 'active',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER, 'is_admin' => false]);

        $orderA = Order::withoutGlobalScopes()->create([
            'store_id' => $storeA->id,
            'user_id' => $customer->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_status' => 'not_shipped',
            'total' => 100,
            'subtotal' => 100,
            'shipping_cost' => 0,
            'discount_amount' => 0,
            'shipping_address' => 'Via A',
            'billing_address' => 'Via A',
        ]);

        $orderB = Order::withoutGlobalScopes()->create([
            'store_id' => $storeB->id,
            'user_id' => $customer->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_status' => 'not_shipped',
            'total' => 200,
            'subtotal' => 200,
            'shipping_cost' => 0,
            'discount_amount' => 0,
            'shipping_address' => 'Via B',
            'billing_address' => 'Via B',
        ]);

        app(TenantContext::class)->setStore($storeA);

        $this->assertTrue(Gate::forUser($admin)->allows('view', $orderA));
        $this->assertFalse(Gate::forUser($admin)->allows('view', $orderB));
    }

    /**
     * @return array{Store, Store}
     */
    private function createTwoStores(): array
    {
        $accountA = Account::query()->create(['name' => 'A', 'status' => 'active']);
        $accountB = Account::query()->create(['name' => 'B', 'status' => 'active']);

        $storeA = Store::query()->create([
            'account_id' => $accountA->id,
            'name' => 'Store A',
            'slug' => 'store-a',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $storeB = Store::query()->create([
            'account_id' => $accountB->id,
            'name' => 'Store B',
            'slug' => 'store-b',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        return [$storeA, $storeB];
    }
}
