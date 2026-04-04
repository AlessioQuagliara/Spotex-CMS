<?php

namespace App\Services\Builder;

use App\Models\Category;
use App\Models\Product;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class BuilderPreviewCatalog
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function build(): array
    {
        $categories = $this->applyStoreScope(Category::query())
            ->withCount(['products' => fn ($builder) => $builder->where('is_active', true)])
            ->orderBy('order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'parent_id'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => Str::limit((string) $category->description, 120),
                'parent_id' => $category->parent_id,
                'products_count' => $category->products_count,
                'url' => route('category.show', $category),
            ])
            ->values()
            ->all();

        $products = $this->applyStoreScope(Product::query())
            ->where('is_active', true)
            ->with(['category:id,name,slug', 'primaryImage:id,product_id,image_path,alt_text'])
            ->latest('id')
            ->limit(24)
            ->get(['id', 'name', 'slug', 'description', 'price', 'stock', 'category_id'])
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => Str::limit(strip_tags((string) $product->description), 140),
                'price' => number_format((float) $product->price, 2, '.', ''),
                'stock' => (int) $product->stock,
                'category_id' => $product->category_id,
                'category_name' => $product->category?->name,
                'category_slug' => $product->category?->slug,
                'url' => route('product.show', $product),
                'image' => $this->imageUrl($product->primaryImage?->image_path),
            ])
            ->values()
            ->all();

        return [
            'categories' => $categories,
            'products' => $products,
        ];
    }

    private function imageUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', '/storage/'])) {
            return $path;
        }

        return asset('storage/' . ltrim($path, '/'));
    }

    private function applyStoreScope(Builder $query): Builder
    {
        $storeId = $this->tenantContext->storeId();

        if ($storeId === null) {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($storeId): void {
            $builder
                ->where('store_id', $storeId)
                ->orWhereNull('store_id');
        });
    }
}
