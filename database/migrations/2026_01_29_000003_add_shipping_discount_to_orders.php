<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('subtotal', 10, 2)->default(0)->after('transaction_id');
            $table->decimal('shipping_cost', 10, 2)->default(0)->after('subtotal');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('shipping_cost');
            $table->string('discount_code')->nullable()->after('discount_amount');
            $table->string('shipping_method')->nullable()->after('discount_code');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'subtotal',
                'shipping_cost',
                'discount_amount',
                'discount_code',
                'shipping_method',
            ]);
        });
    }
};
