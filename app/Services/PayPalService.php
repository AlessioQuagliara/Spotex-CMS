<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use App\Models\Order;

class PayPalService
{
    private string $clientId;
    private string $clientSecret;
    private string $webhookId;
    private string $baseUrl;
    private string $mode;

    public function __construct()
    {
        $this->clientId = config('services.paypal.client_id');
        $this->clientSecret = config('services.paypal.client_secret');
        $this->webhookId = config('services.paypal.webhook_id');
        $this->mode = config('services.paypal.mode', 'sandbox');
        
        $this->baseUrl = $this->mode === 'sandbox'
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
    }

    /**
     * Ottiene un access token da PayPal OAuth
     */
    public function getAccessToken(): string
    {
        try {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->post("{$this->baseUrl}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials',
                ])
                ->throw();

            return $response->json('access_token');
        } catch (\Exception $e) {
            Log::error('PayPal getAccessToken failed', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Crea un ordine PayPal con i dettagli degli item
     */
    public function createOrder(Order $order): array
    {
        try {
            $token = $this->getAccessToken();
            
            $items = [];
            foreach ($order->items as $item) {
                $items[] = [
                    'name' => $item->product->name,
                    'sku' => (string)$item->product->id,
                    'unit_amount' => [
                        'currency_code' => 'EUR',
                        'value' => number_format($item->unit_price, 2, '.', ''),
                    ],
                    'quantity' => (int)$item->quantity,
                ];
            }

            $purchaseUnits = [
                [
                    'reference_id' => (string)$order->id,
                    'amount' => [
                        'currency_code' => 'EUR',
                        'value' => number_format((float) $order->total, 2, '.', ''),
                        'breakdown' => [
                            'item_total' => [
                                'currency_code' => 'EUR',
                                'value' => number_format((float) $order->total, 2, '.', ''),
                            ],
                        ],
                    ],
                    'items' => $items,
                    'shipping' => [
                        'address' => $this->formatAddress($order->shipping_address),
                    ],
                ],
            ];

            $response = Http::withToken($token)
                ->post("{$this->baseUrl}/v2/checkout/orders", [
                    'intent' => 'CAPTURE',
                    'purchase_units' => $purchaseUnits,
                    'application_context' => [
                        'return_url' => route('checkout.success', ['order' => $order->id]),
                        'cancel_url' => route('checkout.cancel', ['order' => $order->id]),
                    ],
                ])
                ->throw();

            return $response->json();
        } catch (\Exception $e) {
            Log::error('PayPal createOrder failed', [
                'error' => $e->getMessage(),
                'order_id' => $order->id,
            ]);
            throw $e;
        }
    }

    /**
     * Cattura un ordine PayPal (completa il pagamento)
     * 
     * ATTENZIONE: Questo esegue la capture immediata.
     * Però lo stato DEFINITIVO dell'ordine deve venire dal webhook,
     * non da questo risultato, perché il webhook è più affidabile
     * (il client-side potrebbe crashare dopo la capture).
     */
    public function captureOrder(string $orderId): array
    {
        try {
            $token = $this->getAccessToken();

            $response = Http::withToken($token)
                ->post("{$this->baseUrl}/v2/checkout/orders/{$orderId}/capture")
                ->throw();

            return $response->json();
        } catch (\Exception $e) {
            Log::error('PayPal captureOrder failed', [
                'error' => $e->getMessage(),
                'order_id' => $orderId,
            ]);
            throw $e;
        }
    }

    /**
     * VERIFICA WEBHOOK via REST API (metodo corretto PayPal)
     * 
     * PayPal recommanda di usare l'endpoint v1/notifications/verify-webhook-signature
     * per verificare l'autenticità del webhook.
     * 
     * Questo è il modo robusto: estrai gli header, chiama l'API PayPal,
     * e fai affidamento sul risultato di PayPal stesso, non su calcoli locali.
     */
    public function verifyWebhookSignature(Request $request): bool
    {
        try {
            $token = $this->getAccessToken();

            // Estrai i dati dal header
            $transmissionId = $request->header('paypal-transmission-id');
            $transmissionTime = $request->header('paypal-transmission-time');
            $certUrl = $request->header('paypal-cert-url');
            $authAlgo = $request->header('paypal-auth-algo');
            $transmissionSig = $request->header('paypal-transmission-sig');
            $webhookBody = $request->getContent();

            // Verifica che tutti i parametri siano presenti
            if (!$transmissionId || !$transmissionTime || !$certUrl || !$authAlgo || !$transmissionSig) {
                Log::warning('PayPal webhook: missing required headers', [
                    'has_transmission_id' => (bool)$transmissionId,
                    'has_transmission_time' => (bool)$transmissionTime,
                    'has_cert_url' => (bool)$certUrl,
                    'has_auth_algo' => (bool)$authAlgo,
                    'has_transmission_sig' => (bool)$transmissionSig,
                ]);
                return false;
            }

            // Se webhook_id non è configurato, log e fallback
            if (!$this->webhookId) {
                Log::warning('PayPal webhook_id not configured in services.paypal.webhook_id');
                // In produzione, fallire sicuro; in dev potremmo loggare solo
                return false;
            }

            // Chiama l'API di verifica PayPal
            $response = Http::withToken($token)
                ->post("{$this->baseUrl}/v1/notifications/verify-webhook-signature", [
                    'transmission_id' => $transmissionId,
                    'transmission_time' => $transmissionTime,
                    'cert_url' => $certUrl,
                    'auth_algo' => $authAlgo,
                    'transmission_sig' => $transmissionSig,
                    'webhook_id' => $this->webhookId,
                    'webhook_event' => json_decode($webhookBody, true),
                ])
                ->throw();

            $result = $response->json();

            // PayPal ritorna 'SUCCESS' se il webhook è autentico
            $isValid = $result['verification_status'] === 'SUCCESS';
            
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

    /**
     * Processa un webhook PayPal dopo che è stato verificato
     * 
     * IMPORTANTE: Questo è il punto in cui aggiorni lo stato dell'ordine
     * in modo affidabile (il webhook è la fonte di verità, non il callback client).
     * 
     * Il capture precedente potrebbe non essere andato a buon fine,
     * oppure potrebbe avvenire un refund dopo: il webhook ti dirà cosa è successo davvero.
     */
    public function handlePaymentCapture(array $webhookData): array
    {
        try {
            $eventType = $webhookData['event_type'] ?? null;
            $resource = $webhookData['resource'] ?? [];
            $eventId = $webhookData['id'] ?? null;

            Log::info('PayPal webhook received', [
                'event_type' => $eventType,
                'event_id' => $eventId,
            ]);

            // Gestisci solo PAYMENT.CAPTURE.COMPLETED
            if ($eventType !== 'PAYMENT.CAPTURE.COMPLETED') {
                return [
                    'success' => false,
                    'message' => "Event type '{$eventType}' not handled by this handler",
                    'event_id' => $eventId,
                ];
            }

            // Estrai le informazioni della transazione
            $paypalTransactionId = $resource['id'] ?? null;
            $status = $resource['status'] ?? null;
            $amount = $resource['amount']['value'] ?? null;
            
            // Prova a ottenere l'order_id dalla purchase unit
            $supplementaryData = $resource['supplementary_data'] ?? [];
            $relatedIds = $supplementaryData['related_ids'] ?? [];
            $orderId = $relatedIds['order_reference_id'] ?? null;

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

    /**
     * Converte un indirizzo array nel formato PayPal
     */
    private function formatAddress(?string $address): array
    {
        // Se è un JSON, decodifica
        if (is_string($address)) {
            $parsed = json_decode($address, true);
            if (is_array($parsed)) {
                return $this->buildAddressArray($parsed);
            }
            // Altrimenti, parsing semplice
            $parts = array_map('trim', explode(',', $address));
        } else {
            $parts = [];
        }
        
        return [
            'address_line_1' => $parts[0] ?? 'Unknown',
            'address_line_2' => $parts[1] ?? '',
            'admin_area_2' => $parts[2] ?? 'Unknown',
            'postal_code' => $parts[3] ?? '00000',
            'country_code' => $parts[4] ?? 'IT',
        ];
    }

    /**
     * Costruisce array indirizzo da dati strutturati
     */
    private function buildAddressArray(array $data): array
    {
        return [
            'address_line_1' => $data['address_line_1'] ?? 'Unknown',
            'address_line_2' => $data['address_line_2'] ?? '',
            'admin_area_2' => $data['city'] ?? $data['admin_area_2'] ?? 'Unknown',
            'postal_code' => $data['postal_code'] ?? '00000',
            'country_code' => $data['country_code'] ?? 'IT',
        ];
    }

    /**
     * Estrae le informazioni di indirizzo dal webhook PayPal
     */
    public function parseAddressFromWebhook(array $webhookData): array
    {
        $resource = $webhookData['resource'] ?? [];
        $shipping = $resource['shipping'] ?? [];
        $name = $shipping['name'] ?? [];
        $address = $shipping['address'] ?? [];

        return [
            'full_name' => trim(($name['given_name'] ?? '') . ' ' . ($name['surname'] ?? '')),
            'email' => $resource['payer']['email_address'] ?? '',
            'address_line_1' => $address['address_line_1'] ?? '',
            'address_line_2' => $address['address_line_2'] ?? '',
            'city' => $address['admin_area_2'] ?? '',
            'state' => $address['admin_area_1'] ?? '',
            'postal_code' => $address['postal_code'] ?? '',
            'country_code' => $address['country_code'] ?? 'IT',
        ];
    }
}
