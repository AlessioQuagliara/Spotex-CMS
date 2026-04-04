<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\ApiKey;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Services\Api\V1\ApiKey\ApiKeyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiV1PrivateApiKeysTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('spotex.api.v1.tokens', ['legacy-static-token']);
        config()->set('spotex.api.v1.private_keys.prefix', 'stx_pk_');
        config()->set('spotex.api.v1.oauth.allowed_scopes', [
            'read_profile',
            'read_products',
            'write_products',
            'read_orders',
            'write_orders',
        ]);
    }

    public function test_private_api_key_reuses_scope_middleware_enforcement(): void
    {
        [$store] = $this->bootstrapCatalog('private-api-store');

        $issued = app(ApiKeyService::class)->issueKey(
            name: 'Private Scope Key',
            storeId: $store->id,
            requestedScopes: ['read_products']
        );

        $apiKey = (string) $issued['api_key'];
        $this->assertNotSame('', $apiKey);

        $this->withHeader('Authorization', 'Bearer ' . $apiKey)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->withHeader('Authorization', 'Bearer ' . $apiKey)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/me')
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');
    }

    public function test_private_api_key_supports_x_api_key_header_and_me_endpoint_reports_auth_mode(): void
    {
        [$store] = $this->bootstrapCatalog('private-api-header-store');

        $issued = app(ApiKeyService::class)->issueKey(
            name: 'Private Header Key',
            storeId: $store->id,
            requestedScopes: ['read_profile']
        );

        $this->withHeader('X-Api-Key', (string) $issued['api_key'])
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.client.auth_mode', 'api_key')
            ->assertJsonPath('data.client.scopes.0', 'read_profile');
    }

    public function test_private_api_key_rotation_revokes_previous_key_and_activates_new_key(): void
    {
        [$store] = $this->bootstrapCatalog('private-api-rotation-store');

        /** @var ApiKeyService $service */
        $service = app(ApiKeyService::class);

        $issued = $service->issueKey(
            name: 'Rotate Key',
            storeId: $store->id,
            requestedScopes: ['read_products']
        );

        $rotated = $service->rotateKey(
            apiKeyId: (int) $issued['api_key_id'],
            storeId: $store->id
        );

        $oldRecord = ApiKey::query()->findOrFail((int) $issued['api_key_id']);
        $this->assertNotNull($oldRecord->revoked_at);

        $this->withHeader('Authorization', 'Bearer ' . (string) $issued['api_key'])
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/products')
            ->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'invalid_token');

        $this->withHeader('Authorization', 'Bearer ' . (string) $rotated['api_key'])
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_private_api_key_revoke_blocks_access(): void
    {
        [$store] = $this->bootstrapCatalog('private-api-revoke-store');

        /** @var ApiKeyService $service */
        $service = app(ApiKeyService::class);

        $issued = $service->issueKey(
            name: 'Revoke Key',
            storeId: $store->id,
            requestedScopes: ['read_products']
        );

        $service->revokeKey((int) $issued['api_key_id'], $store->id);

        $this->withHeader('Authorization', 'Bearer ' . (string) $issued['api_key'])
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/products')
            ->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'invalid_token');
    }

    public function test_private_api_key_is_store_scoped(): void
    {
        [$storeA] = $this->bootstrapCatalog('private-api-store-a');
        [$storeB] = $this->bootstrapCatalog('private-api-store-b');

        $issued = app(ApiKeyService::class)->issueKey(
            name: 'Store Scoped Key',
            storeId: $storeA->id,
            requestedScopes: ['read_products']
        );

        $this->withHeader('Authorization', 'Bearer ' . (string) $issued['api_key'])
            ->withHeader('X-Store-Id', (string) $storeB->id)
            ->getJson('/api/v1/products')
            ->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'invalid_token');
    }

    /**
     * @return array{Store}
     */
    private function bootstrapCatalog(string $slug): array
    {
        $account = Account::query()->create([
            'name' => 'Private API Account ' . $slug,
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'Private API Store ' . $slug,
            'slug' => $slug,
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Private API Category ' . $slug,
            'slug' => 'cat-' . $slug,
            'description' => 'Category',
            'order' => 0,
        ]);

        Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Private API Product ' . $slug,
            'slug' => 'prod-' . $slug,
            'description' => 'Product',
            'price' => 10,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        return [$store];
    }
}
