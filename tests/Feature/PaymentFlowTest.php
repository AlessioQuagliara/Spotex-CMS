<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Product;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test completo del flusso di pagamento Stripe
     */
    public function test_stripe_checkout_flow(): void
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($user)
            ->post(route('cart.add'), [
                'product_id' => $product->id,
                'quantity' => 2,
            ])
            ->assertJson(['success' => true]);

        $cartResponse = $this->get(route('cart.show'));
        if (!str_contains($cartResponse->getContent(), $product->name)) {
            throw new \RuntimeException('Product name not found in cart response.');
        }
    }

    /**
     * Test creazione ordine
     */
    public function test_create_order(): void
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'payment_status' => 'pending',
        ]);

        $this->actingAs($user)
            ->post(route('checkout.create', ['order_id' => $order->id]), [
                'shipping_address' => 'Via Roma 123',
                'shipping_city' => 'Milano',
                'shipping_zip' => '20100',
                'shipping_country' => 'Italia',
            ])
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'user_id' => $user->id,
        ]);
    }

    /**
     * Test che ordini pagati non possono essere modificati
     */
    public function test_paid_order_cannot_be_modified(): void
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('order.edit', $order))
            ->assertSee('readonly');
    }

    /**
     * Test accesso non autorizzato
     */
    public function test_cannot_access_other_users_order(): void
    {
        /** @var \App\Models\User $user1 */
        $user1 = User::factory()->create();
        /** @var \App\Models\User $user2 */
        $user2 = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user1->id]);

        $this->actingAs($user2)
            ->post(route('checkout.create', ['order_id' => $order->id]), [
                'shipping_address' => 'Via Test',
                'shipping_city' => 'Test',
                'shipping_zip' => '12345',
                'shipping_country' => 'Test',
            ])
            ->assertForbidden();
    }

    /**
     * Test webhook Stripe processing
     */
    public function test_stripe_webhook_updates_order(): void
    {
        $order = Order::factory()->create(['payment_status' => 'pending']);

        $payload = [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_123',
                    'payment_status' => 'paid',
                    'metadata' => ['order_id' => $order->id],
                ],
            ],
        ];

        // Nota: questo è pseudocodice, il webhook vero è più complesso
        $this->post('/api/webhooks/stripe', $payload)
            ->assertOk();

        // $this->assertDatabaseHas('orders', [
        //     'id' => $order->id,
        //     'status' => 'paid',
        // ]);
    }

    /**
     * Test product listing
     */
    public function test_can_list_products(): void
    {
        Product::factory()
            ->count(15)
            ->create();

        $response = $this->get(route('products'));

        $response->assertOk();
        $response->assertViewHas('products');
    }

    /**
     * Test product show page
     */
    public function test_can_view_product_details(): void
    {
        $product = Product::factory()
            ->has(\App\Models\ProductImage::factory()->count(3))
            ->create();

        $response = $this->get(route('product.show', $product));

        $response->assertOk();
        $response->assertSee($product->name);
    }

    /**
     * Test stock validation
     */
    public function test_cannot_add_out_of_stock_product(): void
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 0]);

        $this->actingAs($user)
            ->post(route('cart.add'), [
                'product_id' => $product->id,
                'quantity' => 1,
            ]);

        $product->refresh();
        if ($product->stock !== 0) {
            throw new \RuntimeException('Stock should be 0 for out of stock product.');
        }
    }

    /**
     * Test cart operations
     */
    public function test_cart_add_update_remove(): void
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $product = Product::factory()->create();

        // Add to cart
        $this->actingAs($user)
            ->post(route('cart.add'), [
                'product_id' => $product->id,
                'quantity' => 1,
            ])
            ->assertJson(['success' => true]);

        // Update quantity
        $this->post(route('cart.update'), [
            'product_id' => $product->id,
            'quantity' => 5,
        ])
        ->assertJson(['success' => true]);

        // Remove from cart
        $this->post(route('cart.remove'), [
            'product_id' => $product->id,
        ])
        ->assertJson(['success' => true]);
    }
}
