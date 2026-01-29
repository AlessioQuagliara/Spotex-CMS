<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PageBuilderController;
use App\Http\Controllers\FrontendPageController;
use App\Http\Controllers\PageCodeController;
use App\Http\Controllers\Api\CouponController;

Route::get('/', [FrontendPageController::class, 'home'])->name('home');
Route::get('/prodotti', [ProductController::class, 'index'])->name('products');
Route::get('/categoria/{category:slug}', [ProductController::class, 'category'])->name('category.show');
Route::get('/prodotto/{product:slug}', [ProductController::class, 'show'])->name('product.show');

// Carrello
Route::post('/carrello/aggiungi', [CartController::class, 'add'])->name('cart.add');
Route::get('/carrello', [CartController::class, 'show'])->name('cart.show');
Route::post('/carrello/aggiorna', [CartController::class, 'update'])->name('cart.update');
Route::post('/carrello/rimuovi', [CartController::class, 'remove'])->name('cart.remove');

// Checkout (pubblico)
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
Route::post('/checkout/crea-ordine', [CheckoutController::class, 'createOrder'])->name('checkout.create');

// API pubblica
Route::get('/api/coupons', [CouponController::class, 'list']);
Route::get('/api/coupons/active', [CouponController::class, 'active']);
Route::post('/api/coupons/validate', [CouponController::class, 'validateCoupon']);

// Builder per pagine (protetto da autenticazione admin)
Route::middleware('auth')->group(function () {
    Route::get('/admin/pages/{page}/builder', [PageBuilderController::class, 'show'])->name('pages.builder');
    Route::post('/api/pages/{page}/builder/save', [PageBuilderController::class, 'save'])->name('pages.builder.save');
    Route::get('/api/pages/{page}/builder/export', [PageBuilderController::class, 'export'])->name('pages.builder.export');

    Route::get('/admin/pages/{page}/code', [PageCodeController::class, 'editor'])->name('pages.code');
    Route::get('/admin/pages/code/list', [PageCodeController::class, 'list'])->name('pages.code.list');
    Route::get('/admin/pages/{page}/code/show', [PageCodeController::class, 'show'])->name('pages.code.show');
    Route::post('/admin/pages/{page}/code/save', [PageCodeController::class, 'save'])->name('pages.code.save');

    // Pagamenti
    Route::post('/pagamento/stripe/checkout', [PaymentController::class, 'initializeStripeCheckout'])->name('payment.stripe.checkout');
    Route::post('/pagamento/paypal/checkout', [PaymentController::class, 'initializePayPalCheckout'])->name('payment.paypal.checkout');
    Route::post('/pagamento/paypal/capture', [PaymentController::class, 'capturePayPalOrder'])->name('payment.paypal.capture');
    
    Route::get('/checkout/success/{order}', [PaymentController::class, 'checkoutSuccess'])->name('checkout.success');
    Route::get('/checkout/cancel/{order}', [PaymentController::class, 'checkoutCancel'])->name('checkout.cancel');
});

// Pagine builder (rotta catch-all alla fine)
Route::get('/{page:slug}', [FrontendPageController::class, 'show'])->name('page.show');
