<?php

namespace Database\Seeders;

use App\Models\ShippingRule;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ShippingRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ShippingRule::create([
            'name' => 'Spedizione Standard',
            'type' => 'standard',
            'base_cost' => 6.90,
            'free_shipping_threshold' => null,
            'description' => 'Consegna in 3-5 giorni lavorativi',
            'is_active' => true,
        ]);

        ShippingRule::create([
            'name' => 'Spedizione Express',
            'type' => 'express',
            'base_cost' => 12.90,
            'free_shipping_threshold' => null,
            'description' => 'Consegna in 1-2 giorni lavorativi',
            'is_active' => true,
        ]);

        ShippingRule::create([
            'name' => 'Ritiro in Sede',
            'type' => 'pickup',
            'base_cost' => 0,
            'free_shipping_threshold' => null,
            'description' => 'Ritiro presso la nostra sede',
            'is_active' => true,
        ]);
    }
}

