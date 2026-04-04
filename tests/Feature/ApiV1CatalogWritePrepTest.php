<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\OAuthClient;
use App\Models\Product;
use App\Models\Store;
use App\Services\Api\V1\ApiKey\ApiKeyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiV1CatalogWritePrepTest extends TestCase
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
            'read_orders',
            'write_orders',
        ]);
    }

    public function test_products_show_endpoint_requires_read_products_scope(): void
    {
        [$store, $category, $product] = $this->bootstrapCatalog('catalog-scope-show');

        $token = $this->issueOAuthToken(
            store: $store,
            clientId: 'scope-show-client',
            clientSecret: 'scope-show-secret',
            allowedScopes: ['write_products'],
            requestedScope: 'write_products'
        );

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/products/' . $product->id)
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');
    }

    public function test_products_write_endpoints_require_write_products_scope(): void
    {
        [$store, $category] = $this->bootstrapCatalog('catalog-scope-write');

        $token = $this->issueOAuthToken(
            store: $store,
            clientId: 'scope-write-client',
            clientSecret: 'scope-write-secret',
            allowedScopes: ['read_products'],
            requestedScope: 'read_products'
        );

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'scope-write-001')
            ->postJson('/api/v1/products', [
                'name' => 'Scope Denied Product',
                'slug' => 'scope-denied-product',
                'price' => 12.5,
                'stock' => 5,
                'category_id' => $category->id,
                'is_active' => true,
            ])
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');
    }

    public function test_products_create_update_and_replay_work_with_static_token(): void
    {
        [$store, $category] = $this->bootstrapCatalog('catalog-write-static');

        $createResponse = $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'catalog-create-001')
            ->postJson('/api/v1/products', [
                'name' => 'API Nuovo Prodotto',
                'slug' => 'api-nuovo-prodotto',
                'description' => 'Prodotto creato da API',
                'price' => 49.99,
                'stock' => 25,
                'category_id' => $category->id,
                'is_active' => true,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.slug', 'api-nuovo-prodotto')
            ->assertJsonPath('data.item.price', 49.99)
            ->assertHeader('Idempotency-Replayed', 'false');

        $createdId = (int) $createResponse->json('data.item.id');
        $this->assertGreaterThan(0, $createdId);

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'catalog-create-001')
            ->postJson('/api/v1/products', [
                'name' => 'API Nuovo Prodotto',
                'slug' => 'api-nuovo-prodotto',
                'description' => 'Prodotto creato da API',
                'price' => 49.99,
                'stock' => 25,
                'category_id' => $category->id,
                'is_active' => true,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.id', $createdId)
            ->assertHeader('Idempotency-Replayed', 'true');

        Product::withoutGlobalScopes()
            ->where('store_id', $store->id)
            ->where('slug', 'api-nuovo-prodotto')
            ->get()
            ->tap(function ($collection): void {
                $this->assertCount(1, $collection);
            });

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'catalog-update-001')
            ->patchJson('/api/v1/products/' . $createdId, [
                'price' => 59.99,
                'stock' => 20,
                'name' => 'API Prodotto Aggiornato',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.price', 59.99)
            ->assertJsonPath('data.item.stock', 20)
            ->assertJsonPath('data.item.name', 'API Prodotto Aggiornato')
            ->assertHeader('Idempotency-Replayed', 'false');

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/products/' . $createdId)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.id', $createdId)
            ->assertJsonPath('data.item.price', 59.99)
            ->assertJsonPath('data.item.stock', 20)
            ->assertJsonPath('data.item.name', 'API Prodotto Aggiornato');
    }

    public function test_products_write_with_api_key_scope(): void
    {
        [$store, $category] = $this->bootstrapCatalog('catalog-write-api-key');

        $issued = app(ApiKeyService::class)->issueKey(
            name: 'Catalog Write Key',
            storeId: $store->id,
            requestedScopes: ['write_products', 'read_products']
        );

        $this->withHeader('Authorization', 'Bearer ' . (string) $issued['api_key'])
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'catalog-api-key-001')
            ->postJson('/api/v1/products', [
                'name' => 'API Key Product',
                'slug' => 'api-key-product',
                'price' => 19.99,
                'stock' => 8,
                'category_id' => $category->id,
                'is_active' => true,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item.slug', 'api-key-product');
    }

    /**
     * @return array{Store, Category, Product}
     */
    private function bootstrapCatalog(string $slug): array
    {
        $account = Account::query()->create([
            'name' => 'Catalog API Account ' . $slug,
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'Catalog API Store ' . $slug,
            'slug' => $slug,
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Catalog API Category ' . $slug,
            'slug' => 'catalog-api-category-' . $slug,
            'description' => 'Category',
            'order' => 0,
        ]);

        $product = Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Catalog API Existing Product ' . $slug,
            'slug' => 'catalog-api-existing-product-' . $slug,
            'description' => 'Existing',
            'price' => 10,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        return [$store, $category, $product];
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
            'name' => 'Catalog OAuth Client',
            'client_id' => $clientId,
            'client_secret_hash' => Hash::make($clientSecret),
            'allowed_scopes_json' => $allowedScopes,
            'is_active' => true,
        ]);

        $tokenResponse = $this->withHeader('X-Store-Id', (string) $store->id)
            ->postJson('/api/v1/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'scope' => $requestedScope,
            ])
            ->assertOk();

        $token = (string) $tokenResponse->json('data.access_token');
        $this->assertNotSame('', $token);

        return $token;
    }
}
