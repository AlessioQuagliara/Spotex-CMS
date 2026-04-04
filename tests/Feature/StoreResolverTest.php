<?php

namespace Tests\Feature;

use App\Http\Middleware\StoreResolver;
use App\Models\Account;
use App\Models\Store;
use App\Models\StoreDomain;
use Illuminate\Http\Request;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolves_store_from_custom_domain(): void
    {
        [$storeA] = $this->createStoreWithDomain('Store A', 'store-a', 'store-a.example.test');
        $this->createStoreWithDomain('Store B', 'store-b', 'store-b.example.test');

        $request = Request::create('https://store-a.example.test/api/webhooks/test', 'POST');
        $middleware = app(StoreResolver::class);

        $response = $middleware->handle($request, function (Request $handledRequest) {
            return response()->json([
                'current_store_id' => $handledRequest->attributes->get('current_store_id'),
                'current_store_slug' => $handledRequest->attributes->get('current_store_slug'),
            ]);
        });

        $this->assertSame($storeA->id, $response->getData(true)['current_store_id']);
        $this->assertSame($storeA->slug, $response->getData(true)['current_store_slug']);
    }

    public function test_resolves_store_from_header_in_testing_environment(): void
    {
        [$storeA] = $this->createStoreWithDomain('Store A', 'store-a', 'store-a.example.test');
        $this->createStoreWithDomain('Store B', 'store-b', 'store-b.example.test');

        $response = $this->withHeaders([
            'X-Store-Slug' => $storeA->slug,
        ])->postJson('/api/webhooks/test');

        $response
            ->assertOk()
            ->assertJsonPath('current_store_id', $storeA->id)
            ->assertJsonPath('current_store_slug', $storeA->slug);
    }

    public function test_falls_back_to_first_active_store_when_no_match_is_found(): void
    {
        $this->createStoreWithDomain('Store A', 'store-a', 'store-a.example.test');
        $this->createStoreWithDomain('Store B', 'store-b', 'store-b.example.test');

        $expectedStoreId = Store::query()
            ->withoutGlobalScopes()
            ->where('status', Store::STATUS_ACTIVE)
            ->orderBy('id')
            ->value('id');

        $expectedSlug = Store::query()
            ->withoutGlobalScopes()
            ->where('id', $expectedStoreId)
            ->value('slug');

        $response = $this->withServerVariables([
            'HTTP_HOST' => 'unknown.example.test',
        ])->postJson('/api/webhooks/test');

        $response
            ->assertOk()
            ->assertJsonPath('current_store_id', $expectedStoreId)
            ->assertJsonPath('current_store_slug', $expectedSlug);
    }

    /**
     * @return array{Store, Account}
     */
    private function createStoreWithDomain(string $accountName, string $slug, string $domain): array
    {
        $account = Account::query()->create([
            'name' => $accountName,
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => $accountName . ' Store',
            'slug' => $slug,
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        StoreDomain::query()->create([
            'store_id' => $store->id,
            'domain' => $domain,
            'is_primary' => true,
            'verified_at' => now(),
        ]);

        return [$store, $account];
    }
}
