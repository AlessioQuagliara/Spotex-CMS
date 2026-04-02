<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\WebhookEvent;
use App\Services\PayPalService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessPayPalWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $eventId;
    public string $eventType;
    public array $payload;

    public function __construct(string $eventId, string $eventType, array $payload)
    {
        $this->eventId = $eventId;
        $this->eventType = $eventType;
        $this->payload = $payload;
    }

    public function handle(PayPalService $paypalService): void
    {
        $webhookRecord = WebhookEvent::where('provider', 'paypal')
            ->where('external_event_id', $this->eventId)
            ->first();

        try {
            if ($this->eventType === 'PAYMENT.CAPTURE.COMPLETED') {
                $result = $paypalService->handlePaymentCapture($this->payload);

                if ($result['success']) {
                    $orderId = $result['order_id'] ?? null;
                    if ($orderId) {
                        DB::transaction(function () use ($orderId, $result) {
                            $order = Order::query()->lockForUpdate()->find($orderId);

                            if (!$order || $order->provider_event_id === $this->eventId) {
                                return;
                            }

                            if ($order->payment_status === 'pending') {
                                $order->markAsPaid($result['paypal_transaction_id'], 'paypal', $this->eventId);
                                return;
                            }

                            if ($order->provider_event_id === null) {
                                $order->update(['provider_event_id' => $this->eventId]);
                            }
                        });
                    }

                    $webhookRecord?->markAsCompleted($orderId ?? null);
                    return;
                }

                $webhookRecord?->markAsFailed($result['message'] ?? 'Unknown error');
                return;
            }

            // Eventi non gestiti
            $webhookRecord?->markAsCompleted();
        } catch (\Exception $e) {
            Log::error('ProcessPayPalWebhook failed', [
                'event_id' => $this->eventId,
                'event_type' => $this->eventType,
                'error' => $e->getMessage(),
            ]);
            $webhookRecord?->markAsFailed($e->getMessage());
            throw $e;
        }
    }
}
