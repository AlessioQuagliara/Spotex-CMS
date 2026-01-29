# Configurazione Email per Spotex CMS

## Setup Email per Produzione

### 1. Gmail (Consigliato per sviluppo/testing)

1. Vai su [Google Account Security](https://myaccount.google.com/security)
2. Abilita la verifica in due passaggi
3. Genera una "App Password" per Laravel
4. Aggiorna il `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tua-email@gmail.com
MAIL_PASSWORD=tua-app-password-generata
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@tuodominio.com"
MAIL_FROM_NAME="Spotex CMS"
```

### 2. SendGrid (Consigliato per produzione)

1. Registrati su [SendGrid](https://sendgrid.com)
2. Crea una API Key
3. Aggiorna il `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=tua-sendgrid-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@tuodominio.com"
MAIL_FROM_NAME="Spotex CMS"
```

### 3. Amazon SES (Economico per alto volume)

```env
MAIL_MAILER=ses
MAIL_FROM_ADDRESS="noreply@tuodominio.com"
MAIL_FROM_NAME="Spotex CMS"

AWS_ACCESS_KEY_ID=tua-access-key
AWS_SECRET_ACCESS_KEY=tua-secret-key
AWS_DEFAULT_REGION=eu-west-1
```

### 4. Mailgun

```env
MAIL_MAILER=mailgun
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=tuo-mailgun-username
MAIL_PASSWORD=tua-mailgun-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@tuodominio.com"
MAIL_FROM_NAME="Spotex CMS"

MAILGUN_DOMAIN=tuodominio.com
MAILGUN_SECRET=tua-mailgun-api-key
```

## Personalizzazione Email Template

Le email di verifica possono essere personalizzate creando:

```
resources/views/vendor/notifications/email.blade.php
```

Usa il comando:
```bash
php artisan vendor:publish --tag=laravel-notifications
```

## Test Email

Testa l'invio email con:

```bash
php artisan tinker
```

Poi esegui:
```php
Mail::raw('Test email', function($message) {
    $message->to('tua-email@example.com')
            ->subject('Test Email Spotex CMS');
});
```

## Troubleshooting

### Email non arrivano
1. Controlla `storage/logs/laravel.log` per errori
2. Verifica le credenziali SMTP
3. Controlla la cartella spam
4. Verifica che il firewall permetta la porta 587

### "Connection refused"
- Verifica che MAIL_HOST e MAIL_PORT siano corretti
- Alcuni provider richiedono SSL (porta 465) invece di TLS (porta 587)

### "Authentication failed"
- Verifica username e password
- Per Gmail, usa App Password non la password normale
- Alcuni provider richiedono di abilitare "less secure apps"
