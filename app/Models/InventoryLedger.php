<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class InventoryLedger extends Model
{
    use HasFactory;
    use BelongsToStore;

    public const EVENT_SALE = 'sale';
    public const EVENT_RESERVE = 'reserve';
    public const EVENT_RELEASE = 'release';
    public const EVENT_RESTOCK = 'restock';
    public const EVENT_ADJUST = 'adjust';

    protected $table = 'inventory_ledger';

    protected $fillable = [
        'store_id',
        'variant_id',
        'location_id',
        'event_type',
        'qty_delta',
        'reference_type',
        'reference_id',
        'idempotency_key',
    ];

    protected $casts = [
        'qty_delta' => 'integer',
    ];

    protected static function booted(): void
    {
        static::updating(function (): void {
            throw new RuntimeException('Inventory ledger is append-only and cannot be updated.');
        });

        static::deleting(function (): void {
            throw new RuntimeException('Inventory ledger is append-only and cannot be deleted.');
        });
    }

    public static function eventTypes(): array
    {
        return [
            self::EVENT_SALE,
            self::EVENT_RESERVE,
            self::EVENT_RELEASE,
            self::EVENT_RESTOCK,
            self::EVENT_ADJUST,
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'location_id');
    }
}
