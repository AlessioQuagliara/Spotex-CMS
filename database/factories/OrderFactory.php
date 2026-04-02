<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $total = fake()->randomFloat(2, 20, 2000);

        return [
            'user_id' => User::factory(),
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_status' => 'not_shipped',
            'transaction_id' => null,
            'subtotal' => $total,
            'shipping_cost' => 0,
            'discount_amount' => 0,
            'discount_code' => null,
            'shipping_method' => 'standard',
            'total' => $total,
            'payment_method' => null,
            'shipping_address' => fake()->address(),
            'billing_address' => fake()->address(),
            'billing_same_as_shipping' => true,
            'billing_name' => fake()->name(),
            'billing_company' => null,
            'billing_tax_id' => null,
            'notes' => null,
            'paid_at' => null,
            'shipped_at' => null,
            'delivered_at' => null,
            'tracking_number' => null,
            'payment_provider' => null,
            'platform_mode' => 'off',
            'commission_amount' => 0,
            'provider_payment_id' => null,
            'provider_event_id' => null,
        ];
    }
}
