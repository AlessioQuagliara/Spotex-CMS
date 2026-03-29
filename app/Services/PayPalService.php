<?php

namespace App\Services;

use App\Models\Order;
use App\Services\PayPal\PayPalAddressFormatter;
use App\Services\PayPal\PayPalApiClient;
use App\Services\PayPal\PayPalCaptureEventParser;
use App\Services\PayPal\PayPalOrderPayloadBuilder;
use App\Services\PayPal\PayPalWebhookVerifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PayPalService
{
    private string $webhookId;

    public function __construct(
        private readonly PlatformPaymentsAdapter $platformAdapter,
        private readonly PayPalApiClient $apiClient,
        private readonly PayPalOrderPayloadBuilder $orderPayloadBuilder,
        private readonly PayPalWebhookVerifier $webhookVerifier,
        private readonly PayPalCaptureEventParser $captureEventParser,
        private readonly PayPalAddressFormatter $addressFormatter
    ) {
        $this->webhookId = config('services.paypal.webhook_id');
    }

    public function getAccessToken(): string
    {
        return $this->apiClient->getAccessToken();
    }

    public function createOrder(Order $order): array
    {
        try {
            $platformParams = $this->platformAdapter->getPayPalMultipartyParams($order);
            $this->applyPlatformMetadata($order, $platformParams);

            $payload = $this->orderPayloadBuilder->build($order, $platformParams);
            $result = $this->apiClient->post('/v2/checkout/orders', $payload);

            $order->update(['provider_payment_id' => $result['id'] ?? null]);

            return $result;
        } catch (\Exception $e) {
            Log::error('PayPal createOrder failed', [
                'error' => $e->getMessage(),
                'order_id' => $order->id,
            ]);
            throw $e;
        }
    }

    public function captureOrder(string $orderId): array
    {
        try {
            return $this->apiClient->post("/v2/checkout/orders/{$orderId}/capture");
        } catch (\Exception $e) {
            Log::error('PayPal captureOrder failed', [
                'error' => $e->getMessage(),
                'order_id' => $orderId,
            ]);
            throw $e;
        }
    }

    public function verifyWebhookSignature(Request $request): bool
    {
        return $this->webhookVerifier->verify($request, $this->webhookId);
    }

    public function handlePaymentCapture(array $webhookData): array
    {
        return $this->captureEventParser->parse($webhookData);
    }

    public function parseAddressFromWebhook(array $webhookData): array
    {
        return $this->addressFormatter->parseFromWebhook($webhookData);
    }

    private function applyPlatformMetadata(Order $order, array $platformParams): void
    {
        if (empty($platformParams)) {
            return;
        }

        $order->update([
            'payment_provider' => 'paypal',
            'platform_mode' => $this->platformAdapter->getPlatformMode(),
            'commission_amount' => $this->platformAdapter->getCommissionAmount($order),
        ]);

        Log::info('PayPal Multiparty mode active', [
            'order_id' => $order->id,
            'commission_cents' => $order->commission_amount,
        ]);
    }
}
