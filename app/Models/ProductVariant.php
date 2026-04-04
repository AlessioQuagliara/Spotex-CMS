<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;
    use BelongsToStore;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_DRAFT = 'draft';

    protected $fillable = [
        'store_id',
        'product_id',
        'sku',
        'barcode',
        'price',
        'compare_at_price',
        'status',
        'weight',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'weight' => 'decimal:3',
    ];

    public static function statusOptions(): array
    {
        return [
            self::STATUS_ACTIVE => 'Attiva',
            self::STATUS_INACTIVE => 'Inattiva',
            self::STATUS_DRAFT => 'Bozza',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function optionValues(): BelongsToMany
    {
        return $this->belongsToMany(ProductOptionValue::class, 'variant_option_value', 'variant_id', 'option_value_id')
            ->withTimestamps();
    }

    public function inventoryLevels(): HasMany
    {
        return $this->hasMany(InventoryLevel::class, 'variant_id');
    }

    public function inventoryLedgerEntries(): HasMany
    {
        return $this->hasMany(InventoryLedger::class, 'variant_id');
    }

    public function inventoryReservations(): HasMany
    {
        return $this->hasMany(InventoryReservation::class, 'variant_id');
    }

    public function priceListPrices(): HasMany
    {
        return $this->hasMany(PriceListPrice::class, 'variant_id');
    }
}
