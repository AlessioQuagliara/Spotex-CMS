<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->ensureOrderItemVariantColumns();
        $this->ensureOrderReservationColumns();
        $this->createInventoryReservationsTable();
        $this->backfillVariantsAndInventoryForLegacyProducts();
        $this->backfillOrderItemsVariantReference();
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_reservations');

        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'inventory_reservation_expires_at')) {
            Schema::table('orders', function (Blueprint $table): void {
                $table->dropColumn('inventory_reservation_expires_at');
            });
        }

        if (Schema::hasTable('order_items') && Schema::hasColumn('order_items', 'inventory_location_id')) {
            Schema::table('order_items', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('inventory_location_id');
            });
        }

        if (Schema::hasTable('order_items') && Schema::hasColumn('order_items', 'variant_id')) {
            Schema::table('order_items', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('variant_id');
            });
        }
    }

    private function ensureOrderItemVariantColumns(): void
    {
        if (!Schema::hasTable('order_items')) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table): void {
            if (!Schema::hasColumn('order_items', 'variant_id')) {
                $table->foreignId('variant_id')
                    ->nullable()
                    ->after('product_id')
                    ->constrained('product_variants')
                    ->nullOnDelete();

                $table->index('variant_id');
            }

            if (!Schema::hasColumn('order_items', 'inventory_location_id')) {
                $table->foreignId('inventory_location_id')
                    ->nullable()
                    ->after('variant_id')
                    ->constrained('inventory_locations')
                    ->nullOnDelete();

                $table->index('inventory_location_id');
            }
        });
    }

    private function ensureOrderReservationColumns(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table): void {
            if (!Schema::hasColumn('orders', 'inventory_reservation_expires_at')) {
                $table->timestamp('inventory_reservation_expires_at')
                    ->nullable()
                    ->after('provider_event_id');

                $table->index('inventory_reservation_expires_at');
            }
        });
    }

    private function createInventoryReservationsTable(): void
    {
        if (Schema::hasTable('inventory_reservations')) {
            return;
        }

        Schema::create('inventory_reservations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('inventory_locations')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->unsignedInteger('qty');
            $table->timestamp('expires_at');
            $table->string('status', 32)->default('active');
            $table->timestamp('released_at')->nullable();
            $table->string('release_reason', 64)->nullable();
            $table->timestamps();

            $table->index(['store_id', 'status', 'expires_at']);
            $table->index('order_id');
        });
    }

    private function backfillVariantsAndInventoryForLegacyProducts(): void
    {
        if (!Schema::hasTable('products')
            || !Schema::hasTable('product_variants')
            || !Schema::hasTable('inventory_locations')
            || !Schema::hasTable('inventory_levels')) {
            return;
        }

        $storeIds = DB::table('stores')->pluck('id');

        foreach ($storeIds as $storeId) {
            $storeId = (int) $storeId;
            $locationId = $this->resolvePrimaryLocationId($storeId);

            if ($locationId === null) {
                continue;
            }

            $legacyProducts = DB::table('products')
                ->where('store_id', $storeId)
                ->whereNotExists(function ($query): void {
                    $query->select(DB::raw(1))
                        ->from('product_variants')
                        ->whereColumn('product_variants.product_id', 'products.id');
                })
                ->select(['id', 'price', 'stock'])
                ->orderBy('id')
                ->get();

            foreach ($legacyProducts as $product) {
                $variantId = DB::table('product_variants')->insertGetId([
                    'store_id' => $storeId,
                    'product_id' => (int) $product->id,
                    'sku' => $this->generateLegacySku($storeId, (int) $product->id),
                    'barcode' => null,
                    'price' => (float) $product->price,
                    'compare_at_price' => null,
                    'status' => 'active',
                    'weight' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $stock = max(0, (int) $product->stock);

                DB::table('inventory_levels')->insert([
                    'store_id' => $storeId,
                    'variant_id' => $variantId,
                    'location_id' => $locationId,
                    'on_hand' => $stock,
                    'reserved' => 0,
                    'available' => $stock,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $variantsWithoutLevel = DB::table('product_variants as pv')
                ->join('products as p', 'p.id', '=', 'pv.product_id')
                ->leftJoin('inventory_levels as il', 'il.variant_id', '=', 'pv.id')
                ->where('pv.store_id', $storeId)
                ->whereNull('il.id')
                ->select(['pv.id as variant_id', 'p.stock as product_stock'])
                ->orderBy('pv.id')
                ->get();

            foreach ($variantsWithoutLevel as $variant) {
                $stock = max(0, (int) $variant->product_stock);

                DB::table('inventory_levels')->insert([
                    'store_id' => $storeId,
                    'variant_id' => (int) $variant->variant_id,
                    'location_id' => $locationId,
                    'on_hand' => $stock,
                    'reserved' => 0,
                    'available' => $stock,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function backfillOrderItemsVariantReference(): void
    {
        if (!Schema::hasTable('order_items') || !Schema::hasTable('product_variants')) {
            return;
        }

        $rows = DB::table('order_items')
            ->whereNull('variant_id')
            ->whereNotNull('product_id')
            ->select(['id', 'store_id', 'product_id'])
            ->orderBy('id')
            ->get();

        foreach ($rows as $row) {
            $variantId = DB::table('product_variants')
                ->where('product_id', (int) $row->product_id)
                ->when($row->store_id !== null, fn ($query) => $query->where('store_id', (int) $row->store_id))
                ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
                ->orderBy('id')
                ->value('id');

            if ($variantId === null) {
                continue;
            }

            DB::table('order_items')
                ->where('id', (int) $row->id)
                ->update(['variant_id' => (int) $variantId]);
        }
    }

    private function resolvePrimaryLocationId(int $storeId): ?int
    {
        $locationId = DB::table('inventory_locations')
            ->where('store_id', $storeId)
            ->where('code', 'main')
            ->value('id');

        if (is_numeric($locationId)) {
            return (int) $locationId;
        }

        $locationId = DB::table('inventory_locations')
            ->where('store_id', $storeId)
            ->orderBy('priority')
            ->orderBy('id')
            ->value('id');

        if (is_numeric($locationId)) {
            return (int) $locationId;
        }

        return (int) DB::table('inventory_locations')->insertGetId([
            'store_id' => $storeId,
            'name' => 'Magazzino principale',
            'code' => 'main',
            'priority' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function generateLegacySku(int $storeId, int $productId): string
    {
        $baseSku = sprintf('LEGACY-%d-%d', $storeId, $productId);
        $candidate = $baseSku;
        $suffix = 1;

        while (DB::table('product_variants')
            ->where('store_id', $storeId)
            ->where('sku', $candidate)
            ->exists()) {
            $candidate = sprintf('%s-%d', $baseSku, $suffix);
            $suffix++;
        }

        return $candidate;
    }
};
