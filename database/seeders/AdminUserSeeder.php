<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = trim((string) env('ADMIN_EMAIL', 'admin@spotex.test'));
        $password = (string) env('ADMIN_PASSWORD', 'password');
        $name = trim((string) env('ADMIN_NAME', 'Admin'));
        $role = trim((string) env('ADMIN_ROLE', \App\Models\User::ROLE_OWNER));

        if (!in_array($role, array_keys(\App\Models\User::roleOptions()), true)) {
            $role = \App\Models\User::ROLE_OWNER;
        }

        if ($email === '') {
            return;
        }

        User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name !== '' ? $name : 'Admin',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'is_admin' => in_array($role, [\App\Models\User::ROLE_OWNER, \App\Models\User::ROLE_ADMIN], true),
                'role' => $role,
                'invitation_token' => null,
                'invitation_expires_at' => null,
                'invitation_accepted_at' => now(),
            ],
        );
    }
}
