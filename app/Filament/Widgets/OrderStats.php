<?php

namespace App\Filament\Widgets;

use App\Models\Order;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class OrderStats extends BaseWidget
{
    protected function getStats(): array
    {
        $totalOrders = Order::count();
        $totalRevenue = Order::where('payment_status', 'paid')->sum('total');
        $pendingOrders = Order::where('payment_status', 'pending')->count();
        $completedOrders = Order::where('shipping_status', 'delivered')->count();

        return [
            Stat::make('Ordini Totali', $totalOrders)
                ->description('Ordini nel sistema')
                ->color('info'),
            Stat::make('Ricavi Totali', '€ ' . number_format($totalRevenue, 2, ',', '.'))
                ->description('Pagamenti completati')
                ->color('success'),
            Stat::make('Ordini in Sospeso', $pendingOrders)
                ->description('Richiedono attenzione')
                ->color('warning'),
            Stat::make('Ordini Completati', $completedOrders)
                ->description('Consegnati con successo')
                ->color('gray'),
        ];
    }
}
