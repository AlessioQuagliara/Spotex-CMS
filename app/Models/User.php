<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

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

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->isBackofficeUser() && !$this->is_banned;
    }

    public function isBackofficeUser(): bool
    {
        return in_array($this->role, [self::ROLE_OWNER, self::ROLE_ADMIN, self::ROLE_EDITOR, self::ROLE_VIEWER], true);
    }

    public function canManageUsers(): bool
    {
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
}
