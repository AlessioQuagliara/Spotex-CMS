<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\OAuthClient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiV1OrdersPrepTest extends TestCase
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

    public function test_orders_endpoints_enforce_read_orders_scope(): void
    {
        [$store, , $order] = $this->bootstrapOrderCatalog('orders-read-scope');

        $writeOnlyToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'orders-write-only',
            clientSecret: 'orders-write-only-secret',
            allowedScopes: ['write_orders'],
            requestedScope: 'write_orders'
        );

        $this->withHeader('Authorization', 'Bearer ' . $writeOnlyToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/orders')
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');

        $readToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'orders-read-only',
            clientSecret: 'orders-read-only-secret',
            allowedScopes: ['read_orders'],
            requestedScope: 'read_orders'
        );

        $this->withHeader('Authorization', 'Bearer ' . $readToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.id', $order->id);
    }

    public function test_orders_store_requires_write_orders_scope(): void
    {
        [$store, $variant] = $this->bootstrapOrderCatalog('orders-write-scope');

        $readOnlyToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'orders-read-no-write',
            clientSecret: 'orders-read-no-write-secret',
            allowedScopes: ['read_orders'],
            requestedScope: 'read_orders'
        );

        $this->withHeader('Authorization', 'Bearer ' . $readOnlyToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'orders-create-denied-001')
            ->postJson('/api/v1/orders', [
                'items' => [
                    [
                        'variant_id' => $variant->id,
                        'quantity' => 1,
                    ],
                ],
                'reserve_inventory' => false,
            ])
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');
    }

    public function test_orders_store_supports_idempotent_replay_and_show_endpoint(): void
    {
        [$store, $variant] = $this->bootstrapOrderCatalog('orders-create-replay');

        $readWriteToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'orders-read-write',
            clientSecret: 'orders-read-write-secret',
            allowedScopes: ['read_orders', 'write_orders'],
            requestedScope: 'read_orders write_orders'
        );

        $payload = [
            'shipping_method' => 'api-standard',
            'payment_method' => 'api-manual',
            'shipping_cost' => 5.00,
            'discount_amount' => 1.00,
            'shipping_country_code' => 'IT',
            'shipping_postal_code' => '20100',
            'shipping_address' => 'Via API 123, Milano',
            'billing_address' => 'Via API 123, Milano',
            'notes' => 'Ordine creato via API v1',
            'reserve_inventory' => false,
            'items' => [
                [
                    'variant_id' => $variant->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $first = $this->withHeader('Authorization', 'Bearer ' . $readWriteToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'orders-create-001')
            ->postJson('/api/v1/orders', $payload)
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.status', 'pending')
            ->assertJsonPath('data.item.payment_status', 'pending')
            ->assertJsonPath('data.item.items.0.variant_id', $variant->id)
            ->assertHeader('Idempotency-Replayed', 'false');

        $orderId = (int) $first->json('data.item.id');
        $this->assertGreaterThan(0, $orderId);

        $this->withHeader('Authorization', 'Bearer ' . $readWriteToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'orders-create-001')
            ->postJson('/api/v1/orders', $payload)
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.id', $orderId)
            ->assertHeader('Idempotency-Replayed', 'true');

        $this->assertSame(1, Order::query()->where('shipping_method', 'api-standard')->count());
        $this->assertSame(1, OrderItem::query()->where('order_id', $orderId)->count());

        $this->withHeader('Authorization', 'Bearer ' . $readWriteToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/orders/' . $orderId)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.id', $orderId)
            ->assertJsonPath('data.item.items.0.variant_id', $variant->id);
    }

    /**
     * @return array{Store, ProductVariant, Order}
     */
    private function bootstrapOrderCatalog(string $slug): array
    {
        $account = Account::query()->create([
            'name' => 'Orders API Account ' . $slug,
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'Orders API Store ' . $slug,
            'slug' => $slug,
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Orders API Category ' . $slug,
            'slug' => 'orders-api-cat-' . $slug,
            'description' => 'Category',
            'order' => 0,
        ]);

        $product = Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Orders API Product ' . $slug,
            'slug' => 'orders-api-product-' . $slug,
            'description' => 'Product',
            'price' => 39.90,
            'stock' => 100,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        $variant = ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'sku' => 'SKU-ORDERS-' . strtoupper(str_replace('-', '', $slug)),
            'price' => 39.90,
            'status' => ProductVariant::STATUS_ACTIVE,
        ]);

        $order = Order::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'user_id' => null,
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_status' => 'not_shipped',
            'subtotal' => 39.90,
            'shipping_cost' => 0,
            'tax_total' => 0,
            'discount_amount' => 0,
            'discount_code' => null,
            'shipping_method' => 'standard',
            'total' => 39.90,
            'currency' => 'EUR',
            'fx_rate' => 1,
            'payment_method' => null,
            'shipping_address' => '',
            'billing_address' => '',
            'billing_same_as_shipping' => true,
        ]);

        OrderItem::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'inventory_location_id' => null,
            'tax_class_id' => null,
            'price_list_id' => null,
            'quantity' => 1,
            'unit_price' => 39.90,
            'tax_rate_snapshot' => 0,
            'subtotal' => 39.90,
            'tax_amount' => 0,
        ]);

        return [$store, $variant, $order];
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
            'name' => 'Orders OAuth Client',
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
