<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceListPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'price_list_id',
        'variant_id',
        'amount',
        'compare_at_amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'compare_at_amount' => 'decimal:2',
    ];

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
