<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('author_name');
            $table->string('author_email')->nullable();
            $table->unsignedTinyInteger('rating');
            $table->string('title');
            $table->text('body');
            $table->boolean('is_approved')->default(true);
            $table->timestamps();

            $table->index(['product_id', 'rating']);
            $table->index('is_approved');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};
