<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'max_discount',
        'min_cart_amount',
        'max_uses',
        'times_used',
        'max_uses_per_customer',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'min_cart_amount' => 'decimal:2',
        'valid_from' => 'date',
        'valid_until' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Mutator: Convert code to uppercase
     */
    protected function code(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => strtoupper(trim($value)),
        );
    }

    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        if ($this->max_uses && $this->times_used >= $this->max_uses) return false;
        if ($this->valid_from && now()->isBefore($this->valid_from)) return false;
        if ($this->valid_until && now()->isAfter($this->valid_until)) return false;
        return true;
    }

    public function calculateDiscount(float $subtotal): float
    {
        if (!$this->isValid()) return 0;
        if ($this->min_cart_amount && $subtotal < $this->min_cart_amount) return 0;

        if ($this->type === 'percentage') {
            $discount = $subtotal * ($this->value / 100);
            if ($this->max_discount) {
                $discount = min($discount, $this->max_discount);
            }
            return $discount;
        }

        return (float) $this->value;
    }
}

