<?php

namespace Tests\Feature;

use App\Filament\Resources\UserResource;
use App\Models\Account;
use App\Models\Store;
use App\Models\User;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AccountRoleRbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_manage_users_depends_on_account_membership_role(): void
    {
        [$storeA, $storeB] = $this->createTwoStores();

        $user = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'is_admin' => true,
        ]);

        DB::table('account_users')->insert([
            'account_id' => $storeA->account_id,
            'user_id' => $user->id,
            'role' => User::ROLE_VIEWER,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('account_users')->insert([
            'account_id' => $storeB->account_id,
            'user_id' => $user->id,
            'role' => User::ROLE_ADMIN,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        app(TenantContext::class)->setStore($storeA);
        $this->assertTrue($user->isBackofficeUser());
        $this->assertFalse($user->canManageUsers());

        app(TenantContext::class)->setStore($storeB);
        $this->assertTrue($user->isBackofficeUser());
        $this->assertTrue($user->canManageUsers());
    }

    public function test_global_admin_without_membership_cannot_manage_users_in_store_context(): void
    {
        [$storeA] = $this->createTwoStores();

        $user = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'is_admin' => true,
        ]);

        app(TenantContext::class)->setStore($storeA);

        $this->assertFalse($user->canManageUsers());
    }

    public function test_user_resource_sync_membership_role_writes_account_users(): void
    {
        [$storeA] = $this->createTwoStores();

        $user = User::factory()->create([
            'role' => User::ROLE_EDITOR,
            'is_admin' => false,
        ]);

        app(TenantContext::class)->setStore($storeA);

        UserResource::syncMembershipRole($user, User::ROLE_EDITOR);

        $this->assertDatabaseHas('account_users', [
            'account_id' => $storeA->account_id,
            'user_id' => $user->id,
            'role' => User::ROLE_EDITOR,
            'status' => 'active',
        ]);
    }

    /**
     * @return array{Store, Store}
     */
    private function createTwoStores(): array
    {
        $accountA = Account::query()->create(['name' => 'Account A', 'status' => 'active']);
        $accountB = Account::query()->create(['name' => 'Account B', 'status' => 'active']);

        $storeA = Store::query()->create([
            'account_id' => $accountA->id,
            'name' => 'Store A',
            'slug' => 'store-a',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        $storeB = Store::query()->create([
            'account_id' => $accountB->id,
            'name' => 'Store B',
            'slug' => 'store-b',
            'default_locale' => 'it_IT',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Rome',
            'status' => Store::STATUS_ACTIVE,
        ]);

        return [$storeA, $storeB];
    }
}
