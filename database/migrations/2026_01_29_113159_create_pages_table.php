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
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title')->unique();
            $table->string('slug')->unique()->index();
            $table->text('description')->nullable()->comment('Meta description');
            $table->text('keywords')->nullable()->comment('Meta keywords');
            $table->longText('html_content')->nullable()->comment('HTML dal builder');
            $table->longText('css_content')->nullable()->comment('CSS custom');
            $table->longText('js_content')->nullable()->comment('JavaScript custom');
            $table->json('builder_data')->nullable()->comment('Dati grezzi del builder (elements array)');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
