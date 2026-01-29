<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchantPaymentSetting extends Model
{
    protected $fillable = [
        'stripe_connected_account_id',
        'stripe_connect_enabled',
        'paypal_merchant_id',
        'paypal_multiparty_enabled',
        'commission_percent',
        'commission_fixed',
        'business_name',
        'business_email',
        'notes',
    ];

    protected $casts = [
        'stripe_connect_enabled' => 'boolean',
        'paypal_multiparty_enabled' => 'boolean',
        'commission_percent' => 'decimal:2',
        'commission_fixed' => 'decimal:2',
    ];

    /**
     * Get the singleton settings instance
     */
    public static function getSettings(): self
    {
        return static::firstOrCreate([], [
            'commission_percent' => 0.00,
            'commission_fixed' => 0.00,
            'stripe_connect_enabled' => false,
            'paypal_multiparty_enabled' => false,
        ]);
    }

    /**
     * Check if Stripe Connect is configured and enabled
     */
    public function isStripeConnectReady(): bool
    {
        return $this->stripe_connect_enabled 
            && !empty($this->stripe_connected_account_id);
    }

    /**
     * Check if PayPal Multiparty is configured and enabled
     */
    public function isPayPalMultipartyReady(): bool
    {
        return $this->paypal_multiparty_enabled 
            && !empty($this->paypal_merchant_id);
    }
}
