<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use App\Support\Tenancy\TenantContext;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class User extends Authenticatable implements MustVerifyEmail, FilamentUser
{
    use HasFactory, Notifiable;

    public const ROLE_OWNER = 'owner';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_EDITOR = 'editor';
    public const ROLE_VIEWER = 'viewer';
    public const ROLE_CUSTOMER = 'customer';

    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'is_admin',
        'role',
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
        'invited_by_id',
        'invitation_token',
        'invitation_expires_at',
        'invitation_accepted_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'invitation_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_admin' => 'boolean',
        'birth_date' => 'date',
        'is_banned' => 'boolean',
        'banned_at' => 'datetime',
        'invitation_expires_at' => 'datetime',
        'invitation_accepted_at' => 'datetime',
    ];

    /**
     * Cache locale role membership per account (request lifecycle).
     *
     * @var array<int, string|null>
     */
    private array $accountRoleCache = [];

    protected static function booted(): void
    {
        static::saving(function (self $user): void {
            if (!is_string($user->role) || trim($user->role) === '') {
                $user->role = $user->is_admin ? self::ROLE_ADMIN : self::ROLE_CUSTOMER;
            }

            if ($user->role === self::ROLE_CUSTOMER && $user->is_admin) {
                $user->role = self::ROLE_ADMIN;
            }

            $user->is_admin = in_array($user->role, [self::ROLE_OWNER, self::ROLE_ADMIN], true);

            if ($user->is_banned && $user->banned_at === null) {
                $user->banned_at = now();
            }

            if (!$user->is_banned) {
                $user->banned_at = null;
            }
        });

        static::created(function (self $user): void {
            $user->ensureDefaultBackofficeMembership();
        });
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function getShippingAddress(): ?Address
    {
        return $this->addresses()->where('type', 'shipping')->where('is_default', true)->first()
            ?? $this->addresses()->where('type', 'shipping')->first();
    }

    public function getBillingAddress(): ?Address
    {
        return $this->addresses()->where('type', 'billing')->where('is_default', true)->first()
            ?? $this->addresses()->where('type', 'billing')->first();
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'invited_by_id');
    }

    public function accounts(): BelongsToMany
    {
        return $this->belongsToMany(Account::class, 'account_users')
            ->withPivot(['role', 'status'])
            ->withTimestamps();
    }

    public function ownedAccounts(): HasMany
    {
        return $this->hasMany(Account::class, 'owner_user_id');
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->isBackofficeUser() && !$this->is_banned;
    }

    public static function backofficeRoles(): array
    {
        return [self::ROLE_OWNER, self::ROLE_ADMIN, self::ROLE_EDITOR, self::ROLE_VIEWER];
    }

    public function roleForAccount(?int $accountId = null): ?string
    {
        if ($accountId === null) {
            return null;
        }

        if (array_key_exists($accountId, $this->accountRoleCache)) {
            return $this->accountRoleCache[$accountId];
        }

        $role = $this->accounts()
            ->where('accounts.id', $accountId)
            ->first()
            ?->pivot
            ?->role;

        $this->accountRoleCache[$accountId] = is_string($role) ? $role : null;

        return $this->accountRoleCache[$accountId];
    }

    public function roleForStore(?int $storeId = null): ?string
    {
        $resolvedStoreId = $storeId ?? $this->currentStoreId();
        if ($resolvedStoreId === null) {
            return null;
        }

        $accountId = Store::query()
            ->withoutGlobalScopes()
            ->where('id', $resolvedStoreId)
            ->value('account_id');

        return is_numeric($accountId) ? $this->roleForAccount((int) $accountId) : null;
    }

    public function effectiveRole(?int $storeId = null): string
    {
        return $this->roleForStore($storeId) ?? (string) $this->role;
    }

    public function isBackofficeUser(?int $storeId = null): bool
    {
        $resolvedStoreId = $storeId ?? $this->currentStoreId();
        if ($resolvedStoreId !== null) {
            return in_array((string) $this->roleForStore($resolvedStoreId), self::backofficeRoles(), true);
        }

        return in_array($this->role, self::backofficeRoles(), true);
    }

    public function canManageUsers(?int $storeId = null): bool
    {
        $resolvedStoreId = $storeId ?? $this->currentStoreId();
        if ($resolvedStoreId !== null) {
            return in_array((string) $this->roleForStore($resolvedStoreId), [self::ROLE_OWNER, self::ROLE_ADMIN], true);
        }

        return in_array($this->role, [self::ROLE_OWNER, self::ROLE_ADMIN], true);
    }

    public function isInvitationPending(): bool
    {
        return !empty($this->invitation_token)
            && $this->invitation_accepted_at === null
            && $this->invitation_expires_at !== null
            && $this->invitation_expires_at->isFuture();
    }

    public function hasRole(string|array $roles): bool
    {
        $allowedRoles = is_array($roles) ? $roles : [$roles];

        return in_array($this->role, $allowedRoles, true);
    }

    public static function roleOptions(): array
    {
        return [
            self::ROLE_OWNER => 'Owner',
            self::ROLE_ADMIN => 'Admin',
            self::ROLE_EDITOR => 'Editor',
            self::ROLE_VIEWER => 'Viewer',
            self::ROLE_CUSTOMER => 'Cliente',
        ];
    }

    public static function backofficeRoleOptions(): array
    {
        return collect(self::roleOptions())
            ->except([self::ROLE_CUSTOMER])
            ->all();
    }

    public function getProfileLabel(): string
    {
        return $this->profile_type === 'company' ? 'Azienda' : 'Privato';
    }

    private function currentStoreId(): ?int
    {
        if (!app()->bound(TenantContext::class)) {
            return null;
        }

        /** @var TenantContext $context */
        $context = app(TenantContext::class);

        return $context->storeId();
    }

    private function ensureDefaultBackofficeMembership(): void
    {
        if (!in_array((string) $this->role, self::backofficeRoles(), true)) {
            return;
        }

        if (
            !Schema::hasTable('accounts')
            || !Schema::hasTable('account_users')
            || !Schema::hasTable('stores')
        ) {
            return;
        }

        if ($this->accounts()->exists()) {
            return;
        }

        $accountId = DB::table('stores')
            ->orderBy('id')
            ->value('account_id');

        if (!is_numeric($accountId)) {
            return;
        }

        DB::table('account_users')->insert([
            'account_id' => (int) $accountId,
            'user_id' => $this->id,
            'role' => $this->role,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
