<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('profile_type', 20)->default('private');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone', 30)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 20)->nullable();
            $table->string('birth_city', 120)->nullable();
            $table->string('birth_province', 8)->nullable();
            $table->string('nationality', 2)->nullable();

            $table->string('tax_code', 32)->nullable();
            $table->string('vat_number', 32)->nullable();
            $table->string('company_name')->nullable();
            $table->string('company_legal_form', 80)->nullable();
            $table->string('pec')->nullable();
            $table->string('sdi_code', 16)->nullable();

            $table->string('billing_address')->nullable();
            $table->string('billing_city', 120)->nullable();
            $table->string('billing_province', 8)->nullable();
            $table->string('billing_postal_code', 20)->nullable();
            $table->string('billing_country', 2)->nullable();

            $table->boolean('is_banned')->default(false);
            $table->timestamp('banned_at')->nullable();
            $table->text('banned_reason')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'profile_type',
                'first_name',
                'last_name',
                'phone',
                'birth_date',
                'gender',
                'birth_city',
                'birth_province',
                'nationality',
                'tax_code',
                'vat_number',
                'company_name',
                'company_legal_form',
                'pec',
                'sdi_code',
                'billing_address',
                'billing_city',
                'billing_province',
                'billing_postal_code',
                'billing_country',
                'is_banned',
                'banned_at',
                'banned_reason',
            ]);
        });
    }
};

