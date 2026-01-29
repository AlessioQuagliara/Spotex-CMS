<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookEvent extends Model
{
    protected $table = 'webhook_events';

    protected $fillable = [
        'provider',
        'external_event_id',
        'event_type',
        'payload',
        'status',
        'order_id',
        'error_message',
        'retry_count',
        'last_retry_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'retry_count' => 'integer',
        'last_retry_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relazione con Order
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Controlla se l'evento è già stato processato
     */
    public static function alreadyProcessed(string $provider, string $externalEventId): bool
    {
        return self::query()
            ->where('provider', $provider)
            ->where('external_event_id', $externalEventId)
            ->where('status', 'completed')
            ->exists();
    }

    /**
     * Ottiene o crea l'evento webhook
     */
    public static function getOrCreate(string $provider, string $externalEventId, array $data): self
    {
        return self::firstOrCreate(
            [
                'provider' => $provider,
                'external_event_id' => $externalEventId,
            ],
            [
                'event_type' => $data['event_type'],
                'payload' => $data['payload'],
                'status' => 'pending',
            ]
        );
    }

    /**
     * Marca come processato (completed)
     */
    public function markAsCompleted(?int $orderId = null): void
    {
        $this->update([
            'status' => 'completed',
            'order_id' => $orderId,
            'error_message' => null,
        ]);
    }

    /**
     * Marca come fallito e incrementa retry
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
            'retry_count' => $this->retry_count + 1,
            'last_retry_at' => now(),
        ]);
    }

    /**
     * Reimposta lo stato per retry
     */
    public function resetForRetry(): void
    {
        $this->update([
            'status' => 'pending',
            'error_message' => null,
        ]);
    }

    /**
     * Controlla se può essere ritentato
     */
    public function canRetry(): bool
    {
        // Max 3 tentativi
        return $this->retry_count < 3;
    }
}
