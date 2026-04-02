<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\Checkout\Session;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StripeService
{
    private PlatformPaymentsAdapter $platformAdapter;

    public function __construct(PlatformPaymentsAdapter $platformAdapter)
    {
        $this->platformAdapter = $platformAdapter;
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Crea una sessione Stripe Checkout
     * 
     * PATCH: Aggiunge parametri Stripe Connect se platform_mode attivo
     */
    public function createCheckoutSession(Order $order): string
    {
        $lineItems = [];

        foreach ($order->items as $item) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => 'eur',
                    'product_data' => [
                        'name' => $item->product->name,
                        'images' => $item->product->primaryImage 
                            ? [asset('storage/' . $item->product->primaryImage->image_path)]
                            : [],
                    ],
                    'unit_amount' => intval($item->unit_price * 100),
                ],
                'quantity' => $item->quantity,
            ];
        }

        // Base parameters (UNCHANGED)
        $sessionParams = [
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'mode' => 'payment',
            'success_url' => route('checkout.success', ['order' => $order->id]),
            'cancel_url' => route('checkout.cancel', ['order' => $order->id]),
            'client_reference_id' => (string) $order->id,
            'metadata' => [
                'order_id' => $order->id,
            ],
        ];

        // PLATFORM PATCH: Merge Stripe Connect params if active
        $platformParams = $this->platformAdapter->getStripeConnectParams($order);
        if (!empty($platformParams)) {
            $sessionParams = array_merge($sessionParams, $platformParams);
            
            // Update order with platform metadata
            $order->update([
                'payment_provider' => 'stripe',
                'platform_mode' => $this->platformAdapter->getPlatformMode(),
                'commission_amount' => $this->platformAdapter->getCommissionAmount($order),
            ]);
        }

        $session = Session::create($sessionParams);

        // Save session ID to order
        $order->update(['provider_payment_id' => $session->id]);

        return $session->id;
    }

    /**
     * Verifica il pagamento da webhook
     */
    public function verifyPayment(array $data): bool
    {
        // Validazione webhook signature
        $signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $secret = config('services.stripe.webhook_secret');

        try {
            \Stripe\Webhook::constructEvent(
                file_get_contents('php://input'),
                $signature,
                $secret
            );
            return true;
        } catch (\Exception $e) {
            Log::error('Stripe Webhook Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Aggiorna lo stato dell'ordine dopo pagamento confermato
     * 
     * PATCH: Salva provider_event_id per idempotenza
     */
    public function handlePaymentSuccess(string $sessionId, ?string $eventId = null): ?Order
    {
        $session = Session::retrieve($sessionId);

        if ($session->payment_status === 'paid') {
            return DB::transaction(function () use ($session, $eventId) {
                $orderId = (int) ($session->metadata->order_id ?? 0);

                if ($orderId <= 0) {
                    return null;
                }

                $order = Order::query()->lockForUpdate()->find($orderId);

                if (!$order) {
                    return null;
                }

                if ($eventId !== null && $order->provider_event_id === $eventId) {
                    return $order;
                }

                if ($order->payment_status === 'pending') {
                    $order->markAsPaid($session->payment_intent, 'stripe', $eventId);
                    return $order->fresh();
                }

                if ($eventId !== null && $order->provider_event_id === null) {
                    $order->update(['provider_event_id' => $eventId]);
                    return $order->fresh();
                }

                return $order;
            });
        }

        return null;
    }
}
