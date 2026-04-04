<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\InventoryLedger;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Services\Inventory\InventoryLedgerService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class InventoryLedgerServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_ledger_updates_projection_levels(): void
    {
        [$storeA] = $this->createTwoStores();
        $variant = $this->createVariantForStore($storeA, 'variant-a');
        $location = $this->createLocationForStore($storeA, 'main');
        $service = app(InventoryLedgerService::class);

        $service->record($variant, $location, InventoryLedger::EVENT_RESTOCK, 10, 'seed', 1, 'inv-restock-1');
        $service->record($variant, $location, InventoryLedger::EVENT_RESERVE, 4, 'checkout', 10, 'inv-reserve-1');
        $service->record($variant, $location, InventoryLedger::EVENT_RELEASE, 1, 'checkout', 10, 'inv-release-1');
        $service->record($variant, $location, InventoryLedger::EVENT_SALE, 3, 'order', 10, 'inv-sale-1');
        $service->record($variant, $location, InventoryLedger::EVENT_ADJUST, -2, 'adjustment', 100, 'inv-adjust-1');

        $level = InventoryLevel::withoutGlobalScopes()
            ->where('store_id', $storeA->id)
            ->where('variant_id', $variant->id)
            ->where('location_id', $location->id)
            ->firstOrFail();

        $this->assertSame(5, $level->on_hand);
        $this->assertSame(0, $level->reserved);
        $this->assertSame(5, $level->available);
        $this->assertDatabaseCount('inventory_ledger', 5);
    }

    public function test_idempotency_key_prevents_duplicate_inventory_movements(): void
    {
        [$storeA] = $this->createTwoStores();
        $variant = $this->createVariantForStore($storeA, 'variant-idempotency');
        $location = $this->createLocationForStore($storeA, 'main');
        $service = app(InventoryLedgerService::class);

        $first = $service->record(
            variant: $variant,
            location: $location,
            eventType: InventoryLedger::EVENT_RESTOCK,
            qtyDelta: 5,
            referenceType: 'seed',
            referenceId: 2,
            idempotencyKey: 'inv-idempotency-key'
        );

        $second = $service->record(
            variant: $variant,
            location: $location,
            eventType: InventoryLedger::EVENT_RESTOCK,
            qtyDelta: 999,
            referenceType: 'seed',
            referenceId: 3,
            idempotencyKey: 'inv-idempotency-key'
        );

        $level = InventoryLevel::withoutGlobalScopes()
            ->where('store_id', $storeA->id)
            ->where('variant_id', $variant->id)
            ->where('location_id', $location->id)
            ->firstOrFail();

        $this->assertSame($first->id, $second->id);
        $this->assertSame(5, $level->on_hand);
        $this->assertSame(5, $level->available);
        $this->assertDatabaseCount('inventory_ledger', 1);
    }

    public function test_reserve_cannot_exceed_available_inventory(): void
    {
        [$storeA] = $this->createTwoStores();
        $variant = $this->createVariantForStore($storeA, 'variant-underflow');
        $location = $this->createLocationForStore($storeA, 'main');
        $service = app(InventoryLedgerService::class);

        $service->record($variant, $location, InventoryLedger::EVENT_RESTOCK, 2, 'seed', 1, 'inv-restock-underflow');

        try {
            $service->record($variant, $location, InventoryLedger::EVENT_RESERVE, 3, 'checkout', 99, 'inv-reserve-underflow');
            $this->fail('Expected inventory underflow exception was not thrown.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('underflow', strtolower($exception->getMessage()));
        }

        $level = InventoryLevel::withoutGlobalScopes()
            ->where('store_id', $storeA->id)
            ->where('variant_id', $variant->id)
            ->where('location_id', $location->id)
            ->firstOrFail();

        $this->assertSame(2, $level->on_hand);
        $this->assertSame(0, $level->reserved);
        $this->assertSame(2, $level->available);
        $this->assertDatabaseCount('inventory_ledger', 1);
    }

    public function test_inventory_levels_are_scoped_by_current_store(): void
    {
        [$storeA, $storeB] = $this->createTwoStores();

        $variantA = $this->createVariantForStore($storeA, 'variant-store-a');
        $variantB = $this->createVariantForStore($storeB, 'variant-store-b');

        $locationA = $this->createLocationForStore($storeA, 'loc-a');
        $locationB = $this->createLocationForStore($storeB, 'loc-b');

        InventoryLevel::withoutGlobalScopes()->create([
            'store_id' => $storeA->id,
            'variant_id' => $variantA->id,
            'location_id' => $locationA->id,
            'on_hand' => 10,
            'reserved' => 2,
            'available' => 8,
        ]);

        InventoryLevel::withoutGlobalScopes()->create([
            'store_id' => $storeB->id,
            'variant_id' => $variantB->id,
            'location_id' => $locationB->id,
            'on_hand' => 20,
            'reserved' => 1,
            'available' => 19,
        ]);

        app(TenantContext::class)->setStore($storeA);

        $levels = InventoryLevel::query()->get();

        $this->assertCount(1, $levels);
        $this->assertSame($storeA->id, $levels->first()->store_id);
    }

    /**
     * @return array{Store, Store}
     */
    private function createTwoStores(): array
    {
        $accountA = Account::query()->create(['name' => 'Inventory Account A', 'status' => 'active']);
        $accountB = Account::query()->create(['name' => 'Inventory Account B', 'status' => 'active']);

        $storeA = Store::query()->create([
            'account_id' => $accountA->id,
            'name' => 'Inventory Store A',
            'slug' => 'inventory-store-a',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $storeB = Store::query()->create([
            'account_id' => $accountB->id,
            'name' => 'Inventory Store B',
            'slug' => 'inventory-store-b',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        return [$storeA, $storeB];
    }

    private function createVariantForStore(Store $store, string $slug): ProductVariant
    {
        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Category ' . $slug,
            'slug' => 'cat-' . $slug,
            'description' => 'Category',
            'order' => 0,
        ]);

        $product = Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Product ' . $slug,
            'slug' => 'prod-' . $slug,
            'description' => 'Product',
            'price' => 10.00,
            'stock' => 100,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        return ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'sku' => 'SKU-' . strtoupper($slug),
            'price' => 10.00,
            'status' => ProductVariant::STATUS_ACTIVE,
        ]);
    }

    private function createLocationForStore(Store $store, string $code): InventoryLocation
    {
        return InventoryLocation::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Location ' . strtoupper($code),
            'code' => $code,
            'priority' => 0,
            'is_active' => true,
        ]);
    }
}
