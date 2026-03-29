<?php

namespace App\Services\PayPal;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class PayPalApiClient
{
    private string $clientId;
    private string $clientSecret;
    private string $baseUrl;

    public function __construct()
    {
        $this->clientId = config('services.paypal.client_id');
        $this->clientSecret = config('services.paypal.client_secret');
        $mode = config('services.paypal.mode', 'sandbox');

        $this->baseUrl = $mode === 'sandbox'
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
    }

    public function getAccessToken(): string
    {
        try {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->post("{$this->baseUrl}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials',
                ])
                ->throw();

            $token = $response->json('access_token');
            if (!is_string($token) || $token === '') {
                throw new RuntimeException('PayPal OAuth response missing access_token');
            }

            return $token;
        } catch (\Exception $e) {
            Log::error('PayPal getAccessToken failed', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function post(string $path, array $payload = []): array
    {
        $request = Http::withToken($this->getAccessToken());
        $url = "{$this->baseUrl}{$path}";

        $response = empty($payload)
            ? $request->post($url)
            : $request->post($url, $payload);

        return $response->throw()->json();
    }
}
