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
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 10, 2);
            $table->decimal('max_discount', 10, 2)->nullable(); // Sconto massimo per percentuale
            $table->decimal('min_cart_amount', 10, 2)->nullable(); // Importo minimo carrello
            $table->integer('max_uses')->nullable(); // Utilizzi massimi totali
            $table->integer('times_used')->default(0);
            $table->integer('max_uses_per_customer')->default(1);
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
