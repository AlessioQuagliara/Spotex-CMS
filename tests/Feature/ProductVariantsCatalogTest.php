<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductVariantsCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_product_options_and_values(): void
    {
        [$storeA] = $this->createTwoStores();
        app(TenantContext::class)->setStore($storeA);

        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $storeA->id,
            'name' => 'T-shirt',
            'slug' => 't-shirt',
            'description' => 'T-shirt',
            'order' => 0,
        ]);

        $product = Product::withoutGlobalScopes()->create([
            'store_id' => $storeA->id,
            'name' => 'Maglietta Premium',
            'slug' => 'maglietta-premium',
            'description' => 'Prodotto test',
            'price' => 29.90,
            'stock' => 100,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        $option = ProductOption::create([
            'product_id' => $product->id,
            'name' => 'Taglia',
            'position' => 1,
        ]);

        ProductOptionValue::create([
            'product_option_id' => $option->id,
            'value' => 'S',
            'position' => 1,
        ]);

        ProductOptionValue::create([
            'product_option_id' => $option->id,
            'value' => 'M',
            'position' => 2,
        ]);

        $this->assertDatabaseHas('product_options', [
            'id' => $option->id,
            'store_id' => $storeA->id,
            'product_id' => $product->id,
            'name' => 'Taglia',
        ]);

        $this->assertDatabaseCount('product_option_values', 2);
    }

    public function test_variant_sku_is_unique_per_store(): void
    {
        [$storeA, $storeB] = $this->createTwoStores();

        $productA = $this->createProductForStore($storeA, 'prodotto-a');
        $productB = $this->createProductForStore($storeB, 'prodotto-b');

        ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $storeA->id,
            'product_id' => $productA->id,
            'sku' => 'SKU-001',
            'price' => 19.90,
            'status' => ProductVariant::STATUS_ACTIVE,
        ]);

        $sameSkuDifferentStore = ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $storeB->id,
            'product_id' => $productB->id,
            'sku' => 'SKU-001',
            'price' => 24.90,
            'status' => ProductVariant::STATUS_ACTIVE,
        ]);

        $this->assertDatabaseHas('product_variants', [
            'id' => $sameSkuDifferentStore->id,
            'store_id' => $storeB->id,
            'sku' => 'SKU-001',
        ]);

        $this->expectException(QueryException::class);

        ProductVariant::withoutGlobalScopes()->create([
            'store_id' => $storeA->id,
            'product_id' => $productA->id,
            'sku' => 'SKU-001',
            'price' => 29.90,
            'status' => ProductVariant::STATUS_ACTIVE,
        ]);
    }

    /**
     * @return array{Store, Store}
     */
    private function createTwoStores(): array
    {
        $accountA = Account::query()->create(['name' => 'Account A', 'status' => 'active']);
        $accountB = Account::query()->create(['name' => 'Account B', 'status' => 'active']);

        $storeA = Store::query()->create([
            'account_id' => $accountA->id,
            'name' => 'Store A',
            'slug' => 'store-a',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $storeB = Store::query()->create([
            'account_id' => $accountB->id,
            'name' => 'Store B',
            'slug' => 'store-b',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        return [$storeA, $storeB];
    }

    private function createProductForStore(Store $store, string $slug): Product
    {
        $category = Category::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Categoria ' . $slug,
            'slug' => 'cat-' . $slug,
            'description' => 'Categoria',
            'order' => 0,
        ]);

        return Product::withoutGlobalScopes()->create([
            'store_id' => $store->id,
            'name' => 'Prodotto ' . $slug,
            'slug' => $slug,
            'description' => 'Prodotto test',
            'price' => 10.00,
            'stock' => 50,
            'category_id' => $category->id,
            'is_active' => true,
        ]);
    }
}
