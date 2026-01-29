<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingRule extends Model
{
    protected $fillable = [
        'name',
        'type',
        'base_cost',
        'free_shipping_threshold',
        'description',
        'estimated_days',
        'is_active',
    ];

    protected $casts = [
        'base_cost' => 'decimal:2',
        'free_shipping_threshold' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function calculateCost(float $subtotal): float
    {
        if (!$this->is_active) return 0;
        
        if ($this->free_shipping_threshold && $subtotal >= $this->free_shipping_threshold) {
            return 0;
        }

        return (float) $this->base_cost;
    }
}

