<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PriceList;
use App\Models\PriceListPrice;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ShippingRule;
use App\Models\Store;
use App\Models\TaxClass;
use App\Models\TaxRate;
use App\Models\TaxZone;
use App\Models\User;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PricingTaxCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_uses_price_list_for_requested_currency(): void
    {
        [$store, $user, $product, $variant, $location, $taxClass] = $this->bootstrapStoreCatalog(price: 20);

        app(TenantContext::class)->setStore($store);

        DB::table('store_currencies')->updateOrInsert(
            ['store_id' => $store->id, 'currency' => 'USD'],
            [
                'is_default' => false,
                'is_enabled' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $priceList = PriceList::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'US Online',
            'currency' => 'USD',
            'country_code' => null,
            'channel' => 'online',
            'is_default' => true,
        ]);

        PriceListPrice::withoutGlobalScopes()->create([
            'price_list_id' => $priceList->id,
            'variant_id' => $variant->id,
            'amount' => 24.50,
            'compare_at_amount' => 29.90,
        ]);

        $cartKey = sprintf('v:%d', $variant->id);

        $this->actingAs($user)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withSession([
                'cart' => [
                    $cartKey => [
                        'key' => $cartKey,
                        'id' => $product->id,
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'inventory_location_id' => $location->id,
                        'name' => $product->name,
                        'price' => 20.00,
                        'quantity' => 1,
                        'image' => null,
                    ],
                ],
            ])
            ->get(route('checkout.index', ['currency' => 'USD']))
            ->assertOk();

        $order = Order::withoutGlobalScopes()->latest('id')->firstOrFail();
        $item = OrderItem::withoutGlobalScopes()
            ->where('order_id', $order->id)
            ->firstOrFail();

        $this->assertSame('USD', $order->currency);
        $this->assertSame(24.50, (float) $item->unit_price);
        $this->assertSame($priceList->id, (int) $item->price_list_id);
        $this->assertSame($taxClass->id, (int) $item->tax_class_id);
    }

    public function test_create_order_applies_tax_rate_and_updates_order_snapshots(): void
    {
        [$store, $user, $product, $variant, $location, $taxClass] = $this->bootstrapStoreCatalog(price: 50);

        app(TenantContext::class)->setStore($store);

        ShippingRule::query()->create([
            'name' => 'Standard',
            'type' => 'standard',
            'base_cost' => 0,
            'free_shipping_threshold' => null,
            'description' => null,
            'is_active' => true,
        ]);

        $taxZone = TaxZone::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'country_code' => 'IT',
            'region_code' => null,
            'postal_pattern' => null,
        ]);

        TaxRate::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'tax_zone_id' => $taxZone->id,
            'tax_class_id' => $taxClass->id,
            'rate' => 22.0,
            'is_inclusive' => false,
            'priority' => 0,
        ]);

        $cartKey = sprintf('v:%d', $variant->id);

        $this->actingAs($user)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->withSession([
                'cart' => [
                    $cartKey => [
                        'key' => $cartKey,
                        'id' => $product->id,
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'inventory_location_id' => $location->id,
                        'name' => $product->name,
                        'price' => 50.00,
                        'quantity' => 1,
                        'image' => null,
                    ],
                ],
            ])
            ->get(route('checkout.index'))
            ->assertOk();

        $order = Order::withoutGlobalScopes()->latest('id')->firstOrFail();

        $response = $this->actingAs($user)
            ->withHeader('X-Store-Id', (string) $store->id)
            ->postJson(route('checkout.create'), [
                'order_id' => $order->id,
                'shipping_address' => 'Via Roma 1',
                'shipping_city' => 'Roma',
                'shipping_zip' => '00100',
                'shipping_country' => 'IT',
                'shipping_method' => 'standard',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('tax_total', 11)
            ->assertJsonPath('total', 61);

        $order->refresh();
        $item = OrderItem::withoutGlobalScopes()->where('order_id', $order->id)->firstOrFail();

        $this->assertSame(11.0, (float) $order->tax_total);
        $this->assertSame(61.0, (float) $order->total);
        $this->assertSame(11.0, (float) $item->tax_amount);
        $this->assertSame(22.0, (float) $item->tax_rate_snapshot);
    }

    /**
     * @return array{Store, User, Product, ProductVariant, InventoryLocation, TaxClass}
     */
    private function bootstrapStoreCatalog(float $price): array
    {
        $account = Account::query()->create([
            'name' => 'Pricing Account',
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'Pricing Store',
            'slug' => 'pricing-store',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        DB::table('store_currencies')->updateOrInsert(
            ['store_id' => $store->id, 'currency' => 'EUR'],
            [
                'is_default' => true,
                'is_enabled' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $user = User::factory()->create([
            'role' => User::ROLE_CUSTOMER,
            'is_admin' => false,
        ]);

        $taxClass = TaxClass::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Standard',
            'code' => 'standard',
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Pricing Category',
            'slug' => 'pricing-category',
            'description' => 'Category',
            'order' => 0,
        ]);

        $product = Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Pricing Product',
            'slug' => 'pricing-product',
            'description' => 'Product',
            'price' => $price,
            'stock' => 50,
            'category_id' => $category->id,
            'tax_class_id' => $taxClass->id,
            'is_active' => true,
        ]);

        $variant = ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'sku' => 'PRICE-' . $product->id,
            'price' => $price,
            'status' => ProductVariant::STATUS_ACTIVE,
        ]);

        $location = InventoryLocation::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Main Location',
            'code' => 'main',
            'priority' => 0,
            'is_active' => true,
        ]);

        InventoryLevel::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'variant_id' => $variant->id,
            'location_id' => $location->id,
            'on_hand' => 50,
            'reserved' => 0,
            'available' => 50,
        ]);

        return [$store, $user, $product, $variant, $location, $taxClass];
    }
}
