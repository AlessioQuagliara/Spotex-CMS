# 🚀 SPOTEX CMS - DEPLOYMENT GUIDE

## 📋 PRE-DEPLOYMENT CHECKLIST

### Code Quality
- [ ] Nessun `dd()`, `var_dump()`, `console.log()` nel codice
- [ ] Tutte le migrazioni create e testate
- [ ] Database seeders funzionanti
- [ ] Nessun hardcoded credential
- [ ] `.env.example` aggiornato
- [ ] Git history pulito

### Security
- [ ] `APP_DEBUG=false` in production
- [ ] `APP_ENV=production`
- [ ] Credenziali Stripe/PayPal valide
- [ ] Webhook secret configurato (Stripe)
- [ ] Webhook ID configurato (PayPal)
- [ ] Verifica firma webhook attiva (Stripe/PayPal)
- [ ] Idempotenza webhook attiva (DB unique su event_id)
- [ ] HTTPS certificato valido
- [ ] Password database molto sicura
- [ ] Rate limiting abilitato
- [ ] CORS configurato correttamente

### Webhook Hardening (Consigliato)
- [ ] Verifica firma webhook attiva (Stripe-Signature / PayPal verify-webhook-signature)
- [ ] Idempotenza attiva (tabella webhook_events con unique su provider+event_id)
- [ ] Rate limiting dedicato per /api/webhooks
- [ ] Logging dedicato dei webhook (request + response)
- [ ] Processing in coda (queue "webhooks")

### Performance
- [ ] `php artisan optimize` eseguito
- [ ] `php artisan route:cache` eseguito
- [ ] `php artisan config:cache` eseguito
- [ ] Database indici creati
- [ ] Cache driver configurato (Redis preferred)
- [ ] Queue driver configurato (se necessario)
- [ ] CDN configurato per assets statici

### Testing
- [ ] Test suite all'100% passing
- [ ] Pagamento Stripe testato end-to-end
- [ ] Pagamento PayPal testato end-to-end
- [ ] Webhook Stripe testato
- [ ] Webhook PayPal testato
- [ ] Email notifications testate
- [ ] Error pages testate

---

## 🏃 DEPLOYMENT STEPS

### 1. Preparazione Server

```bash
# SSH nella macchina
ssh user@your-server.com

# Update sistema
sudo apt update && sudo apt upgrade -y

# Installa dipendenze PHP
sudo apt install -y php8.2-cli php8.2-fpm php8.2-mysql \
  php8.2-curl php8.2-json php8.2-zip php8.2-gd

# Installa MySQL
sudo apt install -y mysql-server

# Installa Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs

# Installa Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Installa Git
sudo apt install -y git
```

### 2. Clone e Setup Progetto

```bash
# Crea directory
sudo mkdir -p /var/www/spotex-cms
cd /var/www/spotex-cms

# Clone repository
sudo git clone https://github.com/your-repo/spotex-cms.git .

# Imposta permessi
sudo chown -R www-data:www-data /var/www/spotex-cms
sudo chmod -R 755 /var/www/spotex-cms
sudo chmod -R 775 /var/www/spotex-cms/storage
sudo chmod -R 775 /var/www/spotex-cms/bootstrap/cache

# Installa dipendenze
composer install --optimize-autoloader --no-dev
npm install
npm run build
```

### 3. Configurazione Environment

```bash
# Copia env file
sudo cp .env.example .env

# Modifica .env
sudo nano .env
```

**Configurazione essenziale:**
```env
APP_NAME="SPOTEX CMS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=spotex_cms
DB_USERNAME=spotex_user
DB_PASSWORD=SECURE_PASSWORD_HERE

STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=live

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
```

```bash
# Genera app key
php artisan key:generate
```

### 4. Database Setup

```bash
# Crea database
mysql -u root -p
> CREATE DATABASE spotex_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> CREATE USER 'spotex_user'@'localhost' IDENTIFIED BY 'SECURE_PASSWORD';
> GRANT ALL PRIVILEGES ON spotex_cms.* TO 'spotex_user'@'localhost';
> FLUSH PRIVILEGES;
> EXIT;

# Esegui migrazioni
php artisan migrate --force

# (Opzionale) Esegui seeders
php artisan db:seed
```

### 5. Web Server Configuration

#### Nginx (Recommended)

```bash
# Crea file di configurazione
sudo nano /etc/nginx/sites-available/spotex-cms
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/spotex-cms/public;
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }

    # Permetti accesso ai file statici
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Abilita sito
sudo ln -s /etc/nginx/sites-available/spotex-cms /etc/nginx/sites-enabled/

# Test configurazione
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Apache (Alternative)

```bash
# Abilita mod_rewrite
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod http2

