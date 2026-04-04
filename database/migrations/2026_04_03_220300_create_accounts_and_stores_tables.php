<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('status', 32)->default('active');
            $table->foreignId('owner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('owner_user_id');
        });

        Schema::create('account_users', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 32)->default('viewer');
            $table->string('status', 32)->default('active');
            $table->timestamps();

            $table->unique(['account_id', 'user_id']);
            $table->index('role');
            $table->index('status');
        });

        Schema::create('stores', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('default_locale', 16)->default('it_IT');
            $table->string('default_currency', 3)->default('EUR');
            $table->string('timezone', 64)->default('Europe/Rome');
            $table->string('status', 32)->default('active');
            $table->timestamps();

            $table->unique(['account_id', 'slug']);
            $table->index('account_id');
            $table->index('status');
        });

        Schema::create('store_domains', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('domain');
            $table->boolean('is_primary')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->unique('domain');
            $table->index(['store_id', 'is_primary']);
        });

        Schema::create('store_locales', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('locale', 16);
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['store_id', 'locale']);
            $table->index('store_id');
        });

        Schema::create('store_currencies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('currency', 3);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->unique(['store_id', 'currency']);
            $table->index(['store_id', 'is_enabled']);
        });

        Schema::create('store_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('key');
            $table->json('value_json')->nullable();
            $table->timestamps();

            $table->unique(['store_id', 'key']);
            $table->index('store_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_settings');
        Schema::dropIfExists('store_currencies');
        Schema::dropIfExists('store_locales');
        Schema::dropIfExists('store_domains');
        Schema::dropIfExists('stores');
        Schema::dropIfExists('account_users');
        Schema::dropIfExists('accounts');
    }
};
