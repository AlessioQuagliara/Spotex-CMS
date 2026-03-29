<?php

namespace App\Services\PayPal;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PayPalWebhookVerifier
{
    public function __construct(
        private readonly PayPalApiClient $apiClient
    ) {}

    public function verify(Request $request, ?string $webhookId): bool
    {
        try {
            if (!$webhookId) {
                Log::warning('PayPal webhook_id not configured in services.paypal.webhook_id');

                return false;
            }

            $headers = $this->extractSignatureHeaders($request);
            if ($headers === null) {
                return false;
            }

            $result = $this->apiClient->post('/v1/notifications/verify-webhook-signature', [
                ...$headers,
                'webhook_id' => $webhookId,
                'webhook_event' => json_decode($request->getContent(), true),
            ]);

            $isValid = ($result['verification_status'] ?? null) === 'SUCCESS';
            if (!$isValid) {
                Log::warning('PayPal webhook signature verification failed', [
                    'verification_status' => $result['verification_status'] ?? 'unknown',
                ]);
            }

            return $isValid;
        } catch (\Exception $e) {
            Log::error('PayPal webhook verification error', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function extractSignatureHeaders(Request $request): ?array
    {
        $transmissionId = $request->header('paypal-transmission-id');
        $transmissionTime = $request->header('paypal-transmission-time');
        $certUrl = $request->header('paypal-cert-url');
        $authAlgo = $request->header('paypal-auth-algo');
        $transmissionSig = $request->header('paypal-transmission-sig');

        if (!$transmissionId || !$transmissionTime || !$certUrl || !$authAlgo || !$transmissionSig) {
            Log::warning('PayPal webhook: missing required headers', [
                'has_transmission_id' => (bool) $transmissionId,
                'has_transmission_time' => (bool) $transmissionTime,
                'has_cert_url' => (bool) $certUrl,
                'has_auth_algo' => (bool) $authAlgo,
                'has_transmission_sig' => (bool) $transmissionSig,
            ]);

            return null;
        }

        return [
            'transmission_id' => $transmissionId,
            'transmission_time' => $transmissionTime,
            'cert_url' => $certUrl,
            'auth_algo' => $authAlgo,
            'transmission_sig' => $transmissionSig,
        ];
    }
}
