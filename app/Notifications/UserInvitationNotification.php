<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly User $invitee,
        private readonly ?User $inviter = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $inviterName = $this->inviter?->name ?: 'Il team di amministrazione';
        $expiresAt = $this->invitee->invitation_expires_at?->timezone(config('app.timezone'))->format('d/m/Y H:i');

        return (new MailMessage())
            ->subject('Invito a Spotex CMS')
            ->greeting('Ciao!')
            ->line("{$inviterName} ti ha invitato a collaborare su Spotex CMS.")
            ->line('Ruolo assegnato: ' . (User::roleOptions()[$this->invitee->role] ?? $this->invitee->role))
            ->line($expiresAt ? "Questo invito scade il {$expiresAt}." : 'Questo invito non ha una scadenza specifica.')
            ->action('Accetta invito', url('/invito/' . $this->invitee->invitation_token))
            ->line('Se non ti aspettavi questo invito, puoi ignorare questa email.');
    }
}
