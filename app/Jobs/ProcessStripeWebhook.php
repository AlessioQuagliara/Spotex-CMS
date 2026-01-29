<?php

namespace App\Jobs;

use App\Models\WebhookEvent;
use App\Services\StripeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessStripeWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $eventId;
    public string $eventType;
    public ?string $sessionId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $eventId, string $eventType, ?string $sessionId = null)
    {
        $this->eventId = $eventId;
        $this->eventType = $eventType;
        $this->sessionId = $sessionId;
    }

    /**
     * Execute the job.
     */
    public function handle(StripeService $stripeService): void
    {
        $webhookRecord = WebhookEvent::where('provider', 'stripe')
            ->where('external_event_id', $this->eventId)
            ->first();

        try {
            if ($this->eventType === 'checkout.session.completed' && $this->sessionId) {
                $order = $stripeService->handlePaymentSuccess($this->sessionId);
                $webhookRecord?->markAsCompleted($order?->id);
                return;
            }

            // Eventi non gestiti
            $webhookRecord?->markAsCompleted();
        } catch (\Exception $e) {
            Log::error('ProcessStripeWebhook failed', [
                'event_id' => $this->eventId,
                'event_type' => $this->eventType,
                'error' => $e->getMessage(),
            ]);
            $webhookRecord?->markAsFailed($e->getMessage());
            throw $e;
        }
    }
}
