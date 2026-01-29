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
        Schema::create('navigation_items', function (Blueprint $table) {
            $table->id();
            $table->enum('location', ['header', 'footer'])->default('header')->index();
            $table->foreignId('parent_id')->nullable()->constrained('navigation_items')->onDelete('cascade');
            $table->string('label');
            $table->string('url')->nullable();
            $table->foreignId('page_id')->nullable()->constrained('pages')->onDelete('set null');
            $table->enum('type', ['custom', 'page', 'category'])->default('custom');
            $table->enum('target', ['_self', '_blank'])->default('_self');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['location', 'parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('navigation_items');
    }
};
