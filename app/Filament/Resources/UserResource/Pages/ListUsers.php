<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use App\Models\User;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ListUsers extends ListRecords
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
            Actions\Action::make('invite_user')
                ->label('Invita utente')
                ->icon('heroicon-o-envelope')
                ->form([
                    \Filament\Forms\Components\TextInput::make('name')
                        ->label('Nome (opzionale)')
                        ->maxLength(255),
                    \Filament\Forms\Components\TextInput::make('email')
                        ->label('Email')
                        ->email()
                        ->required()
                        ->maxLength(255),
                    \Filament\Forms\Components\Select::make('role')
                        ->label('Ruolo')
                        ->options(User::backofficeRoleOptions())
                        ->default(User::ROLE_EDITOR)
                        ->required(),
                ])
                ->action(function (array $data): void {
                    $email = strtolower(trim((string) $data['email']));
                    $defaultName = trim((string) ($data['name'] ?? '')) ?: Str::headline((string) Str::before($email, '@'));
                    $role = (string) $data['role'];

                    $user = User::query()->firstOrNew([
                        'email' => $email,
                    ]);

                    if (!$user->exists) {
                        $user->password = Hash::make(Str::random(40));
                    }

                    $user->name = $defaultName;
                    $user->role = $role;
                    $user->email_verified_at = null;
                    $user->save();

                    UserResource::sendInvitation($user, auth()->user());

                    Notification::make()
                        ->title('Invito inviato')
                        ->body("Utente invitato con ruolo {$role}: {$user->email}")
                        ->success()
                        ->send();
                }),
        ];
    }
}
