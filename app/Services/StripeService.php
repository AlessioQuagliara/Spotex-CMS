<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\Checkout\Session;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Crea una sessione Stripe Checkout
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

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'mode' => 'payment',
            'success_url' => route('checkout.success', ['order' => $order->id]),
            'cancel_url' => route('checkout.cancel', ['order' => $order->id]),
            'client_reference_id' => (string) $order->id,
            'metadata' => [
                'order_id' => $order->id,
            ],
        ]);

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
     */
    public function handlePaymentSuccess(string $sessionId): ?Order
    {
        $session = Session::retrieve($sessionId);
        
        if ($session->payment_status === 'paid') {
            $order = Order::find($session->metadata->order_id);
            
            if ($order && $order->payment_status === 'pending') {
                $order->markAsPaid($session->payment_intent, 'stripe');

                // Compatibilità legacy
                $order->update([
                    'status' => 'paid',
                ]);
            }

            return $order;
        }

        return null;
    }
}
