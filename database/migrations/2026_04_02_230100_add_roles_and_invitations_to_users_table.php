<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('role', 32)->default(User::ROLE_CUSTOMER)->after('is_admin');
            $table->foreignId('invited_by_id')->nullable()->after('remember_token')->constrained('users')->nullOnDelete();
            $table->string('invitation_token', 100)->nullable()->unique()->after('invited_by_id');
            $table->timestamp('invitation_expires_at')->nullable()->after('invitation_token');
            $table->timestamp('invitation_accepted_at')->nullable()->after('invitation_expires_at');
        });

        DB::table('users')
            ->where('is_admin', true)
            ->update(['role' => User::ROLE_ADMIN]);

        $adminEmail = trim((string) env('ADMIN_EMAIL', ''));
        if ($adminEmail !== '') {
            DB::table('users')
                ->where('email', $adminEmail)
                ->update([
                    'is_admin' => true,
                    'role' => User::ROLE_OWNER,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('invited_by_id');
            $table->dropColumn([
                'role',
                'invitation_token',
                'invitation_expires_at',
                'invitation_accepted_at',
            ]);
        });
    }
};
