<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            !Schema::hasTable('users')
            || !Schema::hasTable('accounts')
            || !Schema::hasTable('stores')
            || !Schema::hasTable('account_users')
        ) {
            return;
        }

        $accountIds = DB::table('accounts')->orderBy('id')->pluck('id')->all();
        if ($accountIds === []) {
            return;
        }

        $backofficeRoles = ['owner', 'admin', 'editor', 'viewer'];

        $users = DB::table('users')
            ->select(['id', 'role', 'is_admin'])
            ->orderBy('id')
            ->get();

        foreach ($users as $user) {
            $role = in_array((string) $user->role, $backofficeRoles, true)
                ? (string) $user->role
                : ((bool) $user->is_admin ? 'admin' : null);

            if ($role === null) {
                continue;
            }

            foreach ($accountIds as $accountId) {
                $exists = DB::table('account_users')
                    ->where('account_id', $accountId)
                    ->where('user_id', $user->id)
                    ->exists();

                if ($exists) {
                    continue;
                }

                DB::table('account_users')->insert([
                    'account_id' => $accountId,
                    'user_id' => $user->id,
                    'role' => $role,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $accountsWithoutOwner = DB::table('accounts')
            ->whereNull('owner_user_id')
            ->pluck('id')
            ->all();

        foreach ($accountsWithoutOwner as $accountId) {
            $ownerUserId = DB::table('account_users')
                ->where('account_id', $accountId)
                ->whereIn('role', ['owner', 'admin'])
                ->orderByRaw("CASE WHEN role = 'owner' THEN 0 ELSE 1 END")
                ->orderBy('user_id')
                ->value('user_id');

            if (is_numeric($ownerUserId)) {
                DB::table('accounts')
                    ->where('id', $accountId)
                    ->update(['owner_user_id' => (int) $ownerUserId]);
            }
        }
    }

    public function down(): void
    {
        // intentionally left blank: data backfill migration
    }
};
