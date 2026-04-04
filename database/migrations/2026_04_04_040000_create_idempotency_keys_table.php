<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('idempotency_keys')) {
            return;
        }

        Schema::create('idempotency_keys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('idempotency_key', 255);
            $table->string('request_hash', 128);
            $table->json('response_json')->nullable();
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->json('response_headers_json')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->unique(['store_id', 'idempotency_key'], 'idempotency_keys_store_key_unique');
            $table->index(['store_id', 'expires_at']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');
    }
};
