<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use App\Services\Inventory\InventoryReservationService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class InventoryReservationCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_index_creates_active_reservations_for_variant_items(): void
    {
        [$store, $user, $product, $variant, $location] = $this->bootstrapStoreCatalog(stock: 10);

        app(TenantContext::class)->setStore($store);

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
                        'price' => (float) $variant->price,
                        'quantity' => 2,
                        'image' => null,
                    ],
                ],
            ])
            ->get(route('checkout.index'))
            ->assertOk();

        $order = Order::withoutGlobalScopes()->latest('id')->firstOrFail();

        $item = OrderItem::withoutGlobalScopes()
            ->where('order_id', $order->id)
            ->firstOrFail();

        $reservation = InventoryReservation::withoutGlobalScopes()
            ->where('order_id', $order->id)
            ->firstOrFail();

        $level = InventoryLevel::withoutGlobalScopes()
            ->where('variant_id', $variant->id)
            ->where('location_id', $location->id)
            ->firstOrFail();

        $this->assertSame($variant->id, (int) $item->variant_id);
        $this->assertSame($location->id, (int) $item->inventory_location_id);
        $this->assertSame(InventoryReservation::STATUS_ACTIVE, $reservation->status);
        $this->assertSame(2, (int) $reservation->qty);
        $this->assertSame(2, (int) $level->reserved);
        $this->assertSame(8, (int) $level->available);
    }

    public function test_checkout_cancel_releases_active_reservations(): void
    {
        [$store, $user, $product, $variant, $location] = $this->bootstrapStoreCatalog(stock: 10);

        app(TenantContext::class)->setStore($store);

        $order = Order::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_status' => 'not_shipped',
            'subtotal' => 60,
            'shipping_cost' => 0,
            'discount_amount' => 0,
            'total' => 60,
            'shipping_address' => 'Via A',
            'billing_address' => 'Via A',
        ]);

        OrderItem::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'inventory_location_id' => $location->id,
            'quantity' => 3,
            'unit_price' => 20,
            'subtotal' => 60,
        ]);

        app(InventoryReservationService::class)->reserveForOrder($order);

        $this->withHeader('X-Store-Id', (string) $store->id)
            ->get(route('checkout.cancel', ['order' => $order->id]))
            ->assertOk();

        $reservation = InventoryReservation::withoutGlobalScopes()
            ->where('order_id', $order->id)
            ->firstOrFail();

        $level = InventoryLevel::withoutGlobalScopes()
            ->where('variant_id', $variant->id)
            ->where('location_id', $location->id)
            ->firstOrFail();

        $this->assertSame(InventoryReservation::STATUS_RELEASED, $reservation->status);
        $this->assertSame('checkout_cancelled', $reservation->release_reason);
        $this->assertSame(0, (int) $level->reserved);
        $this->assertSame(10, (int) $level->available);
    }

    public function test_inventory_release_expired_command_releases_expired_reservations(): void
    {
        [$store, $user, $product, $variant, $location] = $this->bootstrapStoreCatalog(stock: 10);

        app(TenantContext::class)->setStore($store);

        $order = Order::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_status' => 'not_shipped',
            'subtotal' => 40,
            'shipping_cost' => 0,
            'discount_amount' => 0,
            'total' => 40,
            'shipping_address' => 'Via B',
            'billing_address' => 'Via B',
        ]);

        OrderItem::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'inventory_location_id' => $location->id,
            'quantity' => 2,
            'unit_price' => 20,
            'subtotal' => 40,
        ]);

        app(InventoryReservationService::class)->reserveForOrder($order, now()->subMinute());

        Artisan::call('inventory:release-expired');

        $reservation = InventoryReservation::withoutGlobalScopes()
            ->where('order_id', $order->id)
            ->firstOrFail();

        $level = InventoryLevel::withoutGlobalScopes()
            ->where('variant_id', $variant->id)
            ->where('location_id', $location->id)
            ->firstOrFail();

        $this->assertSame(InventoryReservation::STATUS_EXPIRED, $reservation->status);
        $this->assertSame('expired', $reservation->release_reason);
        $this->assertSame(0, (int) $level->reserved);
        $this->assertSame(10, (int) $level->available);
    }

    /**
     * @return array{Store, User, Product, ProductVariant, InventoryLocation}
     */
    private function bootstrapStoreCatalog(int $stock): array
    {
        $account = Account::query()->create([
            'name' => 'Checkout Account',
            'status' => 'active',
        ]);

        $store = Store::query()->create([
            'account_id' => $account->id,
            'name' => 'Checkout Store',
            'slug' => 'checkout-store',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $user = User::factory()->create([
            'role' => User::ROLE_CUSTOMER,
            'is_admin' => false,
        ]);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Checkout Category',
            'slug' => 'checkout-category',
            'description' => 'Category',
            'order' => 0,
        ]);

        $product = Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Checkout Product',
            'slug' => 'checkout-product',
            'description' => 'Product',
            'price' => 20,
            'stock' => $stock,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        $variant = ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'sku' => 'CHK-' . $product->id,
            'price' => 20,
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
            'on_hand' => $stock,
            'reserved' => 0,
            'available' => $stock,
        ]);

        return [$store, $user, $product, $variant, $location];
    }
}
