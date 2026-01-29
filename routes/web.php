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
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CustomerDashboardController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

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

// ========================================
// AUTENTICAZIONE UTENTI (CLIENTI)
// ========================================

// Registrazione
Route::get('/registrati', [AuthController::class, 'showRegister'])->name('register');
Route::post('/registrati', [AuthController::class, 'register'])->name('register.post');

// Login
Route::get('/accedi', [AuthController::class, 'showLogin'])->name('login');
Route::post('/accedi', [AuthController::class, 'login'])->name('login.post');

// Logout
Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Email Verification
Route::get('/email/verifica', [AuthController::class, 'showVerificationNotice'])
    ->middleware('auth')
    ->name('verification.notice');

Route::get('/email/verifica/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    return redirect()->route('home')->with('success', 'Email verificata con successo!');
})->middleware(['auth', 'signed'])->name('verification.verify');

Route::post('/email/verifica/invia', [AuthController::class, 'resendVerificationEmail'])
    ->middleware(['auth', 'throttle:6,1'])
    ->name('verification.send');

// ========================================
// FINE AUTENTICAZIONE UTENTI
// ========================================

// ========================================
// DASHBOARD CLIENTE (protetto)
// ========================================
Route::middleware(['auth', 'verified'])->prefix('/account')->name('customer.')->group(function () {
    // Dashboard principale
    Route::get('/', [CustomerDashboardController::class, 'index'])->name('dashboard');
    
    // Profilo
    Route::get('/profilo', [CustomerDashboardController::class, 'profile'])->name('profile');
    Route::post('/profilo', [CustomerDashboardController::class, 'updateProfile'])->name('profile.update');
    
    // Ordini
    Route::get('/ordini', [CustomerDashboardController::class, 'index'])->name('orders');
    Route::get('/ordini/{order}', [CustomerDashboardController::class, 'showOrder'])->name('orders.show');
    Route::get('/ordini/{order}/modifica', [CustomerDashboardController::class, 'editOrder'])->name('orders.edit');
    Route::post('/ordini/{order}', [CustomerDashboardController::class, 'updateOrder'])->name('orders.update');
    
    // Indirizzi
    Route::get('/indirizzi', [CustomerDashboardController::class, 'addresses'])->name('addresses');
    Route::get('/indirizzi/aggiungi', [CustomerDashboardController::class, 'createAddress'])->name('addresses.create');
    Route::post('/indirizzi', [CustomerDashboardController::class, 'storeAddress'])->name('addresses.store');
    Route::get('/indirizzi/{address}/modifica', [CustomerDashboardController::class, 'editAddress'])->name('addresses.edit');
    Route::post('/indirizzi/{address}', [CustomerDashboardController::class, 'updateAddress'])->name('addresses.update');
    Route::delete('/indirizzi/{address}', [CustomerDashboardController::class, 'destroyAddress'])->name('addresses.destroy');
});

// ========================================
// FINE DASHBOARD CLIENTE
// ========================================

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
