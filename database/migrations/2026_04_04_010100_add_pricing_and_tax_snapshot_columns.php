<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addProductsTaxColumns();
        $this->addOrdersPricingColumns();
        $this->addOrderItemsTaxColumns();
        $this->backfillPricingAndTaxDefaults();
    }

    public function down(): void
    {
        $this->dropOrderItemsTaxColumns();
        $this->dropOrdersPricingColumns();
        $this->dropProductsTaxColumns();
    }

    private function addProductsTaxColumns(): void
    {
        if (!Schema::hasTable('products')) {
            return;
        }

        Schema::table('products', function (Blueprint $table): void {
            if (!Schema::hasColumn('products', 'tax_class_id')) {
                $table->foreignId('tax_class_id')
                    ->nullable()
                    ->after('category_id')
                    ->constrained('tax_classes')
                    ->nullOnDelete();

                $table->index('tax_class_id');
            }
        });
    }

    private function addOrdersPricingColumns(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table): void {
            if (!Schema::hasColumn('orders', 'currency')) {
                $table->string('currency', 3)->nullable()->after('total');
                $table->index('currency');
            }

            if (!Schema::hasColumn('orders', 'fx_rate')) {
                $table->decimal('fx_rate', 12, 6)->default(1)->after('currency');
            }

            if (!Schema::hasColumn('orders', 'tax_total')) {
                $table->decimal('tax_total', 10, 2)->default(0)->after('shipping_cost');
            }
        });
    }

    private function addOrderItemsTaxColumns(): void
    {
        if (!Schema::hasTable('order_items')) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table): void {
            if (!Schema::hasColumn('order_items', 'tax_class_id')) {
                $table->foreignId('tax_class_id')
                    ->nullable()
                    ->after('inventory_location_id')
                    ->constrained('tax_classes')
                    ->nullOnDelete();

                $table->index('tax_class_id');
            }

            if (!Schema::hasColumn('order_items', 'price_list_id')) {
                $table->foreignId('price_list_id')
                    ->nullable()
                    ->after('tax_class_id')
                    ->constrained('price_lists')
                    ->nullOnDelete();

                $table->index('price_list_id');
            }

            if (!Schema::hasColumn('order_items', 'tax_rate_snapshot')) {
                $table->decimal('tax_rate_snapshot', 8, 4)->default(0)->after('unit_price');
            }

            if (!Schema::hasColumn('order_items', 'tax_amount')) {
                $table->decimal('tax_amount', 10, 2)->default(0)->after('subtotal');
            }
        });
    }

    private function backfillPricingAndTaxDefaults(): void
    {
        if (!Schema::hasTable('stores')
            || !Schema::hasTable('product_variants')
            || !Schema::hasTable('price_lists')
            || !Schema::hasTable('price_list_prices')
            || !Schema::hasTable('tax_classes')) {
            return;
        }

        $stores = DB::table('stores')->select(['id', 'default_currency'])->orderBy('id')->get();

        foreach ($stores as $store) {
            $storeId = (int) $store->id;
            $currency = strtoupper(trim((string) ($store->default_currency ?? 'EUR')));
            if ($currency === '') {
                $currency = 'EUR';
            }

            if (Schema::hasTable('store_currencies')) {
                DB::table('store_currencies')->updateOrInsert(
                    ['store_id' => $storeId, 'currency' => $currency],
                    [
                        'is_default' => true,
                        'is_enabled' => true,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }

            $priceListId = DB::table('price_lists')
                ->where('store_id', $storeId)
                ->where('currency', $currency)
                ->whereNull('country_code')
                ->where('channel', 'online')
                ->where('is_default', true)
                ->value('id');

            if (!is_numeric($priceListId)) {
                $priceListId = DB::table('price_lists')->insertGetId([
                    'store_id' => $storeId,
                    'name' => sprintf('Default %s', $currency),
                    'currency' => $currency,
                    'country_code' => null,
                    'channel' => 'online',
                    'is_default' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $priceListId = (int) $priceListId;
            }

            $variants = DB::table('product_variants')
                ->where('store_id', $storeId)
                ->select(['id', 'price', 'compare_at_price'])
                ->orderBy('id')
                ->get();

            foreach ($variants as $variant) {
                DB::table('price_list_prices')->updateOrInsert(
                    [
                        'price_list_id' => $priceListId,
                        'variant_id' => (int) $variant->id,
                    ],
                    [
                        'amount' => (float) $variant->price,
                        'compare_at_amount' => $variant->compare_at_price !== null ? (float) $variant->compare_at_price : null,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }

            $standardTaxClassId = DB::table('tax_classes')
                ->where('store_id', $storeId)
                ->where('code', 'standard')
                ->value('id');

            if (!is_numeric($standardTaxClassId)) {
                $standardTaxClassId = DB::table('tax_classes')->insertGetId([
                    'store_id' => $storeId,
                    'name' => 'Standard',
                    'code' => 'standard',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $standardTaxClassId = (int) $standardTaxClassId;
            }

            if (Schema::hasColumn('products', 'tax_class_id')) {
                DB::table('products')
                    ->where('store_id', $storeId)
                    ->whereNull('tax_class_id')
                    ->update(['tax_class_id' => $standardTaxClassId]);
            }

            if (Schema::hasColumn('orders', 'currency')) {
                DB::table('orders')
                    ->where('store_id', $storeId)
                    ->whereNull('currency')
                    ->update(['currency' => $currency]);
            }

            if (Schema::hasColumn('order_items', 'tax_class_id') && Schema::hasColumn('products', 'tax_class_id')) {
                $rows = DB::table('order_items as oi')
                    ->join('products as p', 'p.id', '=', 'oi.product_id')
                    ->where('oi.store_id', $storeId)
                    ->whereNull('oi.tax_class_id')
                    ->select(['oi.id as order_item_id', 'p.tax_class_id as product_tax_class_id'])
                    ->get();

                foreach ($rows as $row) {
                    if (!is_numeric($row->product_tax_class_id)) {
                        continue;
                    }

                    DB::table('order_items')
                        ->where('id', (int) $row->order_item_id)
                        ->update(['tax_class_id' => (int) $row->product_tax_class_id]);
                }
            }
        }
    }

    private function dropOrderItemsTaxColumns(): void
    {
        if (!Schema::hasTable('order_items')) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table): void {
            if (Schema::hasColumn('order_items', 'tax_amount')) {
                $table->dropColumn('tax_amount');
            }

            if (Schema::hasColumn('order_items', 'tax_rate_snapshot')) {
                $table->dropColumn('tax_rate_snapshot');
            }

            if (Schema::hasColumn('order_items', 'price_list_id')) {
                $table->dropConstrainedForeignId('price_list_id');
            }

            if (Schema::hasColumn('order_items', 'tax_class_id')) {
                $table->dropConstrainedForeignId('tax_class_id');
            }
        });
    }

    private function dropOrdersPricingColumns(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table): void {
            if (Schema::hasColumn('orders', 'tax_total')) {
                $table->dropColumn('tax_total');
            }

            if (Schema::hasColumn('orders', 'fx_rate')) {
                $table->dropColumn('fx_rate');
            }

            if (Schema::hasColumn('orders', 'currency')) {
                $table->dropColumn('currency');
            }
        });
    }

    private function dropProductsTaxColumns(): void
    {
        if (!Schema::hasTable('products')) {
            return;
        }

        Schema::table('products', function (Blueprint $table): void {
            if (Schema::hasColumn('products', 'tax_class_id')) {
                $table->dropConstrainedForeignId('tax_class_id');
            }
        });
    }
};
