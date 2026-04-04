<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $storeId = (int) Store::query()->value('id');
        $electronics = Category::where('slug', 'elettronica')->first();
        $clothing = Category::where('slug', 'abbigliamento')->first();

        if ($storeId <= 0) {
            return;
        }

        $location = InventoryLocation::withoutGlobalScopes()->firstOrCreate(
            [
                'store_id' => $storeId,
                'code' => 'main',
            ],
            [
                'name' => 'Magazzino principale',
                'priority' => 0,
                'is_active' => true,
            ]
        );

        if ($electronics) {
            $this->createProductWithVariant($storeId, $location->id, [
                'name' => 'Laptop Pro',
                'slug' => 'laptop-pro',
                'description' => 'Laptop ad alte prestazioni con processore Intel i9',
                'price' => 1299.99,
                'stock' => 15,
                'category_id' => $electronics->id,
                'is_active' => true,
            ]);

            $this->createProductWithVariant($storeId, $location->id, [
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
            $this->createProductWithVariant($storeId, $location->id, [
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

    /**
     * @param array<string, mixed> $attributes
     */
    private function createProductWithVariant(int $storeId, int $locationId, array $attributes): void
    {
        $product = Product::create(array_merge($attributes, ['store_id' => $storeId]));

        $variant = ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $storeId,
            'product_id' => (int) $product->id,
            'sku' => sprintf('SEED-P%d', (int) $product->id),
            'price' => (float) $product->price,
            'status' => ProductVariant::STATUS_ACTIVE,
        ]);

        $stock = max(0, (int) $product->stock);

        InventoryLevel::withoutGlobalScopes()->firstOrCreate(
            [
                'store_id' => $storeId,
                'variant_id' => (int) $variant->id,
                'location_id' => $locationId,
            ],
            [
                'on_hand' => $stock,
                'reserved' => 0,
                'available' => $stock,
            ]
        );
    }
}
