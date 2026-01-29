<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Tabella di tracking per idempotenza webhook.
     * Garantisce che eventi duplicati (Stripe/PayPal) non vengano processati due volte.
     * 
     * Stripe invia lo stesso evento più volte se non riceve 200 OK in tempo.
     * PayPal può inviare lo stesso evento fuori ordine.
     * Questo DB constraint previene race condition e duplicati.
     */
    public function up(): void
    {
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            
            // Provider: 'stripe' | 'paypal'
            $table->string('provider');
            
            // Event ID from provider (stripe: event.id | paypal: id)
            $table->string('external_event_id');
            
            // Event type (stripe: charge.succeeded, payment_intent.succeeded, etc)
            // (paypal: PAYMENT.CAPTURE.COMPLETED, etc)
            $table->string('event_type');
            
            // Full webhook payload (per debugging/audit)
            $table->longText('payload');
            
            // Processing status
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            
            // Related order ID (null se non ancora identificato)
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('set null');
            
            // Error message se processing fallisce
            $table->text('error_message')->nullable();
            
            // Tentativi di reprocessing
            $table->integer('retry_count')->default(0);
            $table->timestamp('last_retry_at')->nullable();
            
            $table->timestamps();
            
            // Unique constraint: per provider e event_id
            // Garantisce che lo stesso evento non viene mai processato due volte
            $table->unique(['provider', 'external_event_id'], 'webhook_events_provider_event_id_unique');
            
            // Index per query rapide
            $table->index(['provider', 'event_type']);
            $table->index(['status', 'created_at']);
            $table->index(['order_id', 'provider']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
