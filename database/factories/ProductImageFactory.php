<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductImage>
 */
class ProductImageFactory extends Factory
{
    protected $model = ProductImage::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'image_path' => 'products/' . fake()->uuid() . '.jpg',
            'alt_text' => fake()->sentence(4),
            'order' => fake()->numberBetween(0, 10),
            'is_primary' => false,
        ];
    }
}
