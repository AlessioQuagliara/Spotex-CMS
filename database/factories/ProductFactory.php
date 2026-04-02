<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
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
        $categoryId = Category::query()->value('id');

        if (!$categoryId) {
            $categoryId = Category::query()->create([
                'name' => 'Categoria Test',
                'slug' => 'categoria-test',
                'description' => 'Categoria di supporto per i test',
                'order' => 0,
            ])->id;
        }

        return [
            'name' => Str::title($name),
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(1000, 9999),
            'description' => fake()->sentence(18),
            'price' => fake()->randomFloat(2, 5, 2000),
            'stock' => fake()->numberBetween(0, 200),
            'category_id' => $categoryId,
            'is_active' => true,
        ];
    }
}
