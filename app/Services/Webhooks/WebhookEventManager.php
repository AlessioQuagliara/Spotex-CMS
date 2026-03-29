<?php

namespace App\Services\Webhooks;

use App\Models\WebhookEvent;
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
        if (WebhookEvent::alreadyProcessed($provider, $eventId)) {
            Log::info("{$provider} webhook: duplicate event (already processed)", [
                'event_id' => $eventId,
                'event_type' => $eventType,
            ]);

            return null;
        }

        $webhookRecord = WebhookEvent::getOrCreate($provider, $eventId, [
            'event_type' => $eventType,
            'payload' => $payload,
        ]);

        if (in_array($webhookRecord->status, ['processing', 'completed'], true)) {
            return null;
        }

        $webhookRecord->update(['status' => 'processing']);

        return $webhookRecord;
    }
}
