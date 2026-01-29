<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Coupon::create([
            'code' => 'WELCOME10',
            'type' => 'percentage',
            'value' => 10,
            'max_discount' => 30,
            'min_cart_amount' => null,
            'max_uses' => null,
            'max_uses_per_customer' => 1,
            'valid_from' => null,
            'valid_until' => null,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'SPOTEX5',
            'type' => 'percentage',
            'value' => 5,
            'max_discount' => 20,
            'min_cart_amount' => null,
            'max_uses' => null,
            'max_uses_per_customer' => 1,
            'valid_from' => null,
            'valid_until' => null,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'WELCOME20',
            'type' => 'fixed',
            'value' => 20,
            'max_discount' => null,
            'min_cart_amount' => 100,
            'max_uses' => 100,
            'max_uses_per_customer' => 1,
            'valid_from' => now(),
            'valid_until' => now()->addMonths(3),
            'is_active' => true,
        ]);
    }
}
