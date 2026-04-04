<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\CustomerController as ApiV1CustomerController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\InventoryController as ApiV1InventoryController;
use App\Http\Controllers\Api\V1\OAuthTokenController;
use App\Http\Controllers\Api\V1\OrderController as ApiV1OrderController;
use App\Http\Controllers\Api\V1\ProductController as ApiV1ProductController;
use App\Http\Controllers\Api\V1\ProductVariantController as ApiV1ProductVariantController;
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

Route::prefix('v1')
    ->as('api.v1.')
    ->group(function () {
        Route::get('/health', HealthController::class)->name('health');
        Route::post('/oauth/token', [OAuthTokenController::class, 'issue'])
            ->middleware('throttle:60,1')
            ->name('oauth.token');

        Route::middleware(['api.v1.auth', 'api.v1.idempotency'])->group(function () {
            Route::get('/me', MeController::class)
                ->middleware('api.v1.scope:read_profile')
                ->name('me');

            Route::get('/products', [ApiV1ProductController::class, 'index'])
                ->middleware('api.v1.scope:read_products')
                ->name('products.index');

            Route::get('/products/{product}', [ApiV1ProductController::class, 'show'])
                ->middleware('api.v1.scope:read_products')
                ->name('products.show');

            Route::post('/products', [ApiV1ProductController::class, 'store'])
                ->middleware('api.v1.scope:write_products')
                ->name('products.store');

            Route::patch('/products/{product}', [ApiV1ProductController::class, 'update'])
                ->middleware('api.v1.scope:write_products')
                ->name('products.update');

            Route::get('/variants', [ApiV1ProductVariantController::class, 'index'])
                ->middleware('api.v1.scope:read_products')
                ->name('variants.index');

            Route::get('/variants/{variant}', [ApiV1ProductVariantController::class, 'show'])
                ->middleware('api.v1.scope:read_products')
                ->name('variants.show');

            Route::post('/variants', [ApiV1ProductVariantController::class, 'store'])
                ->middleware('api.v1.scope:write_products')
                ->name('variants.store');

            Route::patch('/variants/{variant}', [ApiV1ProductVariantController::class, 'update'])
                ->middleware('api.v1.scope:write_products')
                ->name('variants.update');

            Route::get('/inventory/levels', [ApiV1InventoryController::class, 'levels'])
                ->middleware('api.v1.scope:read_inventory')
                ->name('inventory.levels');

            Route::post('/inventory/movements', [ApiV1InventoryController::class, 'movement'])
                ->middleware('api.v1.scope:write_inventory')
                ->name('inventory.movements.store');

            Route::get('/orders', [ApiV1OrderController::class, 'index'])
                ->middleware('api.v1.scope:read_orders')
                ->name('orders.index');

            Route::get('/orders/{order}', [ApiV1OrderController::class, 'show'])
                ->middleware('api.v1.scope:read_orders')
                ->name('orders.show');

            Route::post('/orders', [ApiV1OrderController::class, 'store'])
                ->middleware('api.v1.scope:write_orders')
                ->name('orders.store');

            Route::get('/customers', [ApiV1CustomerController::class, 'index'])
                ->middleware('api.v1.scope:read_customers')
                ->name('customers.index');

            Route::get('/customers/{customer}', [ApiV1CustomerController::class, 'show'])
                ->middleware('api.v1.scope:read_customers')
                ->name('customers.show');

            Route::post('/customers', [ApiV1CustomerController::class, 'store'])
                ->middleware('api.v1.scope:write_customers')
                ->name('customers.store');

            Route::patch('/customers/{customer}', [ApiV1CustomerController::class, 'update'])
                ->middleware('api.v1.scope:write_customers')
                ->name('customers.update');
        });
    });

// Route per test (opzionale, solo in dev)
if (app()->environment('local', 'testing')) {
    Route::post('/webhooks/test', function (Request $request) {
        return response()->json([
            'message' => 'Test webhook endpoint',
            'headers' => $request->headers->all(),
            'current_store_id' => $request->attributes->get('current_store_id'),
            'current_store_slug' => $request->attributes->get('current_store_slug'),
        ]);
    })->middleware(['api']);
}
