<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\WebhookEvent;
use App\Jobs\ProcessStripeWebhook;
use App\Jobs\ProcessPayPalWebhook;
use App\Services\StripeService;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;

class PaymentController extends Controller
{
    public function __construct(
        protected StripeService $stripeService,
        protected PayPalService $paypalService
    ) {}

    /**
     * Inizializza il checkout con Stripe
     */
    public function initializeStripeCheckout(Order $order)
    {
        try {
            $sessionId = $this->stripeService->createCheckoutSession($order);
            
            return response()->json([
                'success' => true,
                'sessionId' => $sessionId,
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe checkout error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Errore nell\'inizializzazione del pagamento',
            ], 500);
        }
    }

    /**
     * Webhook Stripe per aggiornare lo stato dell'ordine
     * 
     * Usa tabella webhook_events per deduplica: Stripe può inviare lo stesso evento più volte
     */
    public function stripeWebhook(Request $request)
    {
        $requestBody = $request->getContent();
        
        try {
            $event = Webhook::constructEvent(
                $requestBody,
                $request->header('Stripe-Signature'),
                config('services.stripe.webhook_secret')
            );

            $eventId = $event->id;

            // Controlla se l'evento è già stato processato (idempotenza)
            if (WebhookEvent::alreadyProcessed('stripe', $eventId)) {
                Log::info('Stripe webhook: duplicate event (already processed)', [
                    'event_id' => $eventId,
                    'type' => $event->type,
                ]);
                return response()->json(['status' => 'success']);
            }

            // Crea il record webhook per tracking
            $webhookRecord = WebhookEvent::getOrCreate('stripe', $eventId, [
                'event_type' => $event->type,
                'payload' => $event->toArray(),
            ]);

            if (in_array($webhookRecord->status, ['processing', 'completed'], true)) {
                return response()->json(['status' => 'success']);
            }

            $webhookRecord->update(['status' => 'processing']);

            // Dispatch in coda per processing asincrono
            $sessionId = $event->data->object->id ?? null;
            ProcessStripeWebhook::dispatch($eventId, $event->type, $sessionId)
                ->onQueue('webhooks');

            return response()->json(['status' => 'success']);
        } catch (\UnexpectedValueException $e) {
            Log::error('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 400);
        } catch (\Exception $e) {
            Log::error('Stripe webhook error', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Webhook processing error'], 500);
        }
    }

    /**
     * Inizializza il checkout con PayPal
     */
    public function initializePayPalCheckout(Order $order)
    {
        try {
            $paypalOrder = $this->paypalService->createOrder($order);
            
            if (!isset($paypalOrder['id'])) {
                throw new \Exception('Errore nella creazione dell\'ordine PayPal');
            }

            return response()->json([
                'success' => true,
                'orderId' => $paypalOrder['id'],
            ]);
        } catch (\Exception $e) {
            Log::error('PayPal checkout error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Errore nell\'inizializzazione del pagamento PayPal',
            ], 500);
        }
    }

    /**
     * Cattura l'ordine PayPal (il frontend autorizza il pagamento)
     * 
     * ATTENZIONE: Questa NON è la fonte di verità!
     * Lo stato definitivo dell'ordine arriva dal webhook.
     * Se il client crasha dopo la capture, il webhook correggerà il record.
     */
    public function capturePayPalOrder(Request $request)
    {
        try {
            $paypalOrderId = $request->input('order_id');
            $localOrderId = $request->input('local_order_id');

            if (!$paypalOrderId || !$localOrderId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing required parameters',
                ], 400);
            }

            // Esegui la capture lato server (ha più affidabilità che client-side)
            $captureResult = $this->paypalService->captureOrder($paypalOrderId);

            Log::info('PayPal order capture initiated', [
                'paypal_order_id' => $paypalOrderId,
                'local_order_id' => $localOrderId,
                'capture_status' => $captureResult['status'] ?? 'unknown',
            ]);

            // Rispondi al client che la capture è stata iniziata
            // Il vero aggiornamento dell'ordine verrà dal webhook
            return response()->json([
                'success' => true,
                'message' => 'Capture initiated, waiting for webhook confirmation',
                'status' => $captureResult['status'] ?? 'PROCESSING',
            ]);
        } catch (\Exception $e) {
            Log::error('PayPal capture error', [
                'error' => $e->getMessage(),
                'paypal_order_id' => $request->input('order_id'),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Errore durante l\'elaborazione del pagamento',
            ], 500);
        }
    }

    /**
     * Webhook PayPal per notifiche asincrone
     * 
     * FONTE DI VERITÀ: Lo stato definitivo dell'ordine viene da qui, non dal client
     * Se la capture server-side fallisce ma il webhook arriva, lo saprai
     * Se il client crasha ma il webhook arriva, l'ordine avrà lo stato corretto
     */
    public function paypalWebhook(Request $request)
    {
        $requestBody = $request->getContent();
        
        try {
            $webhookData = json_decode($requestBody, true);
            $eventId = $webhookData['id'] ?? null;
            $eventType = $webhookData['event_type'] ?? null;

            if (!$eventId || !$eventType) {
                Log::warning('PayPal webhook: missing event_id or event_type');
                return response()->json(['status' => 'success']);
            }

            // Verifica la firma usando l'API PayPal (non calcoli locali)
            if (!$this->paypalService->verifyWebhookSignature($request)) {
                Log::error('PayPal webhook signature verification failed', [
                    'event_id' => $eventId,
                ]);
                return response()->json(['error' => 'Invalid signature'], 400);
            }

            // Idempotenza: controlla se l'evento è già stato processato
            if (WebhookEvent::alreadyProcessed('paypal', $eventId)) {
                Log::info('PayPal webhook: duplicate event (already processed)', [
                    'event_id' => $eventId,
                    'event_type' => $eventType,
                ]);
                return response()->json(['status' => 'success']);
            }

            // Crea il record webhook per tracking
            $webhookRecord = WebhookEvent::getOrCreate('paypal', $eventId, [
                'event_type' => $eventType,
                'payload' => $webhookData,
            ]);

            if (in_array($webhookRecord->status, ['processing', 'completed'], true)) {
                return response()->json(['status' => 'success']);
            }

            $webhookRecord->update(['status' => 'processing']);

            // Dispatch in coda per processing asincrono
            ProcessPayPalWebhook::dispatch($eventId, $eventType, $webhookData)
                ->onQueue('webhooks');

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('PayPal webhook error', [
                'error' => $e->getMessage(),
                'body' => substr($requestBody, 0, 500), // Primo 500 char del payload
            ]);
            // Rispondi 200 per evitare PayPal retry loop
            return response()->json(['status' => 'success']);
        }
    }

    /**
     * Pagina di successo dopo il pagamento
     */
    public function checkoutSuccess(Order $order)
    {
        return view('checkout.success', ['order' => $order]);
    }

    /**
     * Pagina di cancellazione
     */
    public function checkoutCancel(Order $order)
    {
        return view('checkout.cancel', ['order' => $order]);
    }
}
