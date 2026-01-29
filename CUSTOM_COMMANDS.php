<?php

/**
 * SPOTEX CMS - CUSTOM ARTISAN COMMANDS
 * 
 * Coloca questi file in app/Console/Commands/
 * Esegui con: php artisan make:command CommandName
 */

// ============================================================================
// COMANDO 1: ResetDemoData.php
// ============================================================================
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;

class ResetDemoData extends Command
{
    protected $signature = 'demo:reset';
    protected $description = 'Reset database with demo data';

    public function handle()
    {
        if (!$this->confirm('Sei sicuro? Questo cancellerà tutti i dati!')) {
            return;
        }

        // Delete existing data
        Order::truncate();
        Product::truncate();
        Category::truncate();

        $this->info('Database resetato');

        // Re-seed
        $this->call('db:seed', ['--class' => 'CategorySeeder']);
        $this->call('db:seed', ['--class' => 'ProductSeeder']);

        $this->info('Demo data creato');
    }
}

// ============================================================================
// COMANDO 2: GeneratePaymentReport.php
// ============================================================================
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use Carbon\Carbon;

class GeneratePaymentReport extends Command
{
    protected $signature = 'report:payments {--month=} {--year=}';
    protected $description = 'Generate payment report for month';

    public function handle()
    {
        $month = $this->option('month') ?? now()->month;
        $year = $this->option('year') ?? now()->year;

        $orders = Order::where('status', 'paid')
            ->whereYear('paid_at', $year)
            ->whereMonth('paid_at', $month)
            ->get();

        $total = $orders->sum('total');
        $count = $orders->count();
        $average = $count > 0 ? $total / $count : 0;

        $this->table(
            ['Metrica', 'Valore'],
            [
                ['Ordini Pagati', $count],
                ['Totale Ricavi', '€' . number_format($total, 2)],
                ['Media Ordine', '€' . number_format($average, 2)],
                ['Periodo', "{$month}/{$year}"],
            ]
        );
    }
}

// ============================================================================
// COMANDO 3: CleanupOrderData.php
// ============================================================================
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;

class CleanupOrderData extends Command
{
    protected $signature = 'cleanup:orders {--days=90}';
    protected $description = 'Cleanup old pending orders';

    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoffDate = now()->subDays($days);

        $count = Order::where('status', 'pending')
            ->where('created_at', '<', $cutoffDate)
            ->delete();

        $this->info("{$count} ordini pendenti eliminati");
    }
}

// ============================================================================
// COMANDO 4: SyncProductPrices.php
// ============================================================================
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;

class SyncProductPrices extends Command
{
    protected $signature = 'sync:prices';
    protected $description = 'Sync product prices from external source';

    public function handle()
    {
        // Esempio: sincronizza prezzi da API esterna
        
        $this->info('Sincronizzazione prezzi...');
        
        // Implementa logica di sincronizzazione
        
        $this->info('Prezzi sincronizzati');
    }
}

// ============================================================================
// COMANDO 5: TestWebhooks.php
// ============================================================================
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestWebhooks extends Command
{
    protected $signature = 'test:webhooks';
    protected $description = 'Test webhook endpoints';

    public function handle()
    {
        $this->info('Testing Stripe webhook...');
        
        $stripeResponse = Http::post(url('/webhook/stripe'), [
            'type' => 'checkout.session.completed',
            'data' => ['object' => ['id' => 'test']],
        ]);
        
        $this->line('Stripe: ' . $stripeResponse->status());

        $this->info('Testing PayPal webhook...');
        
        $paypalResponse = Http::post(url('/webhook/paypal'), [
            'event_type' => 'CHECKOUT.ORDER.COMPLETED',
        ]);
        
        $this->line('PayPal: ' . $paypalResponse->status());
    }
}

// ============================================================================
// COMANDO 6: CreateAdmin.php
// ============================================================================
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CreateAdmin extends Command
{
    protected $signature = 'user:admin {--email=} {--password=}';
    protected $description = 'Create an admin user';

    public function handle()
    {
        $email = $this->option('email') ?? $this->ask('Email?');
        $password = $this->option('password') ?? $this->secret('Password?');
        $name = $this->ask('Name?', 'Admin');

        if (User::where('email', $email)->exists()) {
            $this->error('User already exists');
            return;
        }

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => bcrypt($password),
            'is_admin' => true, // Aggiungi colonna nel database
        ]);

        $this->info("Admin {$email} creato!");
    }
}

// ============================================================================
// COMANDO 7: OptimizeDatabase.php
// ============================================================================
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class OptimizeDatabase extends Command
{
    protected $signature = 'optimize:database';
    protected $description = 'Optimize database tables';

    public function handle()
    {
        $tables = [
            'products',
            'orders',
            'order_items',
            'categories',
            'product_images',
        ];

        foreach ($tables as $table) {
            DB::statement("OPTIMIZE TABLE {$table}");
            $this->info("Optimized: {$table}");
        }

        $this->info('Database optimization complete');
    }
}

// ============================================================================
// JOBS/SCHEDULED TASKS
// ============================================================================

// In app/Console/Kernel.php, aggiungi:
/*
protected function schedule(Schedule $schedule)
{
    // Cleanup ordini pending ogni giorno
    $schedule->command('cleanup:orders --days=90')
        ->daily()
        ->at('02:00');

    // Genera report mensile
    $schedule->command('report:payments')
        ->monthlyOn(1, '08:00');

    // Optimize database ogni settimana
    $schedule->command('optimize:database')
        ->weekly()
        ->sundays()
        ->at('03:00');

    // Prova webhooks ogni 6 ore
}
*/
    $schedule->command('test:webhooks')
        ->everyHours(6);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Esegui comandi:
 * 
 * php artisan demo:reset
 * php artisan report:payments --month=1 --year=2026
 * php artisan cleanup:orders --days=90
 * php artisan sync:prices
 * php artisan test:webhooks
 * php artisan user:admin --email=admin@spotex.com --password=secure123
 * php artisan optimize:database
 */
?>
