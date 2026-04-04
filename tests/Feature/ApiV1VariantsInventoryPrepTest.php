<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\InventoryLedger;
use App\Models\InventoryLocation;
use App\Models\OAuthClient;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiV1VariantsInventoryPrepTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('spotex.api.v1.tokens', ['legacy-static-token']);
        config()->set('spotex.api.v1.idempotency.enabled', true);
        config()->set('spotex.api.v1.idempotency.required_methods', ['POST', 'PATCH', 'PUT']);
        config()->set('spotex.api.v1.oauth.allowed_scopes', [
            'read_profile',
            'read_products',
            'write_products',
            'read_inventory',
            'write_inventory',
            'read_orders',
            'write_orders',
        ]);
    }

    public function test_variants_endpoints_enforce_read_products_scope(): void
    {
        [$store, $product, $variant] = $this->bootstrapInventoryCatalog('variants-read-scope');

        $inventoryOnlyToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'variants-inventory-only',
            clientSecret: 'variants-inventory-only-secret',
            allowedScopes: ['read_inventory'],
            requestedScope: 'read_inventory'
        );

        $this->withHeader('Authorization', 'Bearer ' . $inventoryOnlyToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/variants')
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');

        $readProductsToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'variants-read-products',
            clientSecret: 'variants-read-products-secret',
            allowedScopes: ['read_products'],
            requestedScope: 'read_products'
        );

        $this->withHeader('Authorization', 'Bearer ' . $readProductsToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/variants?product_id=' . $product->id)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.id', $variant->id);
    }

    public function test_variants_write_endpoints_support_idempotent_replay(): void
    {
        [$store, $product] = $this->bootstrapInventoryCatalog('variants-write-idempotency');

        $createPayload = [
            'product_id' => $product->id,
            'sku' => 'SKU-API-NEW',
            'price' => 44.90,
            'status' => ProductVariant::STATUS_ACTIVE,
            'barcode' => '111222333',
        ];

        $firstCreate = $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'variants-create-001')
            ->postJson('/api/v1/variants', $createPayload)
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.sku', 'SKU-API-NEW')
            ->assertHeader('Idempotency-Replayed', 'false');

        $variantId = (int) $firstCreate->json('data.item.id');
        $this->assertGreaterThan(0, $variantId);

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'variants-create-001')
            ->postJson('/api/v1/variants', $createPayload)
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.id', $variantId)
            ->assertHeader('Idempotency-Replayed', 'true');

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'variants-update-001')
            ->patchJson('/api/v1/variants/' . $variantId, [
                'price' => 49.90,
                'status' => ProductVariant::STATUS_INACTIVE,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.id', $variantId)
            ->assertJsonPath('data.item.price', 49.9)
            ->assertJsonPath('data.item.status', ProductVariant::STATUS_INACTIVE);
    }

    public function test_inventory_levels_endpoint_requires_read_inventory_scope(): void
    {
        [$store, $product, $variant, $location] = $this->bootstrapInventoryCatalog('inventory-levels-scope');

        InventoryLedger::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'variant_id' => $variant->id,
            'location_id' => $location->id,
            'event_type' => InventoryLedger::EVENT_RESTOCK,
            'qty_delta' => 12,
            'reference_type' => 'seed',
            'reference_id' => 1,
            'idempotency_key' => 'inventory-seed-levels-001',
        ]);

        $location->inventoryLevels()->withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'variant_id' => $variant->id,
            'location_id' => $location->id,
            'on_hand' => 12,
            'reserved' => 2,
            'available' => 10,
        ]);

        $readProductsOnly = $this->issueOAuthToken(
            store: $store,
            clientId: 'inventory-read-products-only',
            clientSecret: 'inventory-read-products-only-secret',
            allowedScopes: ['read_products'],
            requestedScope: 'read_products'
        );

        $this->withHeader('Authorization', 'Bearer ' . $readProductsOnly)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/inventory/levels?variant_id=' . $variant->id)
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');

        $readInventory = $this->issueOAuthToken(
            store: $store,
            clientId: 'inventory-read-ok',
            clientSecret: 'inventory-read-ok-secret',
            allowedScopes: ['read_inventory'],
            requestedScope: 'read_inventory'
        );

        $this->withHeader('Authorization', 'Bearer ' . $readInventory)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/inventory/levels?variant_id=' . $variant->id)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.variant_id', $variant->id)
            ->assertJsonPath('data.items.0.location_id', $location->id)
            ->assertJsonPath('data.items.0.available', 10);
    }

    public function test_inventory_movement_requires_write_inventory_and_replays_response(): void
    {
        [$store, $product, $variant, $location] = $this->bootstrapInventoryCatalog('inventory-movement-idempotency');

        $readInventoryOnly = $this->issueOAuthToken(
            store: $store,
            clientId: 'inventory-write-denied',
            clientSecret: 'inventory-write-denied-secret',
            allowedScopes: ['read_inventory'],
            requestedScope: 'read_inventory'
        );

        $this->withHeader('Authorization', 'Bearer ' . $readInventoryOnly)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'inventory-move-denied-001')
            ->postJson('/api/v1/inventory/movements', [
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'event_type' => InventoryLedger::EVENT_RESTOCK,
                'quantity' => 7,
                'reference_type' => 'seed',
                'reference_id' => 10,
            ])
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');

        $writeInventoryToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'inventory-write-ok',
            clientSecret: 'inventory-write-ok-secret',
            allowedScopes: ['write_inventory'],
            requestedScope: 'write_inventory'
        );

        $first = $this->withHeader('Authorization', 'Bearer ' . $writeInventoryToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'inventory-move-001')
            ->postJson('/api/v1/inventory/movements', [
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'event_type' => InventoryLedger::EVENT_RESTOCK,
                'quantity' => 7,
                'reference_type' => 'seed',
                'reference_id' => 10,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.movement.qty_delta', 7)
            ->assertJsonPath('data.level.on_hand', 7)
            ->assertJsonPath('data.level.available', 7)
            ->assertHeader('Idempotency-Replayed', 'false');

        $movementId = (int) $first->json('data.movement.id');
        $this->assertGreaterThan(0, $movementId);

        $this->withHeader('Authorization', 'Bearer ' . $writeInventoryToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'inventory-move-001')
            ->postJson('/api/v1/inventory/movements', [
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'event_type' => InventoryLedger::EVENT_RESTOCK,
                'quantity' => 7,
                'reference_type' => 'seed',
                'reference_id' => 10,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.movement.id', $movementId)
            ->assertHeader('Idempotency-Replayed', 'true');

        $this->assertDatabaseCount('inventory_ledger', 1);
    }

    public function test_inventory_movement_returns_underflow_error_when_stock_is_insufficient(): void
    {
        [$store, $product, $variant, $location] = $this->bootstrapInventoryCatalog('inventory-underflow');

        $writeInventoryToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'inventory-underflow-write',
            clientSecret: 'inventory-underflow-write-secret',
            allowedScopes: ['write_inventory'],
            requestedScope: 'write_inventory'
        );

        $this->withHeader('Authorization', 'Bearer ' . $writeInventoryToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'inventory-underflow-restock-001')
            ->postJson('/api/v1/inventory/movements', [
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'event_type' => InventoryLedger::EVENT_RESTOCK,
                'quantity' => 2,
                'reference_type' => 'seed',
                'reference_id' => 1,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->withHeader('Authorization', 'Bearer ' . $writeInventoryToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'inventory-underflow-reserve-001')
            ->postJson('/api/v1/inventory/movements', [
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'event_type' => InventoryLedger::EVENT_RESERVE,
                'quantity' => 3,
                'reference_type' => 'checkout',
                'reference_id' => 2,
            ])
            ->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'inventory_underflow');
    }

    /**
     * @return array{Store, Product, ProductVariant, InventoryLocation}
     */
    private function bootstrapInventoryCatalog(string $slug): array
    {
        $account = Account::query()->create([
            'name' => 'Variants Inventory Account ' . $slug,
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'Variants Inventory Store ' . $slug,
            'slug' => $slug,
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Variants Inventory Category ' . $slug,
            'slug' => 'variants-inventory-cat-' . $slug,
            'description' => 'Category',
            'order' => 0,
        ]);

        $product = Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Variants Inventory Product ' . $slug,
            'slug' => 'variants-inventory-product-' . $slug,
            'description' => 'Product',
            'price' => 29.99,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        $variant = ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'sku' => 'SKU-' . strtoupper(str_replace('-', '', $slug)),
            'price' => 29.99,
            'status' => ProductVariant::STATUS_ACTIVE,
        ]);

        $location = InventoryLocation::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Main location ' . $slug,
            'code' => 'main',
            'priority' => 0,
            'is_active' => true,
        ]);

        return [$store, $product, $variant, $location];
    }

    /**
     * @param array<int, string> $allowedScopes
     */
    private function issueOAuthToken(
        Store $store,
        string $clientId,
        string $clientSecret,
        array $allowedScopes,
        string $requestedScope
    ): string {
        OAuthClient::query()->create([
            'store_id' => $store->id,
            'name' => 'Variants Inventory OAuth Client',
            'client_id' => $clientId,
            'client_secret_hash' => Hash::make($clientSecret),
            'allowed_scopes_json' => $allowedScopes,
            'is_active' => true,
        ]);

        $response = $this->withHeader('X-Store-Id', (string) $store->id)
            ->postJson('/api/v1/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'scope' => $requestedScope,
            ])
            ->assertOk();

        $token = (string) $response->json('data.access_token');
        $this->assertNotSame('', $token);

        return $token;
    }
}
