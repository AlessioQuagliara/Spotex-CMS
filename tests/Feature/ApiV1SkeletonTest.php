<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiV1SkeletonTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('spotex.api.v1.tokens', ['test-api-token']);
        config()->set('spotex.api.v1.pagination.default_per_page', 20);
        config()->set('spotex.api.v1.pagination.max_per_page', 50);
    }

    public function test_v1_health_endpoint_returns_standard_success_envelope(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('meta.version', 'v1')
            ->assertJsonStructure([
                'success',
                'data' => ['status', 'service'],
                'meta' => ['request_id', 'timestamp', 'version'],
            ]);
    }

    public function test_v1_auth_middleware_blocks_request_without_token(): void
    {
        $this->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'unauthenticated')
            ->assertJsonPath('meta.version', 'v1');
    }

    public function test_v1_products_endpoint_supports_filter_sort_and_pagination(): void
    {
        $store = $this->bootstrapCatalog();

        $response = $this->withHeader('Authorization', 'Bearer test-api-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/products?per_page=1&sort=name&direction=asc&q=Prodotto');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.version', 'v1')
            ->assertJsonPath('meta.pagination.per_page', 1)
            ->assertJsonPath('meta.filters.sort', 'name')
            ->assertJsonPath('meta.filters.direction', 'asc')
            ->assertJsonCount(1, 'data.items');

        $firstItem = $response->json('data.items.0');
        $this->assertSame('Prodotto Alpha', $firstItem['name']);
    }

    public function test_v1_validation_errors_are_returned_with_standard_error_envelope(): void
    {
        $store = $this->bootstrapCatalog();

        $this->withHeader('Authorization', 'Bearer test-api-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/products?per_page=999')
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'validation_error')
            ->assertJsonStructure([
                'success',
                'error' => ['code', 'message', 'details' => ['fields' => ['per_page']]],
                'meta' => ['request_id', 'timestamp', 'version'],
            ]);
    }

    private function bootstrapCatalog(): Store
    {
        $account = Account::query()->create([
            'name' => 'API Account',
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'API Store',
            'slug' => 'api-store',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'API Category',
            'slug' => 'api-category',
            'description' => 'Category',
            'order' => 0,
        ]);

        Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Prodotto Beta',
            'slug' => 'prodotto-beta',
            'description' => 'Beta',
            'price' => 19.99,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Prodotto Alpha',
            'slug' => 'prodotto-alpha',
            'description' => 'Alpha',
            'price' => 29.99,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        return $store;
    }
}
