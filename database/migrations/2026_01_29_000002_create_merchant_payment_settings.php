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
        Schema::create('merchant_payment_settings', function (Blueprint $table) {
            $table->id();
            
            // Stripe Connect
            $table->string('stripe_connected_account_id')->nullable();
            $table->boolean('stripe_connect_enabled')->default(false);
            
            // PayPal Multiparty
            $table->string('paypal_merchant_id')->nullable();
            $table->boolean('paypal_multiparty_enabled')->default(false);
            
            // Commission settings
            $table->decimal('commission_percent', 5, 2)->default(0.00); // es. 5.50 = 5.5%
            $table->decimal('commission_fixed', 10, 2)->default(0.00); // es. 0.50 = €0.50
            
            // Additional metadata
            $table->string('business_name')->nullable();
            $table->string('business_email')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indici
            $table->index('stripe_connected_account_id');
            $table->index('paypal_merchant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('merchant_payment_settings');
    }
};
