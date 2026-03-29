<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->string('builder_schema_version', 32)
                ->default('craft-v1')
                ->after('builder_data');

            $table->json('builder_document')
                ->nullable()
                ->after('builder_schema_version');

            $table->json('builder_modules')
                ->nullable()
                ->after('builder_document');

            $table->json('builder_meta')
                ->nullable()
                ->after('builder_modules');
        });

        Schema::create('page_modules', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type');
            $table->string('schema_version', 32)->default('craft-v1');
            $table->json('config');
            $table->json('defaults')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('page_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('schema_version', 32)->default('craft-v1');
            $table->json('document');
            $table->json('meta')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_templates');
        Schema::dropIfExists('page_modules');

        Schema::table('pages', function (Blueprint $table): void {
            $table->dropColumn([
                'builder_schema_version',
                'builder_document',
                'builder_modules',
                'builder_meta',
            ]);
        });
    }
};
