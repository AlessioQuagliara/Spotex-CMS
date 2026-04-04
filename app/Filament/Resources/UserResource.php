<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\Store;
use App\Models\User;
use App\Support\Tenancy\TenantContext;
use App\Notifications\UserInvitationNotification;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';
    protected static ?string $navigationLabel = 'Utenti';
    protected static ?string $navigationGroup = 'Amministrazione';
    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Profilo')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('email')
                            ->label('Email')
                            ->email()
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true),
                        Forms\Components\Select::make('role')
                            ->label('Ruolo')
                            ->options(User::backofficeRoleOptions())
                            ->required()
                            ->default(User::ROLE_EDITOR),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Accesso')
                    ->schema([
                        Forms\Components\TextInput::make('password')
                            ->label('Password')
                            ->password()
                            ->revealable()
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->dehydrated(fn (?string $state): bool => filled($state))
                            ->dehydrateStateUsing(fn (string $state): string => Hash::make($state))
                            ->maxLength(255),
                        Forms\Components\Toggle::make('email_verified_at')
                            ->label('Email verificata')
                            ->formatStateUsing(fn (?string $state): bool => !empty($state))
                            ->afterStateHydrated(function (Forms\Components\Toggle $component, ?User $record = null): void {
                                if ($record) {
                                    $component->state($record->email_verified_at !== null);
                                }
                            })
                            ->dehydrateStateUsing(fn (bool $state): ?string => $state ? now()->toDateTimeString() : null),
                        Forms\Components\Toggle::make('is_banned')
                            ->label('Utente sospeso'),
                        Forms\Components\Textarea::make('banned_reason')
                            ->label('Motivo sospensione')
                            ->rows(3)
                            ->maxLength(1000)
                            ->visible(fn (callable $get): bool => (bool) $get('is_banned')),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('email')
                    ->label('Email')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('role')
                    ->label('Ruolo')
                    ->badge()
                    ->formatStateUsing(fn (?string $state, User $record): string => static::roleLabel(static::roleInCurrentAccount($record) ?? (string) $state))
                    ->color(fn (?string $state, User $record): string => static::roleColor(static::roleInCurrentAccount($record) ?? (string) $state))
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_admin')
                    ->label('Admin')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_banned')
                    ->label('Bloccato')
                    ->boolean(),
                Tables\Columns\TextColumn::make('invitation_expires_at')
                    ->label('Invito')
                    ->formatStateUsing(function ($state, User $record): string {
                        if ($record->invitation_accepted_at !== null) {
                            return 'Accettato';
                        }

                        if ($record->invitation_token === null) {
                            return 'Nessuno';
                        }

                        if ($record->invitation_expires_at && $record->invitation_expires_at->isPast()) {
                            return 'Scaduto';
                        }

                        return 'In attesa';
                    })
                    ->badge()
                    ->color(function ($state, User $record): string {
                        if ($record->invitation_accepted_at !== null) {
                            return 'success';
                        }

                        if ($record->invitation_token === null) {
                            return 'gray';
                        }

                        if ($record->invitation_expires_at && $record->invitation_expires_at->isPast()) {
                            return 'danger';
                        }

                        return 'warning';
                    }),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Creato')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('role')
                    ->label('Ruolo')
                    ->options(User::backofficeRoleOptions()),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Action::make('change_role')
                    ->label('Cambia ruolo')
                    ->icon('heroicon-o-shield-check')
                    ->visible(fn (User $record): bool => static::roleInCurrentAccount($record) !== User::ROLE_OWNER)
                    ->form([
                        Forms\Components\Select::make('role')
                            ->label('Ruolo')
                            ->options(User::backofficeRoleOptions())
                            ->required(),
                    ])
                    ->fillForm(fn (User $record): array => [
                        'role' => static::roleInCurrentAccount($record) ?? $record->role,
                    ])
                    ->action(function (User $record, array $data): void {
                        $role = (string) $data['role'];
                        $record->role = $role;
                        $record->save();
                        static::syncMembershipRole($record, $role, static::currentActor());

                        Notification::make()
                            ->title('Ruolo aggiornato')
                            ->body("Nuovo ruolo: {$role}")
                            ->success()
                            ->send();
                    }),
                Action::make('resend_invitation')
                    ->label('Invia/Reinvia invito')
                    ->icon('heroicon-o-paper-airplane')
                    ->visible(fn (User $record): bool => static::roleInCurrentAccount($record) !== User::ROLE_OWNER)
                    ->requiresConfirmation()
                    ->action(function (User $record): void {
                        static::sendInvitation($record, static::currentActor());

                        Notification::make()
                            ->title('Invito inviato')
                            ->body("Email inviata a {$record->email}.")
                            ->success()
                            ->send();
                    }),
                Action::make('ban_user')
                    ->label('Sospendi')
                    ->color('danger')
                    ->icon('heroicon-o-no-symbol')
                    ->visible(fn (User $record): bool => !$record->is_banned && static::currentActor()?->id !== $record->id && static::roleInCurrentAccount($record) !== User::ROLE_OWNER)
                    ->form([
                        Forms\Components\Textarea::make('reason')
                            ->label('Motivazione sospensione')
                            ->rows(3)
                            ->maxLength(1000),
                    ])
                    ->requiresConfirmation()
                    ->action(function (User $record, array $data): void {
                        $record->update([
                            'is_banned' => true,
                            'banned_at' => now(),
                            'banned_reason' => trim((string) ($data['reason'] ?? '')) ?: null,
                        ]);

                        Notification::make()
                            ->title('Utente sospeso')
                            ->body("Account sospeso: {$record->email}")
                            ->success()
                            ->send();
                    }),
                Action::make('unban_user')
                    ->label('Riattiva')
                    ->color('success')
                    ->icon('heroicon-o-check-circle')
                    ->visible(fn (User $record): bool => $record->is_banned)
                    ->requiresConfirmation()
                    ->action(function (User $record): void {
                        $record->update([
                            'is_banned' => false,
                            'banned_at' => null,
                            'banned_reason' => null,
                        ]);

                        Notification::make()
                            ->title('Utente riattivato')
                            ->body("Account riattivato: {$record->email}")
                            ->success()
                            ->send();
                    }),
                Tables\Actions\DeleteAction::make()
                    ->visible(fn (User $record): bool => static::currentActor()?->id !== $record->id && static::roleInCurrentAccount($record) !== User::ROLE_OWNER),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery()->select('users.*');
        $accountId = static::currentAccountId();

        if ($accountId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query
            ->join('account_users', 'account_users.user_id', '=', 'users.id')
            ->where('account_users.account_id', $accountId)
            ->where('account_users.status', 'active')
            ->orderBy('users.id');
    }

    public static function canViewAny(): bool
    {
        return static::currentActor()?->canManageUsers() ?? false;
    }

    public static function canCreate(): bool
    {
        return static::currentActor()?->canManageUsers() ?? false;
    }

    public static function canEdit($record): bool
    {
        return static::currentActor()?->canManageUsers() ?? false;
    }

    public static function canDelete($record): bool
    {
        if (!$record instanceof User) {
            return false;
        }

        return (static::currentActor()?->canManageUsers() ?? false)
            && static::currentActor()?->id !== $record->id
            && static::roleInCurrentAccount($record) !== User::ROLE_OWNER;
    }

    public static function sendInvitation(User $user, ?User $inviter = null, ?string $role = null): void
    {
        $token = static::generateInvitationToken();
        $expiresHours = max(1, (int) config('auth.invitations.expires_hours', 72));
        $resolvedRole = $role ?? static::roleInCurrentAccount($user) ?? $user->role;
        static::syncMembershipRole($user, (string) $resolvedRole, $inviter);

        $user->fill([
            'invited_by_id' => $inviter?->id,
            'invitation_token' => $token,
            'invitation_expires_at' => now()->addHours($expiresHours),
            'invitation_accepted_at' => null,
            'password' => $user->password ?: Hash::make(Str::random(40)),
            'role' => $resolvedRole,
        ]);
        $user->save();

        $user->notify(new UserInvitationNotification($user, $inviter));
    }

    public static function generateInvitationToken(): string
    {
        do {
            $token = Str::random(64);
        } while (User::query()->where('invitation_token', $token)->exists());

        return $token;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canViewAny();
    }

    public static function syncMembershipRole(User $user, string $role, ?User $actor = null): void
    {
        $accountId = static::currentAccountId();
        if ($accountId === null) {
            return;
        }

        $resolvedRole = in_array($role, array_keys(User::backofficeRoleOptions()), true)
            ? $role
            : User::ROLE_VIEWER;

        $existing = DB::table('account_users')
            ->where('account_id', $accountId)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            DB::table('account_users')
                ->where('account_id', $accountId)
                ->where('user_id', $user->id)
                ->update([
                    'role' => $resolvedRole,
                    'status' => 'active',
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('account_users')->insert([
                'account_id' => $accountId,
                'user_id' => $user->id,
                'role' => $resolvedRole,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public static function roleInCurrentAccount(User $user): ?string
    {
        $accountId = static::currentAccountId();
        if ($accountId === null) {
            return null;
        }

        return $user->roleForAccount($accountId);
    }

    public static function roleLabel(string $role): string
    {
        return User::roleOptions()[$role] ?? $role;
    }

    public static function roleColor(string $role): string
    {
        return match ($role) {
            User::ROLE_OWNER => 'danger',
            User::ROLE_ADMIN => 'warning',
            User::ROLE_EDITOR => 'info',
            User::ROLE_VIEWER => 'success',
            default => 'gray',
        };
    }

    public static function currentStoreId(): ?int
    {
        if (!app()->bound(TenantContext::class)) {
            return null;
        }

        /** @var TenantContext $context */
        $context = app(TenantContext::class);

        return $context->storeId();
    }

    public static function currentAccountId(): ?int
    {
        $storeId = static::currentStoreId();
        if ($storeId !== null) {
            $accountId = Store::query()
                ->withoutGlobalScopes()
                ->where('id', $storeId)
                ->value('account_id');

            return is_numeric($accountId) ? (int) $accountId : null;
        }

        $accountId = Store::query()
            ->withoutGlobalScopes()
            ->orderBy('id')
            ->value('account_id');

        return is_numeric($accountId) ? (int) $accountId : null;
    }

    private static function currentActor(): ?User
    {
        $adminUser = auth('admin')->user();

        if ($adminUser instanceof User) {
            return $adminUser;
        }

        $customerUser = auth('customer')->user();

        return $customerUser instanceof User ? $customerUser : null;
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
