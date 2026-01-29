<?php

namespace App\Services;

use App\Models\Order;
use App\Models\MerchantPaymentSetting;

/**
 * CommissionCalculator - Calcola la commissione platform per un ordine
 * 
 * Formula: commission = (subtotal * percent / 100) + fixed
 */
class CommissionCalculator
{
    private MerchantPaymentSetting $settings;

    public function __construct()
    {
        $this->settings = MerchantPaymentSetting::getSettings();
    }

    /**
     * Calcola l'importo della commissione in cents (integer)
     * 
     * @param float $orderTotal Totale ordine in EUR
     * @return int Commissione in cents
     */
    public function calculateCommission(float $orderTotal): int
    {
        $percentAmount = ($orderTotal * floatval($this->settings->commission_percent)) / 100;
        $fixedAmount = floatval($this->settings->commission_fixed);
        
        $totalCommission = $percentAmount + $fixedAmount;
        
        // Converti in cents e arrotonda
        return (int) round($totalCommission * 100);
    }

    /**
     * Get commission settings
     */
    public function getSettings(): MerchantPaymentSetting
    {
        return $this->settings;
    }
}
