<?php

namespace App\Services\PayPal;

use Illuminate\Support\Facades\Log;

class PayPalCaptureEventParser
{
    public function parse(array $webhookData): array
    {
        try {
            $eventType = $webhookData['event_type'] ?? null;
            $resource = $webhookData['resource'] ?? [];
            $eventId = $webhookData['id'] ?? null;

            Log::info('PayPal webhook received', [
                'event_type' => $eventType,
                'event_id' => $eventId,
            ]);

            if ($eventType !== 'PAYMENT.CAPTURE.COMPLETED') {
                return [
                    'success' => false,
                    'message' => "Event type '{$eventType}' not handled by this handler",
                    'event_id' => $eventId,
                ];
            }

            $paypalTransactionId = $resource['id'] ?? null;
            $status = $resource['status'] ?? null;
            $amount = $resource['amount']['value'] ?? null;
            $orderId = $resource['supplementary_data']['related_ids']['order_reference_id'] ?? null;

            if (!$paypalTransactionId) {
                Log::warning('PayPal webhook: missing transaction ID', [
                    'event_id' => $eventId,
                    'resource' => $resource,
                ]);

                return [
                    'success' => false,
                    'message' => 'Missing transaction ID in webhook',
                    'event_id' => $eventId,
                ];
            }

            Log::info('PayPal payment captured via webhook', [
                'paypal_transaction_id' => $paypalTransactionId,
                'amount' => $amount,
                'order_id' => $orderId,
                'event_id' => $eventId,
            ]);

            return [
                'success' => true,
                'paypal_transaction_id' => $paypalTransactionId,
                'status' => $status,
                'amount' => $amount,
                'order_id' => $orderId,
                'event_id' => $eventId,
            ];
        } catch (\Exception $e) {
            Log::error('PayPal webhook processing failed', [
                'error' => $e->getMessage(),
                'event_id' => $webhookData['id'] ?? 'unknown',
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'event_id' => $webhookData['id'] ?? 'unknown',
            ];
        }
    }
}
