<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->createPriceListTables();
        $this->createTaxTables();
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_rates');
        Schema::dropIfExists('tax_zones');
        Schema::dropIfExists('tax_classes');
        Schema::dropIfExists('price_list_prices');
        Schema::dropIfExists('price_lists');
    }

    private function createPriceListTables(): void
    {
        if (!Schema::hasTable('price_lists')) {
            Schema::create('price_lists', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
                $table->string('name');
                $table->string('currency', 3);
                $table->string('country_code', 2)->nullable();
                $table->string('channel', 32)->nullable();
                $table->boolean('is_default')->default(false);
                $table->timestamps();

                $table->index(['store_id', 'currency', 'country_code', 'channel'], 'price_lists_lookup_idx');
            });
        }

        if (!Schema::hasTable('price_list_prices')) {
            Schema::create('price_list_prices', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('price_list_id')->constrained('price_lists')->cascadeOnDelete();
                $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
                $table->decimal('amount', 12, 2);
                $table->decimal('compare_at_amount', 12, 2)->nullable();
                $table->timestamps();

                $table->unique(['price_list_id', 'variant_id'], 'price_list_prices_unique');
                $table->index('variant_id');
            });
        }
    }

    private function createTaxTables(): void
    {
        if (!Schema::hasTable('tax_classes')) {
            Schema::create('tax_classes', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
                $table->string('name');
                $table->string('code', 64);
                $table->timestamps();

                $table->unique(['store_id', 'code']);
            });
        }

        if (!Schema::hasTable('tax_zones')) {
            Schema::create('tax_zones', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
                $table->string('country_code', 2);
                $table->string('region_code', 32)->nullable();
                $table->string('postal_pattern', 64)->nullable();
                $table->timestamps();

                $table->index(['store_id', 'country_code', 'region_code'], 'tax_zones_lookup_idx');
            });
        }

        if (!Schema::hasTable('tax_rates')) {
            Schema::create('tax_rates', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
                $table->foreignId('tax_zone_id')->constrained('tax_zones')->cascadeOnDelete();
                $table->foreignId('tax_class_id')->nullable()->constrained('tax_classes')->nullOnDelete();
                $table->decimal('rate', 8, 4);
                $table->boolean('is_inclusive')->default(false);
                $table->unsignedSmallInteger('priority')->default(0);
                $table->timestamps();

                $table->index(['tax_zone_id', 'tax_class_id', 'priority'], 'tax_rates_lookup_idx');
                $table->index('store_id');
            });
        }
    }
};
