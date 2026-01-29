<?php

namespace App\Services;

use App\Models\Order;
use App\Models\MerchantPaymentSetting;

/**
 * PlatformPaymentsAdapter - Determina se usare modalità standard o platform
 * 
 * Pattern Adapter/Shim: questo servizio NON cambia il flusso esistente,
 * aggiunge solo parametri extra quando necessario.
 */
class PlatformPaymentsAdapter
{
    private MerchantPaymentSetting $settings;
    private CommissionCalculator $calculator;
    private string $platformMode;

    public function __construct(CommissionCalculator $calculator)
    {
        $this->settings = MerchantPaymentSetting::getSettings();
        $this->calculator = $calculator;
        $this->platformMode = config('spotex.platform_mode', 'off');
    }

    /**
     * Check if platform mode is active for Stripe
     */
    public function isStripeConnectActive(): bool
    {
        return $this->platformMode === 'stripe_connect' 
            && $this->settings->isStripeConnectReady();
    }

    /**
     * Check if platform mode is active for PayPal
     */
    public function isPayPalMultipartyActive(): bool
    {
        return $this->platformMode === 'paypal_multiparty' 
            && $this->settings->isPayPalMultipartyReady();
    }

    /**
     * Get Stripe Connect parameters to MERGE into existing Session::create()
     * 
     * Returns array to merge, or empty array if platform mode is off
     */
    public function getStripeConnectParams(Order $order): array
    {
        if (!$this->isStripeConnectActive()) {
            return [];
        }

        $commissionCents = $this->calculator->calculateCommission((float) $order->total);

        return [
            'payment_intent_data' => [
                'application_fee_amount' => $commissionCents,
                'transfer_data' => [
                    'destination' => $this->settings->stripe_connected_account_id,
                ],
            ],
        ];
    }

    /**
     * Get PayPal Multiparty parameters to MERGE into existing createOrder()
     * 
     * Returns array to merge into purchase_units, or empty array if off
     */
    public function getPayPalMultipartyParams(Order $order): array
    {
        if (!$this->isPayPalMultipartyActive()) {
            return [];
        }

        $commissionAmount = $this->calculator->calculateCommission((float) $order->total) / 100;

        // PayPal Multiparty/Commerce Platform uses "platform_fees" or "payment_instruction"
        // Vedi: https://developer.paypal.com/docs/multiparty/checkout/advanced/platform-fees/
        return [
            'payment_instruction' => [
                'platform_fees' => [
                    [
                        'amount' => [
                            'currency_code' => 'EUR',
                            'value' => number_format($commissionAmount, 2, '.', ''),
                        ],
                    ],
                ],
            ],
            'payee' => [
                'merchant_id' => $this->settings->paypal_merchant_id,
            ],
        ];
    }

    /**
     * Get commission amount for an order
     */
    public function getCommissionAmount(Order $order): int
    {
        return $this->calculator->calculateCommission((float) $order->total);
    }

    /**
     * Get current platform mode
     */
    public function getPlatformMode(): string
    {
        return $this->platformMode;
    }

    /**
     * Get settings
     */
    public function getSettings(): MerchantPaymentSetting
    {
        return $this->settings;
    }
}
