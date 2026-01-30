# **SPOTEX CMS**

Ho sviluppato **SPOTEX CMS**, una piattaforma e-commerce completa basata su **Laravel 11** e **Filament v3**. L’ho progettata per essere scalabile, sicura e pronta per la produzione, con due gateway di pagamento integrati (Stripe e PayPal) e un pannello di amministrazione intuitivo.

## **Architettura generale**

- **Backend**: Laravel 11, PHP 8.2+
- **Admin Panel**: Filament PHP v3
- **Database**: MySQL/PostgreSQL, con migrazioni già pronte
- **Frontend**: Blade, Tailwind CSS, Vite
- **Pagamenti**: Stripe Checkout + PayPal REST API/SDK
- **Webhook**: Gestione asincrona per aggiornamenti automatici degli ordini

## **Funzionalità principali**

### 1. **Gestione prodotti e categorie**
- Prodotti con immagini multiple, prezzi, stock.
- Categorie gerarchiche (padre-figlio).
- Carrello utente persistente.

### 2. **Checkout e pagamenti**
- Pagine di checkout responsive.
- Integrazione con **Stripe** (Checkout Session) e **PayPal** (JavaScript SDK + REST API).
- Webhook per confermare automaticamente i pagamenti.
- Storico ordini con stati separati per pagamento e spedizione.

### 3. **Pannello di amministrazione (Filament)**
- Dashboard con widget (statistiche ordini, grafico vendite mensili).
- Gestione completa di prodotti, categorie e ordini.
- Una volta pagato, un ordine diventa in sola lettura (tranne per lo stato di spedizione).

### 4. **Sicurezza**
- Validazione lato server, protezione CSRF.
- Verifica delle firme dei webhook (Stripe e PayPal).
- Password hashate, autorizzazioni controllate.

## **Installazione rapida**

1. **Clona e installa**:
   ```bash
   git clone <repo>
   cd Spotex-CMS
   composer install
   npm install
   cp .env.example .env
   php artisan key:generate
   ```

2. **Database**:
   - Configura le credenziali nel `.env`.
   - Esegui:
     ```bash
     php artisan migrate --seed
     php artisan storage:link
     ```

3. **Configura i pagamenti** (Stripe e PayPal):
   - Ottieni le API key dai rispettivi dashboard.
   - Aggiungi al `.env`:
     ```env
     STRIPE_PUBLIC_KEY=pk_test_...
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     PAYPAL_CLIENT_ID=...
     PAYPAL_CLIENT_SECRET=...
     PAYPAL_MODE=sandbox
     ```

4. **Avvia**:
   ```bash
   php artisan serve
   npm run dev
   ```

**Accesso**:
- Sito: `http://localhost:8000`
- Admin: `http://localhost:8000/admin` (crea prima un utente admin via `php artisan tinker`)

## **Note importanti per l’uso**

### **Amministrazione ordini**
- Gli ordini in attesa di pagamento (`pending`) sono modificabili.
- Dopo il pagamento (`paid`), l’ordine diventa in sola lettura, **tranne** per lo stato di spedizione (che puoi aggiornare manualmente).
- Gli stati di spedizione: `not_shipped`, `shipped`, `delivered`, `returned`.

### **Webhook**
- I webhook sono essenziali per aggiornare automaticamente gli ordini dopo il pagamento.
- In sviluppo, puoi usare `stripe cli` o `ngrok` per testarli.
- In produzione, configurali nei dashboard di Stripe e PayPal.

### **Personalizzazione**
- Il frontend è in `resources/views/` con layout Tailwind.
- Il pannello admin può essere esteso con nuove risorse Filament.
- Ho già predisposto dei `Service` per i pagamenti (`StripeService`, `PayPalService`), quindi se devi aggiungere altri gateway, segui lo stesso pattern.

## **Deploy in produzione**
- Imposta `APP_ENV=production` e `APP_DEBUG=false`.
- Usa HTTPS (obbligatorio per i webhook).
- Esegui le ottimizzazioni di Laravel:
  ```bash
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```
- Configura un cron job per la coda (se usi job in coda) e monitora i log.

## **Se qualcosa non funziona**

1. **Controlla i log**: `storage/logs/laravel.log`
2. **Verifica le credenziali dei pagamenti** nel `.env`.
3. **Assicurati che i webhook siano impostati correttamente** nei dashboard di Stripe/PayPal.
4. **Prova a cancellare la cache**: `php artisan optimize:clear`

---

**In sintesi**: SPOTEX CMS è un sistema e-commerce solido, con tutti i componenti principali già implementati. Basta configurarlo, aggiungere i propri prodotti e può partire. L’ho strutturato in modo che sia facile da mantenere e estendere.

Se hai bisogno di aggiungere funzionalità (es. sconti, newsletter, gestione magazzino), il codice è organizzato per essere facilmente modificabile.

*Ultimo aggiornamento: Gennaio 2026*