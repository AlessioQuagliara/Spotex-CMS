<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\OAuthClient;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiV1OAuthScopesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('spotex.api.v1.tokens', ['legacy-static-token']);
        config()->set('spotex.api.v1.oauth.access_token_ttl_minutes', 120);
        config()->set('spotex.api.v1.oauth.allowed_scopes', [
            'read_profile',
            'read_products',
            'write_products',
            'read_orders',
            'write_orders',
        ]);
    }

    public function test_oauth_client_credentials_can_issue_token(): void
    {
        [$store] = $this->bootstrapCatalog();
        $this->createOAuthClient($store->id, 'client-a', 'secret-a', ['read_products', 'read_profile']);

        $this->withHeader('X-Store-Id', (string) $store->id)
            ->postJson('/api/v1/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => 'client-a',
                'client_secret' => 'secret-a',
                'scope' => 'read_products read_profile',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('meta.version', 'v1')
            ->assertJsonStructure([
                'success',
                'data' => ['access_token', 'token_type', 'expires_in', 'expires_at', 'scope', 'client_id'],
                'meta' => ['request_id', 'timestamp', 'version'],
            ]);
    }

    public function test_oauth_token_grant_rejects_invalid_client_credentials(): void
    {
        [$store] = $this->bootstrapCatalog();
        $this->createOAuthClient($store->id, 'client-b', 'secret-b', ['read_products']);

        $this->withHeader('X-Store-Id', (string) $store->id)
            ->postJson('/api/v1/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => 'client-b',
                'client_secret' => 'wrong-secret',
                'scope' => 'read_products',
            ])
            ->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'invalid_client');
    }

    public function test_oauth_scopes_are_enforced_on_v1_routes(): void
    {
        [$store] = $this->bootstrapCatalog();
        $this->createOAuthClient($store->id, 'client-c', 'secret-c', ['read_products']);

        $tokenResponse = $this->withHeader('X-Store-Id', (string) $store->id)
            ->postJson('/api/v1/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => 'client-c',
                'client_secret' => 'secret-c',
                'scope' => 'read_products',
            ])
            ->assertOk();

        $token = (string) $tokenResponse->json('data.access_token');
        $this->assertNotSame('', $token);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/me')
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'insufficient_scope');
    }

    public function test_oauth_token_grant_rejects_unknown_scopes(): void
    {
        [$store] = $this->bootstrapCatalog();
        $this->createOAuthClient($store->id, 'client-d', 'secret-d', ['read_products']);

        $this->withHeader('X-Store-Id', (string) $store->id)
            ->postJson('/api/v1/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => 'client-d',
                'client_secret' => 'secret-d',
                'scope' => 'write_orders',
            ])
            ->assertStatus(400)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'invalid_scope');
    }

    public function test_static_token_fallback_remains_compatible(): void
    {
        [$store] = $this->bootstrapCatalog();

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.client.auth_mode', 'static');
    }

    /**
     * @return array{Store}
     */
    private function bootstrapCatalog(): array
    {
        $account = Account::query()->create([
            'name' => 'API OAuth Account',
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'API OAuth Store',
            'slug' => 'api-oauth-store',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'OAuth Category',
            'slug' => 'oauth-category',
            'description' => 'Category',
            'order' => 0,
        ]);

        Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'OAuth Product',
            'slug' => 'oauth-product',
            'description' => 'Product',
            'price' => 10,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        return [$store];
    }

    /**
     * @param array<int, string> $allowedScopes
     */
    private function createOAuthClient(int $storeId, string $clientId, string $clientSecret, array $allowedScopes): OAuthClient
    {
        return OAuthClient::query()->create([
            'store_id' => $storeId,
            'name' => 'Test OAuth Client',
            'client_id' => $clientId,
            'client_secret_hash' => Hash::make($clientSecret),
            'allowed_scopes_json' => $allowedScopes,
            'is_active' => true,
        ]);
    }
}
