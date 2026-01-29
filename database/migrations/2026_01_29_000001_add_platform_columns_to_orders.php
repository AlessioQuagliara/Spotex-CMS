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
            // Payment provider: stripe|paypal
            $table->string('payment_provider')->nullable()->after('payment_method');
            
            // Platform mode: off|stripe_connect|paypal_multiparty
            $table->string('platform_mode')->default('off')->after('payment_provider');
            
            // Commission amount in cents/integer
            $table->integer('commission_amount')->default(0)->after('platform_mode');
            
            // Provider-specific payment ID (session_id, payment_intent_id, paypal_order_id)
            $table->string('provider_payment_id')->nullable()->after('commission_amount');
            
            // Provider event ID for webhook idempotency
            $table->string('provider_event_id')->nullable()->after('provider_payment_id');
            
            // Index per query su provider e platform mode
            $table->index(['payment_provider', 'platform_mode']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['payment_provider', 'platform_mode']);
            $table->dropColumn([
                'payment_provider',
                'platform_mode',
                'commission_amount',
                'provider_payment_id',
                'provider_event_id',
            ]);
        });
    }
};
