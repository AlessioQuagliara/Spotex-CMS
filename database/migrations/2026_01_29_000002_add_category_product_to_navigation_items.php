<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('navigation_items', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('navigation_items', function (Blueprint $table) {
            $table->dropForeignIdFor('Category::class');
            $table->dropForeignIdFor('Product::class');
        });
    }
};
