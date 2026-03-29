<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaymentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Webhook routes per Stripe e PayPal (stateless, no session/cookie).
| Questi endpoint NON usano middleware di session o CSRF.
| Sono accessibili da remoto (da Stripe/PayPal servers).
|
*/

Route::group(['prefix' => 'webhooks', 'middleware' => ['api']], function () {
    /**
     * Stripe Webhook
     * 
     * POST /api/webhooks/stripe
     * 
     * Stripe invia qui gli eventi di pagamento.
     * La verifica firma è gestita da StripeService.
     */
    Route::post('/stripe', [PaymentController::class, 'stripeWebhook'])
        ->name('webhook.stripe')
        ->middleware(['throttle:stripe-webhook', 'log-webhook']);

    /**
     * PayPal Webhook
     * 
     * POST /api/webhooks/paypal
     * 
     * PayPal invia qui gli eventi di pagamento.
     * La verifica firma è gestita da PayPalService (REST API verify-webhook-signature).
     */
    Route::post('/paypal', [PaymentController::class, 'paypalWebhook'])
        ->name('webhook.paypal')
        ->middleware(['throttle:paypal-webhook', 'log-webhook']);
});

// Route per test (opzionale, solo in dev)
if (app()->environment('local', 'testing')) {
    Route::post('/webhooks/test', function (Request $request) {
        return response()->json([
            'message' => 'Test webhook endpoint',
            'headers' => $request->headers->all(),
        ]);
    })->middleware(['api']);
}
