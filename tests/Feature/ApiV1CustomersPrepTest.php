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
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiV1CustomersPrepTest extends TestCase
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
            'read_customers',
            'write_customers',
        ]);
    }

    public function test_customers_read_endpoints_require_read_customers_scope(): void
    {
        [$store, $customer] = $this->bootstrapCustomersContext('customers-read-scope');

        $ordersOnlyToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'customers-orders-only',
            clientSecret: 'customers-orders-only-secret',
            allowedScopes: ['read_orders'],
            requestedScope: 'read_orders'
        );

        $this->withHeader('Authorization', 'Bearer ' . $ordersOnlyToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/customers')
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');

        $readCustomersToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'customers-read-token',
            clientSecret: 'customers-read-token-secret',
            allowedScopes: ['read_customers'],
            requestedScope: 'read_customers'
        );

        $this->withHeader('Authorization', 'Bearer ' . $readCustomersToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/customers')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.id', $customer->id);

        $this->withHeader('Authorization', 'Bearer ' . $readCustomersToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/customers/' . $customer->id)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.id', $customer->id);
    }

    public function test_customers_write_endpoints_require_write_customers_scope(): void
    {
        [$store] = $this->bootstrapCustomersContext('customers-write-scope');

        $readOnlyToken = $this->issueOAuthToken(
            store: $store,
            clientId: 'customers-read-only',
            clientSecret: 'customers-read-only-secret',
            allowedScopes: ['read_customers'],
            requestedScope: 'read_customers'
        );

        $this->withHeader('Authorization', 'Bearer ' . $readOnlyToken)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'customers-create-denied-001')
            ->postJson('/api/v1/customers', [
                'name' => 'Write Denied Customer',
                'email' => 'write-denied@example.test',
            ])
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');
    }

    public function test_customers_create_update_and_idempotent_replay_work(): void
    {
        [$store] = $this->bootstrapCustomersContext('customers-write-replay');

        $token = $this->issueOAuthToken(
            store: $store,
            clientId: 'customers-read-write',
            clientSecret: 'customers-read-write-secret',
            allowedScopes: ['read_customers', 'write_customers'],
            requestedScope: 'read_customers write_customers'
        );

        $payload = [
            'name' => 'Nuovo Cliente API',
            'email' => 'nuovo-cliente-api@example.test',
            'phone' => '+3902123456',
            'profile_type' => 'private',
            'billing_country' => 'it',
        ];

        $first = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'customers-create-001')
            ->postJson('/api/v1/customers', $payload)
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.email', 'nuovo-cliente-api@example.test')
            ->assertHeader('Idempotency-Replayed', 'false');

        $customerId = (int) $first->json('data.item.id');
        $this->assertGreaterThan(0, $customerId);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'customers-create-001')
            ->postJson('/api/v1/customers', $payload)
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.id', $customerId)
            ->assertHeader('Idempotency-Replayed', 'true');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'customers-update-001')
            ->patchJson('/api/v1/customers/' . $customerId, [
                'phone' => '+39027654321',
                'is_banned' => true,
                'banned_reason' => 'Fraud check required',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.id', $customerId)
            ->assertJsonPath('data.item.phone', '+39027654321')
            ->assertJsonPath('data.item.is_banned', true);
    }

    public function test_customers_are_isolated_by_account_membership(): void
    {
        [$storeA, $customerA] = $this->bootstrapCustomersContext('customers-isolation-a');
        [$storeB] = $this->bootstrapCustomersContext('customers-isolation-b');

        $readTokenB = $this->issueOAuthToken(
            store: $storeB,
            clientId: 'customers-isolation-read-b',
            clientSecret: 'customers-isolation-read-b-secret',
            allowedScopes: ['read_customers'],
            requestedScope: 'read_customers'
        );

        $this->withHeader('Authorization', 'Bearer ' . $readTokenB)
            ->withHeader('X-Store-Id', (string) $storeB->id)
            ->getJson('/api/v1/customers/' . $customerA->id)
            ->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'not_found');
    }

    /**
     * @return array{Store, User}
     */
    private function bootstrapCustomersContext(string $slug): array
    {
        $account = Account::query()->create([
            'name' => 'Customers API Account ' . $slug,
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'Customers API Store ' . $slug,
            'slug' => $slug,
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $customer = User::query()->create([
            'name' => 'Customer ' . $slug,
            'email' => 'customer-' . $slug . '@example.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_CUSTOMER,
            'is_admin' => false,
        ]);

        DB::table('account_users')->insert([
            'account_id' => $account->id,
            'user_id' => $customer->id,
            'role' => User::ROLE_CUSTOMER,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Customers API Category ' . $slug,
            'slug' => 'customers-api-cat-' . $slug,
            'description' => 'Category',
            'order' => 0,
        ]);

        $product = Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Customers API Product ' . $slug,
            'slug' => 'customers-api-product-' . $slug,
            'description' => 'Product',
            'price' => 29.90,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        $variant = ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'sku' => 'SKU-CUST-' . strtoupper(str_replace('-', '', $slug)),
            'price' => 29.90,
            'status' => ProductVariant::STATUS_ACTIVE,
        ]);

        $order = Order::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'user_id' => $customer->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_status' => 'not_shipped',
            'subtotal' => 29.90,
            'shipping_cost' => 0,
            'tax_total' => 0,
            'discount_amount' => 0,
            'discount_code' => null,
            'shipping_method' => 'standard',
            'total' => 29.90,
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
            'unit_price' => 29.90,
            'tax_rate_snapshot' => 0,
            'subtotal' => 29.90,
            'tax_amount' => 0,
        ]);

        return [$store, $customer];
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
            'name' => 'Customers OAuth Client',
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
