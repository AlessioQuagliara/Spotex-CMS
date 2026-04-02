<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'payment_status',
        'shipping_status',
        'transaction_id',
        'subtotal',
        'shipping_cost',
        'discount_amount',
        'discount_code',
        'shipping_method',
        'total',
        'payment_method',
        'shipping_address',
        'billing_address',
        'billing_same_as_shipping',
        'billing_name',
        'billing_company',
        'billing_tax_id',
        'notes',
        'paid_at',
        'shipped_at',
        'delivered_at',
        'tracking_number',
        // Platform payments - ADDED
        'payment_provider',
        'platform_mode',
        'commission_amount',
        'provider_payment_id',
        'provider_event_id',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'payment_status' => 'string',
        'shipping_status' => 'string',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function canBeEdited(): bool
    {
        return $this->payment_status === 'pending';
    }

    /**
     * Controlla se l'ordine è stato spedito
     */
    public function isShipped(): bool
    {
        return in_array($this->shipping_status, ['shipped', 'delivered']);
    }

    /**
     * Controlla se l'ordine è stato consegnato
     */
    public function isDelivered(): bool
    {
        return $this->shipping_status === 'delivered';
    }

    /**
     * Segna l'ordine come pagato
     */
    public function markAsPaid(string $transactionId, string $paymentMethod = 'stripe', ?string $providerEventId = null): void
    {
        $payload = [
            'payment_status' => 'paid',
            'transaction_id' => $transactionId,
            'paid_at' => now(),
            'payment_method' => $paymentMethod,
            'status' => 'paid',
        ];

        if ($providerEventId !== null) {
            $payload['provider_event_id'] = $providerEventId;
        }

        $this->update($payload);

        // Decrementa lo stock per ogni prodotto dell'ordine, con lock row-level.
        foreach ($this->items as $item) {
            if (!$item->product_id) {
                continue;
            }

            DB::transaction(function () use ($item) {
                $product = Product::query()->lockForUpdate()->find($item->product_id);

                if ($product && (int) $product->stock > 0) {
                    $product->decrement('stock', min((int) $item->quantity, (int) $product->stock));
                }
            });
        }
    }

    /**
     * Segna l'ordine come spedito
     */
    public function markAsShipped(string $trackingNumber = null): void
    {
        $this->update([
            'shipping_status' => 'shipped',
            'shipped_at' => now(),
            'tracking_number' => $trackingNumber,
        ]);
    }

    /**
     * Segna l'ordine come consegnato
     */
    public function markAsDelivered(): void
    {
        $this->update([
            'shipping_status' => 'delivered',
            'delivered_at' => now(),
        ]);
    }

    /**
     * Segna l'ordine come refunded
     */
    public function markAsRefunded(): void
    {
        $this->update([
            'payment_status' => 'refunded',
        ]);
    }
}
