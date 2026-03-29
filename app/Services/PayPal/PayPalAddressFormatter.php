<?php

namespace App\Services\PayPal;

class PayPalAddressFormatter
{
    public function formatForPurchaseUnit(?string $address): array
    {
        if (!is_string($address) || $address === '') {
            return $this->fallbackAddress();
        }

        $parsed = json_decode($address, true);
        if (is_array($parsed)) {
            return $this->buildStructuredAddress($parsed);
        }

        $parts = array_map('trim', explode(',', $address));

        return [
            'address_line_1' => $parts[0] ?? 'Unknown',
            'address_line_2' => $parts[1] ?? '',
            'admin_area_2' => $parts[2] ?? 'Unknown',
            'postal_code' => $parts[3] ?? '00000',
            'country_code' => $parts[4] ?? 'IT',
        ];
    }

    public function parseFromWebhook(array $webhookData): array
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

    private function buildStructuredAddress(array $data): array
    {
        return [
            'address_line_1' => $data['address_line_1'] ?? 'Unknown',
            'address_line_2' => $data['address_line_2'] ?? '',
            'admin_area_2' => $data['city'] ?? $data['admin_area_2'] ?? 'Unknown',
            'postal_code' => $data['postal_code'] ?? '00000',
            'country_code' => $data['country_code'] ?? 'IT',
        ];
    }

    private function fallbackAddress(): array
    {
        return [
            'address_line_1' => 'Unknown',
            'address_line_2' => '',
            'admin_area_2' => 'Unknown',
            'postal_code' => '00000',
            'country_code' => 'IT',
        ];
    }
}