# Crea VirtualHost
sudo nano /etc/apache2/sites-available/spotex-cms.conf
```

**Apache Config:**
```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/spotex-cms/public

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem

    <Directory /var/www/spotex-cms/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        <IfModule mod_rewrite.c>
            RewriteEngine On
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule ^ index.php [L]
        </IfModule>
    </Directory>

    <FilesMatch \.php$>
        SetHandler "proxy:unix:/var/run/php/php8.2-fpm.sock|fcgi://localhost"
    </FilesMatch>

    ErrorLog ${APACHE_LOG_DIR}/spotex-error.log
    CustomLog ${APACHE_LOG_DIR}/spotex-access.log combined
</VirtualHost>

<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>
```

```bash
# Abilita sito
sudo a2ensite spotex-cms
sudo a2dissite 000-default

# Testa configurazione
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Installa Certbot
sudo apt install -y certbot python3-certbot-nginx

# Genera certificato
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### 7. Storage Link

```bash
php artisan storage:link

# Verifica
ls -la storage/app/public
```

### 8. Caching & Optimization

```bash
# Cache ottimizzazione
php artisan optimize
php artisan route:cache
php artisan config:cache
php artisan view:cache

# Pulisci cache cache (se cambiano routes/config)
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

### 9. Supervisor (Queue Processing)

Se usi queue async:

```bash
# Installa Supervisor
sudo apt install -y supervisor

# Crea config
sudo nano /etc/supervisor/conf.d/spotex-cms.conf
```

**Supervisor Config:**
```ini
[program:spotex-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/spotex-cms/artisan queue:work --queue=default,webhooks
autostart=true
autorestart=true
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/spotex-cms/storage/logs/queue.log
```

```bash
# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start spotex-queue:*
```

### 10. Monitoring & Logging

```bash
# Verifica logs
tail -f /var/www/spotex-cms/storage/logs/laravel.log

# Installa logrotate
sudo nano /etc/logrotate.d/spotex-cms
```

**Logrotate Config:**
```
/var/www/spotex-cms/storage/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## 🔍 POST-DEPLOYMENT VERIFICATION

```bash
# Controlla app health
curl https://yourdomain.com/

# Verifica database
php artisan tinker
>>> Product::count()
>>> Order::count()

# Testa pagamento (modalità test)
# Visita /checkout e testa Stripe/PayPal

# Controlla logs
tail -f storage/logs/laravel.log

# Verifica storage
ls -la storage/app/public/products/

# Test database backup
php artisan backup:run
```

---

## 🔐 HARDENING

```bash
# Disabilita directory listing
echo "Options -Indexes" | sudo tee /var/www/spotex-cms/public/.htaccess

# Imposta file permissions
sudo find /var/www/spotex-cms -type f -exec chmod 644 {} \;
sudo find /var/www/spotex-cms -type d -exec chmod 755 {} \;
sudo chmod -R 775 /var/www/spotex-cms/storage
sudo chmod -R 775 /var/www/spotex-cms/bootstrap/cache

# Nascondi versione PHP
sudo nano /etc/php/8.2/fpm/php.ini
# expose_php = Off

# Configura firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🆘 TROUBLESHOOTING

### "500 Internal Server Error"
```bash
# Controlla logs
tail -f /var/www/spotex-cms/storage/logs/laravel.log

# Verifica permessi
sudo chown -R www-data:www-data /var/www/spotex-cms/storage

# Ricrea cache
php artisan cache:clear
php artisan config:clear
```

### "Connection Refused" Database
```bash
# Verifica MySQL
sudo systemctl status mysql

# Test connection
mysql -u spotex_user -p spotex_cms

# Controlla .env DB_HOST
# Potrebbe essere localhost, 127.0.0.1, o hostname server
```

### Webhook non funziona
```bash
# Controlla webhook secret in .env
# Controlla logs per errori
grep "webhook" storage/logs/laravel.log

# Testa endpoint
curl -X POST https://yourdomain.com/api/webhooks/stripe -v
```

### Immagini non si caricano
```bash
# Verifica storage link
ls -la /var/www/spotex-cms/storage/app/public/

# Ricrea link
php artisan storage:link

# Verifica permessi directory
sudo chmod -R 755 /var/www/spotex-cms/storage/app/public
```

---

## 📊 MONITORING SETUP (Opzionale)

### Sentry (Error Tracking)
```bash
composer require sentry/sentry-laravel

php artisan sentry:publish
```

Edit `.env`:
```env
SENTRY_LARAVEL_DSN=https://your-sentry-dsn@sentry.io/...
```

### New Relic (APM)
```bash
# Installa agent
sudo apt install -y newrelic-php5

# Configure
sudo nrconfig --set appname="SPOTEX CMS" --set license_key="YOUR_LICENSE"
```

---

## 🔄 CONTINUOUS DEPLOYMENT (Optional)

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/spotex-cms
            git pull origin main
            composer install --optimize-autoloader --no-dev
            npm install && npm run build
            php artisan migrate --force
            php artisan cache:clear
```

---

**Deployment Version:** 1.0.0
**Last Updated:** Gennaio 2026
**Status:** Production Ready ✅
