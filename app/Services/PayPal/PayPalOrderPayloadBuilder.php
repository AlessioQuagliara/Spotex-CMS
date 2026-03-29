<?php

namespace App\Services\PayPal;

use App\Models\Order;

class PayPalOrderPayloadBuilder
{
    public function __construct(
        private readonly PayPalAddressFormatter $addressFormatter
    ) {}

    public function build(Order $order, array $purchaseUnitOverrides = []): array
    {
        $purchaseUnit = [
            'reference_id' => (string) $order->id,
            'amount' => [
                'currency_code' => 'EUR',
                'value' => $this->formatMoney((float) $order->total),
                'breakdown' => [
                    'item_total' => [
                        'currency_code' => 'EUR',
                        'value' => $this->formatMoney((float) $order->total),
                    ],
                ],
            ],
            'items' => $this->buildItems($order),
            'shipping' => [
                'address' => $this->addressFormatter->formatForPurchaseUnit($order->shipping_address),
            ],
        ];

        if (!empty($purchaseUnitOverrides)) {
            $purchaseUnit = array_merge($purchaseUnit, $purchaseUnitOverrides);
        }

        return [
            'intent' => 'CAPTURE',
            'purchase_units' => [$purchaseUnit],
            'application_context' => [
                'return_url' => route('checkout.success', ['order' => $order->id]),
                'cancel_url' => route('checkout.cancel', ['order' => $order->id]),
            ],
        ];
    }

    private function buildItems(Order $order): array
    {
        return $order->items->map(function ($item) {
            return [
                'name' => $item->product->name,
                'sku' => (string) $item->product->id,
                'unit_amount' => [
                    'currency_code' => 'EUR',
                    'value' => $this->formatMoney((float) $item->unit_price),
                ],
                'quantity' => (int) $item->quantity,
            ];
        })->all();
    }

    private function formatMoney(float $amount): string
    {
        return number_format($amount, 2, '.', '');
    }
}
