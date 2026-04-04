<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Support\Api\V1\ApiResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\TestCase;

class ApiV1IdempotencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('spotex.api.v1.tokens', ['legacy-static-token']);
        config()->set('spotex.api.v1.idempotency.enabled', true);
        config()->set('spotex.api.v1.idempotency.required_methods', ['POST', 'PATCH', 'PUT']);
        config()->set('spotex.api.v1.idempotency.ttl_hours', 24);
        config()->set('spotex.api.v1.idempotency.key_max_length', 255);
        config()->set('spotex.api.v1.oauth.allowed_scopes', [
            'read_profile',
            'read_products',
            'write_products',
            'read_orders',
            'write_orders',
        ]);

        Route::middleware(['api', 'api.v1.auth', 'api.v1.idempotency', 'api.v1.scope:write_orders'])
            ->post('/api/v1/test/idempotent-write', function (Request $request) {
                return ApiResponse::success([
                    'nonce' => (string) Str::uuid(),
                    'payload' => [
                        'external_id' => $request->input('external_id'),
                        'amount' => $request->input('amount'),
                    ],
                ], status: 201);
            });
    }

    public function test_write_request_requires_idempotency_key_header(): void
    {
        [$store] = $this->bootstrapCatalog('idempotency-required-store');

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->postJson('/api/v1/test/idempotent-write', [
                'external_id' => 'ord_1',
                'amount' => 100,
            ])
            ->assertStatus(400)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'idempotency_key_required');
    }

    public function test_same_key_and_same_payload_replays_original_response(): void
    {
        [$store] = $this->bootstrapCatalog('idempotency-replay-store');

        $first = $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'idem-replay-001')
            ->postJson('/api/v1/test/idempotent-write', [
                'external_id' => 'ord_2',
                'amount' => 120,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertHeader('Idempotency-Replayed', 'false');

        $nonce = (string) $first->json('data.nonce');
        $this->assertNotSame('', $nonce);

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'idem-replay-001')
            ->postJson('/api/v1/test/idempotent-write', [
                'external_id' => 'ord_2',
                'amount' => 120,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nonce', $nonce)
            ->assertHeader('Idempotency-Replayed', 'true');
    }

    public function test_same_key_with_different_payload_returns_conflict(): void
    {
        [$store] = $this->bootstrapCatalog('idempotency-conflict-store');

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'idem-conflict-001')
            ->postJson('/api/v1/test/idempotent-write', [
                'external_id' => 'ord_3',
                'amount' => 150,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withHeader('Idempotency-Key', 'idem-conflict-001')
            ->postJson('/api/v1/test/idempotent-write', [
                'external_id' => 'ord_3',
                'amount' => 151,
            ])
            ->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'idempotency_conflict');
    }

    public function test_get_routes_remain_compatible_without_idempotency_key(): void
    {
        [$store] = $this->bootstrapCatalog('idempotency-get-store');

        $this->withHeader('Authorization', 'Bearer legacy-static-token')
            ->withHeader('X-Store-Id', (string) $store->id)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.client.auth_mode', 'static');
    }

    private function bootstrapCatalog(string $slug): array
    {
        $account = Account::query()->create([
            'name' => 'Idempotency Account ' . $slug,
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'Idempotency Store ' . $slug,
            'slug' => $slug,
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Idempotency Category ' . $slug,
            'slug' => 'idempotency-cat-' . $slug,
            'description' => 'Category',
            'order' => 0,
        ]);

        Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Idempotency Product ' . $slug,
            'slug' => 'idempotency-prod-' . $slug,
            'description' => 'Product',
            'price' => 10,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        return [$store];
    }
}
