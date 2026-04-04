<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Category;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);
        $storeId = Store::query()->value('id');

        if (!$storeId) {
            $account = Account::query()->firstOrCreate(
                ['name' => 'Factory Account'],
                ['status' => 'active']
            );

            $storeId = Store::query()->create([
                'account_id' => $account->id,
                'name' => 'Factory Store',
                'slug' => 'factory-store-' . fake()->unique()->numerify('###'),
                'default_locale' => 'it_IT',
                'default_currency' => 'EUR',
                'timezone' => 'Europe/Rome',
                'status' => Store::STATUS_ACTIVE,
            ])->id;
        }

        $categoryId = Category::query()->value('id');

        if (!$categoryId) {
            $categoryId = Category::query()->create([
                'store_id' => $storeId,
                'name' => 'Categoria Test',
                'slug' => 'categoria-test',
                'description' => 'Categoria di supporto per i test',
                'order' => 0,
            ])->id;
        }

        return [
            'store_id' => $storeId,
            'name' => Str::title($name),
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(1000, 9999),
            'description' => fake()->sentence(18),
            'price' => fake()->randomFloat(2, 5, 2000),
            'stock' => fake()->numberBetween(0, 200),
            'category_id' => $categoryId,
            'is_active' => true,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Product $product): void {
            if ($product->store_id === null || $product->variants()->exists()) {
                return;
            }

            $variant = ProductVariant::withoutGlobalScopes()->create([
                'store_id' => (int) $product->store_id,
                'product_id' => (int) $product->id,
                'sku' => sprintf('SKU-P%d', (int) $product->id),
                'price' => (float) $product->price,
                'status' => ProductVariant::STATUS_ACTIVE,
            ]);

            $location = InventoryLocation::withoutGlobalScopes()->firstOrCreate(
                [
                    'store_id' => (int) $product->store_id,
                    'code' => 'main',
                ],
                [
                    'name' => 'Magazzino principale',
                    'priority' => 0,
                    'is_active' => true,
                ]
            );

            InventoryLevel::withoutGlobalScopes()->firstOrCreate(
                [
                    'store_id' => (int) $product->store_id,
                    'variant_id' => (int) $variant->id,
                    'location_id' => (int) $location->id,
                ],
                [
                    'on_hand' => max(0, (int) $product->stock),
                    'reserved' => 0,
                    'available' => max(0, (int) $product->stock),
                ]
            );
        });
    }
}
