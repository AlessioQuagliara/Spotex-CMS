<?php

namespace App\Filament\Widgets;

use App\Models\Order;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Facades\DB;

class MonthlySalesChart extends ChartWidget
{
    protected static ?string $heading = 'Vendite Mensili';
    protected static ?int $sort = 1;

    protected function getData(): array
    {
        $currentYear = now()->year;
        
        $data = Order::where('payment_status', 'paid')
            ->whereYear('paid_at', $currentYear)
            ->groupBy(DB::raw('MONTH(paid_at)'))
            ->selectRaw('MONTH(paid_at) as month, SUM(total) as total')
            ->orderBy(DB::raw('MONTH(paid_at)'))
            ->get();

        $labels = [
            'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
            'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
        ];

        $monthlyTotals = array_fill(0, 12, 0);
        
        foreach ($data as $item) {
            $monthlyTotals[$item->month - 1] = floatval($item->total);
        }

        return [
            'datasets' => [
                [
                    'label' => 'Totale Vendite (€)',
                    'data' => $monthlyTotals,
                    'borderColor' => '#010f20',
                    'backgroundColor' => 'rgba(1, 15, 32, 0.1)',
                    'tension' => 0.4,
                    'fill' => true,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
