<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Aggiunge colonne per separare payment_status e shipping_status.
     * Questa migrazione è un'alternativa a quella originale orders table
     * se desideri una separazione più esplicita degli stati.
     * 
     * Colonna status è mantenuta per compatibilità, ma il workflow
     * dovrebbe usare le colonne specifiche per clarity e manutenibilità.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Aggiungi colonne per payment e shipping status separatamente
            // payment_status: pending, paid, failed, refunded
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])
                ->default('pending')
                ->after('status')
                ->index();

            // shipping_status: not_shipped, shipped, delivered, returned
            $table->enum('shipping_status', ['not_shipped', 'shipped', 'delivered', 'returned'])
                ->default('not_shipped')
                ->after('payment_status')
                ->index();

            // Timestamp per il pagamento (già esiste come paid_at, ma dichiaro esplicitamente)
            $table->timestamp('shipped_at')->nullable()->after('paid_at');
            $table->timestamp('delivered_at')->nullable()->after('shipped_at');

            // Tracking number per spedizione
            $table->string('tracking_number')->nullable()->after('delivered_at')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'payment_status',
                'shipping_status',
                'shipped_at',
                'delivered_at',
                'tracking_number',
            ]);
        });
    }
};
