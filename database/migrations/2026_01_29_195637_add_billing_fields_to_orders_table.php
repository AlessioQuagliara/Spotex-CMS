<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('billing_same_as_shipping')->default(true)->after('billing_address');
            $table->string('billing_name')->nullable()->after('billing_same_as_shipping');
            $table->string('billing_company')->nullable()->after('billing_name');
            $table->string('billing_tax_id')->nullable()->after('billing_company');
            $table->text('notes')->nullable()->after('billing_tax_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'billing_same_as_shipping',
                'billing_name',
                'billing_company',
                'billing_tax_id',
                'notes',
            ]);
        });
    }
};
