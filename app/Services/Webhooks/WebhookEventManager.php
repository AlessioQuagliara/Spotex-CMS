<?php

namespace App\Services\Webhooks;

use App\Models\WebhookEvent;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookEventManager
{
    /**
     * Crea e porta in processing il record webhook se necessario.
     * Ritorna null quando l'evento è già processato o già in lavorazione.
     */
    public function startProcessing(
        string $provider,
        string $eventId,
        string $eventType,
        array $payload
    ): ?WebhookEvent {
        return DB::transaction(function () use ($provider, $eventId, $eventType, $payload) {
            $webhookRecord = WebhookEvent::query()
                ->where('provider', $provider)
                ->where('external_event_id', $eventId)
                ->lockForUpdate()
                ->first();

            if ($webhookRecord === null) {
                try {
                    $webhookRecord = WebhookEvent::create([
                        'provider' => $provider,
                        'external_event_id' => $eventId,
                        'event_type' => $eventType,
                        'payload' => $payload,
                        'status' => 'pending',
                    ]);
                } catch (QueryException $exception) {
                    $webhookRecord = WebhookEvent::query()
                        ->where('provider', $provider)
                        ->where('external_event_id', $eventId)
                        ->lockForUpdate()
                        ->first();

                    if ($webhookRecord === null) {
                        throw $exception;
                    }
                }
            }

            if ($webhookRecord->status === 'completed') {
                Log::info("{$provider} webhook: duplicate event (already processed)", [
                    'event_id' => $eventId,
                    'event_type' => $eventType,
                ]);

                return null;
            }

            if ($webhookRecord->status === 'processing') {
                return null;
            }

            $webhookRecord->update(['status' => 'processing']);

            return $webhookRecord->fresh();
        });
    }
}
