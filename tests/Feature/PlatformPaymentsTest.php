<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Order;
use App\Models\MerchantPaymentSetting;
use App\Services\PlatformPaymentsAdapter;
use App\Services\CommissionCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PlatformPaymentsTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_calculates_commission_correctly()
    {
        // Setup
        MerchantPaymentSetting::create([
            'commission_percent' => 5.50,
            'commission_fixed' => 0.50,
        ]);

        $calculator = new CommissionCalculator();
        
        // Test: €100 order
        // Expected: (100 * 5.5 / 100) + 0.50 = 5.50 + 0.50 = €6.00 = 600 cents
        $commission = $calculator->calculateCommission(100.00);
        
        $this->assertEquals(600, $commission);
    }

    /** @test */
    public function platform_mode_off_returns_empty_params()
    {
        config(['spotex.platform_mode' => 'off']);
        
        MerchantPaymentSetting::create([
            'stripe_connect_enabled' => false,
            'commission_percent' => 5.00,
        ]);

        $adapter = new PlatformPaymentsAdapter(new CommissionCalculator());
        $order = Order::factory()->create(['total' => 100.00]);

        $params = $adapter->getStripeConnectParams($order);
        
        $this->assertEmpty($params);
    }

    /** @test */
    public function stripe_connect_mode_returns_correct_params()
    {
        config(['spotex.platform_mode' => 'stripe_connect']);
        
        MerchantPaymentSetting::create([
            'stripe_connect_enabled' => true,
            'stripe_connected_account_id' => 'acct_TEST123',
            'commission_percent' => 5.00,
            'commission_fixed' => 0.00,
        ]);

        $adapter = new PlatformPaymentsAdapter(new CommissionCalculator());
        $order = Order::factory()->create(['total' => 100.00]);

        $params = $adapter->getStripeConnectParams($order);
        
        $this->assertArrayHasKey('payment_intent_data', $params);
        $this->assertEquals(500, $params['payment_intent_data']['application_fee_amount']); // €5
        $this->assertEquals('acct_TEST123', $params['payment_intent_data']['transfer_data']['destination']);
    }

    /** @test */
    public function paypal_multiparty_mode_returns_correct_params()
    {
        config(['spotex.platform_mode' => 'paypal_multiparty']);
        
        MerchantPaymentSetting::create([
            'paypal_multiparty_enabled' => true,
            'paypal_merchant_id' => 'MERCHANT123',
            'commission_percent' => 5.00,
            'commission_fixed' => 0.50,
        ]);

        $adapter = new PlatformPaymentsAdapter(new CommissionCalculator());
        $order = Order::factory()->create(['total' => 100.00]);

        $params = $adapter->getPayPalMultipartyParams($order);
        
        $this->assertArrayHasKey('payment_instruction', $params);
        $this->assertEquals('5.50', $params['payment_instruction']['platform_fees'][0]['amount']['value']);
        $this->assertEquals('MERCHANT123', $params['payee']['merchant_id']);
    }

    /** @test */
    public function order_saves_platform_metadata()
    {
        $order = Order::factory()->create([
            'total' => 100.00,
            'payment_provider' => 'stripe',
            'platform_mode' => 'stripe_connect',
            'commission_amount' => 500,
            'provider_payment_id' => 'cs_test_123',
            'provider_event_id' => 'evt_test_123',
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_provider' => 'stripe',
            'platform_mode' => 'stripe_connect',
            'commission_amount' => 500,
            'provider_payment_id' => 'cs_test_123',
            'provider_event_id' => 'evt_test_123',
        ]);
    }
}
