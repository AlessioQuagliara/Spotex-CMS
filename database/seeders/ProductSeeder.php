<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $electronics = Category::where('slug', 'elettronica')->first();
        $clothing = Category::where('slug', 'abbigliamento')->first();

        if ($electronics) {
            Product::create([
                'name' => 'Laptop Pro',
                'slug' => 'laptop-pro',
                'description' => 'Laptop ad alte prestazioni con processore Intel i9',
                'price' => 1299.99,
                'stock' => 15,
                'category_id' => $electronics->id,
                'is_active' => true,
            ]);

            Product::create([
                'name' => 'Auricolari Wireless',
                'slug' => 'auricolari-wireless',
                'description' => 'Auricolari Bluetooth con cancellazione del rumore',
                'price' => 199.99,
                'stock' => 50,
                'category_id' => $electronics->id,
                'is_active' => true,
            ]);
        }

        if ($clothing) {
            Product::create([
                'name' => 'Maglietta Premium',
                'slug' => 'maglietta-premium',
                'description' => 'Maglietta in cotone 100% di alta qualità',
                'price' => 29.99,
                'stock' => 100,
                'category_id' => $clothing->id,
                'is_active' => true,
            ]);
        }
    }
}
