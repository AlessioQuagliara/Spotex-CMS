<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PageBuilderController;

Route::get('/', [ProductController::class, 'index'])->name('home');
Route::get('/prodotti', [ProductController::class, 'index'])->name('products');
Route::get('/prodotto/{product:slug}', [ProductController::class, 'show'])->name('product.show');

// Builder per pagine (protetto da autenticazione admin)
Route::middleware('auth')->group(function () {
    Route::get('/admin/pages/{page}/builder', [PageBuilderController::class, 'show'])->name('pages.builder');
    Route::post('/api/pages/{page}/builder/save', [PageBuilderController::class, 'save'])->name('pages.builder.save');
    Route::get('/api/pages/{page}/builder/export', [PageBuilderController::class, 'export'])->name('pages.builder.export');

    // Carrello
    Route::post('/carrello/aggiungi', [CartController::class, 'add'])->name('cart.add');
    Route::get('/carrello', [CartController::class, 'show'])->name('cart.show');
    Route::post('/carrello/aggiorna', [CartController::class, 'update'])->name('cart.update');
    Route::post('/carrello/rimuovi', [CartController::class, 'remove'])->name('cart.remove');

    // Checkout
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/checkout/crea-ordine', [CheckoutController::class, 'createOrder'])->name('checkout.create');

    // Pagamenti
    Route::post('/pagamento/stripe/checkout', [PaymentController::class, 'initializeStripeCheckout'])->name('payment.stripe.checkout');
    Route::post('/pagamento/paypal/checkout', [PaymentController::class, 'initializePayPalCheckout'])->name('payment.paypal.checkout');
    Route::post('/pagamento/paypal/capture', [PaymentController::class, 'capturePayPalOrder'])->name('payment.paypal.capture');
    
    Route::get('/checkout/success/{order}', [PaymentController::class, 'checkoutSuccess'])->name('checkout.success');
    Route::get('/checkout/cancel/{order}', [PaymentController::class, 'checkoutCancel'])->name('checkout.cancel');
});


