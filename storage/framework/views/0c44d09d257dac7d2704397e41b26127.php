<?php $__env->startSection('content'); ?>
<style>
    /* Hide navbar and footer on checkout */
    body.checkout-page {
        padding-top: 0 !important;
    }
    
    body.checkout-page nav {
        display: none !important;
    }
    
    body.checkout-page footer {
        display: none !important;
    }
</style>
<div class="min-h-screen bg-white">
    <!-- Progress Steps -->
    <div class="bg-black text-white py-4">
        <div class="container mx-auto px-4">
            <div class="flex justify-center items-center space-x-8">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-white text-black flex items-center justify-center font-bold rounded-sm">1</div>
                    <span class="ml-2 font-medium">Carrello</span>
                </div>
                <div class="w-16 h-0.5 bg-gray-600"></div>
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-white text-black flex items-center justify-center font-bold rounded-sm">2</div>
                    <span class="ml-2 font-medium">Checkout</span>
                </div>
                <div class="w-16 h-0.5 bg-gray-600"></div>
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-gray-600 text-white flex items-center justify-center font-bold rounded-sm">3</div>
                    <span class="ml-2 text-gray-400">Pagamento</span>
                </div>
                <div class="w-16 h-0.5 bg-gray-600"></div>
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-gray-600 text-white flex items-center justify-center font-bold rounded-sm">4</div>
                    <span class="ml-2 text-gray-400">Conferma</span>
                </div>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 py-12">
        <div class="text-center mb-12">
            <h1 class="text-5xl font-bold tracking-tight text-black mb-2">Checkout</h1>
            <p class="text-gray-600">Completa il tuo ordine in pochi passaggi</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <!-- Left Column: Forms -->
            <div class="lg:col-span-2">
                <form id="checkoutForm" class="space-y-8">
                    <?php echo csrf_field(); ?>
                    <input type="hidden" name="order_id" value="<?php echo e($order->id ?? ''); ?>">

                    <!-- Personal Information -->
                    <div class="border border-gray-200 rounded-none p-8 bg-white">
                        <div class="flex items-center mb-6">
                            <div class="w-8 h-8 bg-black text-white flex items-center justify-center font-bold rounded-sm mr-3">1</div>
                            <h2 class="text-2xl font-bold text-black">Dati Personali</h2>
                        </div>
                        
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($userFirstName): ?>
                            <div class="md:col-span-2 text-xs text-gray-500 bg-blue-50 p-3 rounded mb-6">
                                ✓ Dati caricati dal tuo account
                            </div>
                        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-1">
                                <label class="text-sm font-medium text-gray-700">Nome *</label>
                                <input type="text" name="customer_first_name" placeholder="Nome" required
                                       class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400"
                                       value="<?php echo e(old('customer_first_name', $userFirstName ?? '')); ?>">
                            </div>
                            <div class="space-y-1">
                                <label class="text-sm font-medium text-gray-700">Cognome *</label>
                                <input type="text" name="customer_last_name" placeholder="Cognome" required
                                       class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400"
                                       value="<?php echo e(old('customer_last_name', $userLastName ?? '')); ?>">
                            </div>
                            <div class="md:col-span-2 space-y-1">
                                <label class="text-sm font-medium text-gray-700">Email *</label>
                                <input type="email" name="customer_email" placeholder="email@example.com" required
                                       class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400"
                                       value="<?php echo e(old('customer_email', $userEmail ?? '')); ?>">
                            </div>
                        </div>
                    </div>

                    <!-- Shipping Address -->
                    <div class="border border-gray-200 rounded-none p-8 bg-white">
                        <div class="flex items-center mb-6">
                            <div class="w-8 h-8 bg-black text-white flex items-center justify-center font-bold rounded-sm mr-3">2</div>
                            <h2 class="text-2xl font-bold text-black">Indirizzo di Spedizione</h2>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-1">
                                <label class="text-sm font-medium text-gray-700">Indirizzo *</label>
                                <input type="text" name="shipping_address" placeholder="Via, numero civico" required
                                       class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400"
                                       value="<?php echo e(old('shipping_address', $shippingAddress?->address ?? '')); ?>">
                                <div class="text-xs text-gray-500 mt-1">Esempio: Via Roma 123</div>
                            </div>
                            <div class="space-y-1">
                                <label class="text-sm font-medium text-gray-700">Città *</label>
                                <input type="text" name="shipping_city" placeholder="Città" required
                                       class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400"
                                       value="<?php echo e(old('shipping_city', $shippingAddress?->city ?? '')); ?>">
                            </div>
                            <div class="space-y-1">
                                <label class="text-sm font-medium text-gray-700">CAP *</label>
                                <input type="text" name="shipping_zip" placeholder="Codice postale" required
                                       class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400"
                                       value="<?php echo e(old('shipping_zip', $shippingAddress?->postal_code ?? '')); ?>">
                            </div>
                            <div class="space-y-1">
                                <label class="text-sm font-medium text-gray-700">Paese *</label>
                                <select name="shipping_country" required
                                        class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 bg-white appearance-none">
                                    <option value="IT" <?php echo e((old('shipping_country', $shippingAddress?->country ?? 'IT') == 'IT') ? 'selected' : ''); ?>>Italia</option>
                                    <option value="FR" <?php echo e((old('shipping_country') == 'FR') ? 'selected' : ''); ?>>Francia</option>
                                    <option value="DE" <?php echo e((old('shipping_country') == 'DE') ? 'selected' : ''); ?>>Germania</option>
                                    <option value="ES" <?php echo e((old('shipping_country') == 'ES') ? 'selected' : ''); ?>>Spagna</option>
                                </select>
                                <div class="text-xs text-gray-500 mt-1">Attualmente spediamo solo in Europa</div>
                            </div>
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($shippingAddress): ?>
                                <div class="md:col-span-2 text-xs text-gray-500 bg-blue-50 p-3 rounded">
                                    ✓ Indirizzo caricato dal tuo account
                                </div>
                            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        </div>
                    </div>

                    <!-- Shipping Method -->
                    <div class="border border-gray-200 rounded-none p-8 bg-white">
                        <div class="flex items-center mb-6">
                            <div class="w-8 h-8 bg-black text-white flex items-center justify-center font-bold rounded-sm mr-3">3</div>
                            <h2 class="text-2xl font-bold text-black">Metodo di Spedizione</h2>
                        </div>
                        
                        <div class="space-y-4">
                            <?php
                                $shippingRules = \App\Models\ShippingRule::where('is_active', true)->get();
                            ?>
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $shippingRules; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $rule): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <div class="relative">
                                    <input type="radio" name="shipping_method" id="shipping_<?php echo e($rule->id); ?>" 
                                           value="<?php echo e($rule->type); ?>" <?php echo e($index === 0 ? 'checked' : ''); ?> 
                                           class="absolute opacity-0 h-0 w-0">
                                    <label for="shipping_<?php echo e($rule->id); ?>" 
                                           class="block border-2 <?php echo e($index === 0 ? 'border-black' : 'border-gray-300'); ?> p-6 rounded-none cursor-pointer hover:border-gray-500 transition-colors duration-200">
                                        <div class="flex justify-between items-center">
                                            <div class="flex items-center">
                                                <div class="w-6 h-6 border-2 <?php echo e($index === 0 ? 'border-black' : 'border-gray-400'); ?> flex items-center justify-center mr-4">
                                                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($index === 0): ?>
                                                        <div class="w-3 h-3 bg-black"></div>
                                                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                                </div>
                                                <div>
                                                    <div class="font-bold text-lg text-black"><?php echo e($rule->name); ?></div>
                                                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($rule->description): ?>
                                                        <div class="text-sm text-gray-600 mt-1"><?php echo e($rule->description); ?></div>
                                                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($rule->estimated_days): ?>
                                                        <div class="text-xs text-gray-500 mt-1">Consegna stimata: <?php echo e($rule->estimated_days); ?> giorni lavorativi</div>
                                                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                                </div>
                                            </div>
                                            <div class="text-lg font-bold text-black">€<?php echo e(number_format($rule->base_cost, 2, ',', '.')); ?></div>
                                        </div>
                                    </label>
                                </div>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <div class="text-center py-8 border border-gray-200">
                                    <p class="text-gray-500">Nessun metodo di spedizione disponibile</p>
                                    <p class="text-sm text-gray-400 mt-2">Contatta l'assistenza per maggiori informazioni</p>
                                </div>
                            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        </div>
                    </div>

                    <!-- Billing Address -->
                    <div class="border border-gray-200 rounded-none p-8 bg-white">
                        <div class="flex items-center mb-6">
                            <div class="w-8 h-8 bg-black text-white flex items-center justify-center font-bold rounded-sm mr-3">4</div>
                            <h2 class="text-2xl font-bold text-black">Fatturazione</h2>
                        </div>
                        
                        <div class="mb-6">
                            <label class="flex items-center cursor-pointer">
                                <input type="checkbox" id="sameAsShipping" checked 
                                       class="w-5 h-5 border-2 border-black rounded-none mr-3 cursor-pointer">
                                <span class="text-gray-700 select-none">Utilizza lo stesso indirizzo per la fatturazione</span>
                            </label>
                        </div>

                        <div id="billingForm" class="hidden space-y-6 pt-4 border-t border-gray-200">
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($billingAddress): ?>
                                <div class="md:col-span-2 text-xs text-gray-500 bg-blue-50 p-3 rounded">
                                    ✓ Indirizzo caricato dal tuo account
                                </div>
                            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-1">
                                    <label class="text-sm font-medium text-gray-700">Indirizzo di fatturazione *</label>
                                    <input type="text" name="billing_address" placeholder="Via, numero civico" required
                                           value="<?php echo e(old('billing_address', $billingAddress?->address ?? '')); ?>"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-sm font-medium text-gray-700">Città *</label>
                                    <input type="text" name="billing_city" placeholder="Città" required
                                           value="<?php echo e(old('billing_city', $billingAddress?->city ?? '')); ?>"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-sm font-medium text-gray-700">CAP *</label>
                                    <input type="text" name="billing_zip" placeholder="Codice postale" required
                                           value="<?php echo e(old('billing_zip', $billingAddress?->postal_code ?? '')); ?>"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-sm font-medium text-gray-700">Paese *</label>
                                    <select name="billing_country" required
                                            class="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 bg-white appearance-none">
                                        <?php
                                            $selectedCountry = old('billing_country', $billingAddress?->country ?? 'IT');
                                        ?>
                                        <option value="IT" <?php echo e($selectedCountry === 'IT' ? 'selected' : ''); ?>>Italia</option>
                                        <option value="FR" <?php echo e($selectedCountry === 'FR' ? 'selected' : ''); ?>>Francia</option>
                                        <option value="DE" <?php echo e($selectedCountry === 'DE' ? 'selected' : ''); ?>>Germania</option>
                                        <option value="ES" <?php echo e($selectedCountry === 'ES' ? 'selected' : ''); ?>>Spagna</option>
                                    </select>
                                </div>
                            </div>
                            <div class="text-sm text-gray-600 bg-gray-50 p-4">
                                <p>Le informazioni di fatturazione verranno utilizzate per emettere la fattura elettronica.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Discount Code -->
                    <div class="border border-gray-200 rounded-none p-8 bg-white">
                        <div class="flex items-center mb-6">
                            <div class="w-8 h-8 bg-black text-white flex items-center justify-center font-bold rounded-sm mr-3">5</div>
                            <h2 class="text-2xl font-bold text-black">Codice Sconto</h2>
                        </div>
                        
                        <div class="max-w-md">
                            <div class="flex">
                                <input type="text" id="discountCode" name="discount_code" placeholder="CODICE20"
                                       class="flex-1 px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-black text-gray-900 placeholder-gray-400">
                                <button type="button" id="applyDiscount" 
                                        class="ml-2 px-6 py-3 bg-black text-white font-bold border border-black hover:bg-gray-800 active:bg-gray-900 transition-colors duration-200 rounded-none">
                                    Applica
                                </button>
                            </div>
                            <div id="couponFeedback" class="text-sm mt-2"></div>
                            <div id="couponList" class="text-xs text-gray-500 mt-3" hidden>
                                <div class="font-medium mb-1">Codici disponibili:</div>
                                <div class="space-y-1" id="availableCoupons"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Method -->
                    <div class="border border-gray-200 rounded-none p-8 bg-white">
                        <div class="flex items-center mb-6">
                            <div class="w-8 h-8 bg-black text-white flex items-center justify-center font-bold rounded-sm mr-3">6</div>
                            <h2 class="text-2xl font-bold text-black">Metodo di Pagamento</h2>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="relative">
                                <input type="radio" name="payment_method" id="payment_stripe" value="stripe" checked 
                                       class="absolute opacity-0 h-0 w-0">
                                <label for="payment_stripe" 
                                       class="block border-2 border-black p-6 rounded-none cursor-pointer">
                                    <div class="flex justify-between items-center">
                                        <div class="flex items-center">
                                            <div class="w-6 h-6 border-2 border-black flex items-center justify-center mr-4">
                                                <div class="w-3 h-3 bg-black"></div>
                                            </div>
                                            <div>
                                                <div class="font-bold text-lg text-black">Carta di Credito/Debito</div>
                                                <div class="text-sm text-gray-600 mt-1">Pagamento sicuro con Stripe</div>
                                                <div class="flex space-x-2 mt-2">
                                                    <span class="text-xs bg-gray-100 px-2 py-1">Visa</span>
                                                    <span class="text-xs bg-gray-100 px-2 py-1">Mastercard</span>
                                                    <span class="text-xs bg-gray-100 px-2 py-1">Amex</span>
                                                </div>
                                            </div>
                                        </div>
                                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                        </svg>
                                    </div>
                                </label>
                            </div>

                            <div class="relative">
                                <input type="radio" name="payment_method" id="payment_paypal" value="paypal" 
                                       class="absolute opacity-0 h-0 w-0">
                                <label for="payment_paypal" 
                                       class="block border-2 border-gray-300 p-6 rounded-none cursor-pointer hover:border-gray-500 transition-colors duration-200">
                                    <div class="flex justify-between items-center">
                                        <div class="flex items-center">
                                            <div class="w-6 h-6 border-2 border-gray-400 flex items-center justify-center mr-4"></div>
                                            <div>
                                                <div class="font-bold text-lg text-black">PayPal</div>
                                                <div class="text-sm text-gray-600 mt-1">Paga con il tuo account PayPal</div>
                                            </div>
                                        </div>
                                        <svg class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.68H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-9.502H20.067zM7.293 2H4.892a.896.896 0 0 0-.884.788L2.35 17.048a.898.898 0 0 0 .884 1.003h2.917l.595-3.783.038-.194a.804.804 0 0 1 .794-.68h2.07c4.238 0 7.001-1.65 7.84-7.316.215-1.1.26-2.019.188-2.785H7.293z"/>
                                        </svg>
                                    </div>
                                </label>
                            </div>

                            <div class="text-sm text-gray-600 bg-gray-50 p-4 mt-4">
                                <p class="font-medium mb-1">I tuoi dati di pagamento sono protetti</p>
                                <p class="text-xs">Tutte le transazioni sono crittografate e sicure. Non memorizziamo i dati della tua carta.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="sticky bottom-0 bg-white pt-4 pb-8 border-t border-gray-200 mt-8">
                        <div class="flex justify-between items-center">
                            <a href="<?php echo e(route('cart.show')); ?>" 
                               class="text-black font-medium hover:underline flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                </svg>
                                Torna al carrello
                            </a>
                            <button type="button" onclick="proceedToPayment()" 
                                    id="submitBtn"
                                    class="px-12 py-4 bg-black text-white font-bold text-lg hover:bg-gray-800 active:bg-gray-900 transition-colors duration-200 rounded-none">
                                Procedi al Pagamento
                                <span id="totalAmountPreview" class="ml-2 text-gray-300">€0,00</span>
                            </button>
                        </div>
                        <div class="text-center text-sm text-gray-500 mt-4">
                            Cliccando su "Procedi al Pagamento", accetti i nostri 
                            <a href="#" class="text-black underline">Termini di Servizio</a> e 
                            <a href="#" class="text-black underline">Privacy Policy</a>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Right Column: Order Summary -->
            <div class="lg:col-span-1">
                <div class="border border-gray-200 rounded-none p-8 bg-white sticky top-8">
                    <h2 class="text-2xl font-bold text-black mb-6 pb-4 border-b border-gray-200">Riepilogo Ordine</h2>

                    <!-- Cart Items -->
                    <div id="orderSummary" class="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                        <div class="text-center py-8">
                            <div class="animate-pulse">
                                <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                                <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Order Summary -->
                    <div class="space-y-3 border-t border-gray-200 pt-6">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Subtotale</span>
                            <span id="subtotal" class="font-medium text-black">€0,00</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Spedizione</span>
                            <span id="shipping" class="font-medium text-black">€0,00</span>
                        </div>
                        <div class="flex justify-between text-sm" id="discountContainer" style="display: none;">
                            <span class="text-gray-600">Sconto</span>
                            <span id="discount" class="font-medium text-green-600">-€0,00</span>
                        </div>
                        
                        <div class="flex justify-between text-lg font-bold text-black pt-4 border-t border-gray-200 mt-2">
                            <span>Totale</span>
                            <span id="total">€0,00</span>
                        </div>
                        
                        <div class="text-xs text-gray-500 pt-2">
                            <div class="flex items-center">
                                <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                IVA inclusa
                            </div>
                        </div>
                    </div>

                    <!-- Trust Badges -->
                    <div class="mt-8 pt-6 border-t border-gray-200">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center">
                                <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                                <div class="text-xs text-gray-600">Pagamento Sicuro</div>
                            </div>
                            <div class="text-center">
                                <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                                <div class="text-xs text-gray-600">Garanzia 30 Giorni</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Stripe Modal -->
    <div id="stripeModal" class="hidden fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-none max-w-lg w-full p-8 relative">
            <button onclick="closeStripeModal()" 
                    class="absolute top-4 right-4 text-gray-500 hover:text-black">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl font-bold rounded-sm mx-auto mb-4">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-black mb-2">Pagamento Carta</h3>
                <p class="text-gray-600">Inserisci i dati della tua carta di credito o debito</p>
            </div>
            
            <div id="card-element" class="border border-gray-300 p-4 rounded-none mb-4"></div>
            <div id="card-errors" class="text-red-600 text-sm mb-4" role="alert"></div>
            
            <div class="flex space-x-4">
                <button type="button" id="stripeSubmit" onclick="submitStripePayment()" 
                        class="flex-1 bg-black text-white font-bold py-3 hover:bg-gray-800 transition-colors duration-200 rounded-none">
                    Paga <span id="stripeAmount">€0,00</span>
                </button>
                <button type="button" onclick="closeStripeModal()" 
                        class="flex-1 border border-gray-300 text-gray-700 font-bold py-3 hover:bg-gray-50 transition-colors duration-200 rounded-none">
                    Annulla
                </button>
            </div>
            
            <div class="text-xs text-gray-500 text-center mt-6">
                <p>Il pagamento è gestito in modo sicuro da Stripe. Non memorizziamo i dati della tua carta.</p>
            </div>
        </div>
    </div>

    <!-- PayPal Modal -->
    <div id="paypalModal" class="hidden fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-none max-w-lg w-full p-8 relative">
            <button onclick="closePayPalModal()" 
                    class="absolute top-4 right-4 text-gray-500 hover:text-black">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-blue-500 text-white flex items-center justify-center text-2xl font-bold rounded-sm mx-auto mb-4">
                    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.68H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-9.502H20.067zM7.293 2H4.892a.896.896 0 0 0-.884.788L2.35 17.048a.898.898 0 0 0 .884 1.003h2.917l.595-3.783.038-.194a.804.804 0 0 1 .794-.68h2.07c4.238 0 7.001-1.65 7.84-7.316.215-1.1.26-2.019.188-2.785H7.293z"/>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-black mb-2">Pagamento PayPal</h3>
                <p class="text-gray-600">Sarai reindirizzato a PayPal per completare il pagamento</p>
            </div>
            
            <div id="paypal-button-container" class="mb-4"></div>
            
            <button type="button" onclick="closePayPalModal()" 
                    class="w-full border border-gray-300 text-gray-700 font-bold py-3 hover:bg-gray-50 transition-colors duration-200 rounded-none">
                Annulla
            </button>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div class="text-center">
            <div class="w-16 h-16 border-4 border-white border-t-transparent animate-spin rounded-none mx-auto mb-4"></div>
            <p class="text-white text-lg font-medium">Elaborazione pagamento...</p>
            <p class="text-gray-300 text-sm mt-2">Non chiudere questa pagina</p>
        </div>
    </div>
</div>

<script src="https://js.stripe.com/v3/"></script>
<script src="https://www.paypal.com/sdk/js?client-id=<?php echo e(env('PAYPAL_CLIENT_ID')); ?>&currency=EUR"></script>

<script type="application/json" id="cart-data"><?php echo json_encode($cart ?? [], 15, 512) ?></script>
<script type="application/json" id="order-id"><?php echo json_encode($order->id ?? null, 15, 512) ?></script>
<script type="application/json" id="shipping-rules"><?php echo json_encode($shippingRules ?? [], 15, 512) ?></script>
<script type="application/json" id="user-data"><?php echo json_encode($user ?? [], 15, 512) ?></script>

<script>
let cart = JSON.parse(document.getElementById('cart-data').textContent || '[]');
let orderId = JSON.parse(document.getElementById('order-id').textContent || 'null');
let shippingRules = JSON.parse(document.getElementById('shipping-rules').textContent || '[]');
let userData = JSON.parse(document.getElementById('user-data').textContent || '{}');
let stripeClientSecret = null;
let stripe = null;
let elements = null;
let cardElement = null;
let currentTotal = 0;
let appliedDiscount = null;

// Hide navbar and footer
document.body.classList.add('checkout-page');

document.addEventListener('DOMContentLoaded', function() {
    loadCartSummary();
    loadActiveCoupons();
    initializeStripe();
    initializeEventListeners();
    updateTotalPreview();
});

function initializeEventListeners() {
    // Same as shipping checkbox
    const sameAsShipping = document.getElementById('sameAsShipping');
    if (sameAsShipping) {
        sameAsShipping.addEventListener('change', function() {
            const billingForm = document.getElementById('billingForm');
            if (this.checked) {
                billingForm.classList.add('hidden');
            } else {
                billingForm.classList.remove('hidden');
            }
        });
    }

    // Shipping method changes
    document.querySelectorAll('input[name="shipping_method"]').forEach((input) => {
        input.addEventListener('change', (e) => {
            // Update visual selection
            document.querySelectorAll('label[for^="shipping_"]').forEach(label => {
                label.classList.remove('border-black');
                label.classList.add('border-gray-300');
                const radioId = label.getAttribute('for');
                const radio = document.getElementById(radioId);
                const innerCircle = label.querySelector('.w-6.h-6');
                if (innerCircle) {
                    innerCircle.querySelector('.w-3.h-3')?.remove();
                }
            });
            
            const label = document.querySelector(`label[for="${e.target.id}"]`);
            if (label) {
                label.classList.remove('border-gray-300');
                label.classList.add('border-black');
                const innerCircle = label.querySelector('.w-6.h-6');
                if (innerCircle) {
                    const selectedDot = document.createElement('div');
                    selectedDot.className = 'w-3 h-3 bg-black';
                    innerCircle.appendChild(selectedDot);
                }
            }
            
            updateTotals(currentTotal);
        });
    });

    // Payment method changes
    document.querySelectorAll('input[name="payment_method"]').forEach((input) => {
        input.addEventListener('change', (e) => {
            document.querySelectorAll('label[for^="payment_"]').forEach(label => {
                label.classList.remove('border-black');
                label.classList.add('border-gray-300');
                const radioId = label.getAttribute('for');
                const radio = document.getElementById(radioId);
                const innerCircle = label.querySelector('.w-6.h-6');
                if (innerCircle) {
                    innerCircle.querySelector('.w-3.h-3')?.remove();
                }
            });
            
            const label = document.querySelector(`label[for="${e.target.id}"]`);
            if (label) {
                label.classList.remove('border-gray-300');
                label.classList.add('border-black');
                const innerCircle = label.querySelector('.w-6.h-6');
                if (innerCircle) {
                    const selectedDot = document.createElement('div');
                    selectedDot.className = 'w-3 h-3 bg-black';
                    innerCircle.appendChild(selectedDot);
                }
            }
        });
    });

    // Discount code
    const applyDiscountBtn = document.getElementById('applyDiscount');
    const discountCodeInput = document.getElementById('discountCode');
    
    if (applyDiscountBtn) {
        applyDiscountBtn.addEventListener('click', applyDiscount);
    }
    
    if (discountCodeInput) {
        discountCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyDiscount();
            }
        });
    }
}

function loadCartSummary() {
    const summaryContainer = document.getElementById('orderSummary');
    let subtotal = 0;
    summaryContainer.innerHTML = '';

    if (cart.length === 0) {
        summaryContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500">Il carrello è vuoto</p>
                <a href="<?php echo e(route('products')); ?>" class="text-black underline text-sm mt-2 inline-block">Continua lo shopping</a>
            </div>
        `;
        currentTotal = 0;
        updateTotals(0);
        return;
    }

    cart.forEach(item => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        subtotal += itemTotal;
        
        // Costruisci l'URL completo dell'immagine
        const imageUrl = item.image ? (item.image.startsWith('http') ? item.image : `/storage/${item.image}`) : null;
        
        const html = `
            <div class="flex items-center justify-between py-3 border-b border-gray-100">
                <div class="flex items-center">
                    <div class="w-12 h-12 bg-gray-100 flex items-center justify-center mr-3">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" class="w-full h-full object-cover">` : 
                          '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'}
                    </div>
                    <div>
                        <div class="font-medium text-black">${item.name}</div>
                        <div class="text-sm text-gray-500">Quantità: ${item.quantity}</div>
                    </div>
                </div>
                <div class="font-medium text-black">€${itemTotal.toFixed(2)}</div>
            </div>
        `;
        summaryContainer.innerHTML += html;
    });

    currentTotal = subtotal;
    updateTotals(subtotal);
}

async function loadActiveCoupons() {
    try {
        const response = await fetch('/api/coupons/active');
        if (response.ok) {
            const data = await response.json();
            const availableCoupons = document.getElementById('availableCoupons');
            if (availableCoupons && data.coupons && data.coupons.length > 0) {
                availableCoupons.innerHTML = data.coupons.map(coupon => 
                    `<div class="flex justify-between items-center">
                        <span class="font-mono">${coupon.code}</span>
                        <span class="text-green-600">-${coupon.discount_percent}%</span>
                    </div>`
                ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading coupons:', error);
    }
}

async function applyDiscount() {
    const codeInput = document.getElementById('discountCode');
    const feedback = document.getElementById('couponFeedback');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code) {
        feedback.innerHTML = '<span class="text-red-600">Inserisci un codice sconto</span>';
        return;
    }
    
    try {
        const response = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '<?php echo e(csrf_token()); ?>'
            },
            body: JSON.stringify({ code: code })
        });
        
        const data = await response.json();
        
        if (data.valid) {
            appliedDiscount = {
                code: code,
                amount: data.discount_amount,
                type: data.discount_type
            };
            feedback.innerHTML = `<span class="text-green-600">✓ Codice sconto applicato: -€${data.discount_amount.toFixed(2)}</span>`;
            updateTotals(currentTotal);
        } else {
            feedback.innerHTML = `<span class="text-red-600">${data.message || 'Codice non valido'}</span>`;
            appliedDiscount = null;
            updateTotals(currentTotal);
        }
    } catch (error) {
        feedback.innerHTML = '<span class="text-red-600">Errore di connessione</span>';
    }
}

function getSelectedShipping() {
    const selected = document.querySelector('input[name="shipping_method"]:checked');
    return selected ? selected.value : (shippingRules.length > 0 ? shippingRules[0].type : 'standard');
}

function calculateShipping(method) {
    const rule = shippingRules.find(r => r.type === method);
    if (!rule) return 0;
    return parseFloat(rule.base_cost);
}

function calculateDiscount(subtotal, shipping) {
    if (!appliedDiscount) return 0;
    
    if (appliedDiscount.type === 'percentage') {
        return (subtotal * appliedDiscount.amount) / 100;
    } else {
        return Math.min(appliedDiscount.amount, subtotal + shipping);
    }
}

function updateTotals(subtotal) {
    const shipping = calculateShipping(getSelectedShipping());
    const discount = calculateDiscount(subtotal, shipping);
    const total = Math.max(0, subtotal + shipping - discount);

    // Update display
    document.getElementById('subtotal').textContent = '€' + subtotal.toFixed(2).replace('.', ',');
    document.getElementById('shipping').textContent = '€' + shipping.toFixed(2).replace('.', ',');
    
    if (discount > 0) {
        document.getElementById('discountContainer').style.display = 'flex';
        document.getElementById('discount').textContent = '-€' + discount.toFixed(2).replace('.', ',');
    } else {
        document.getElementById('discountContainer').style.display = 'none';
    }
    
    document.getElementById('total').textContent = '€' + total.toFixed(2).replace('.', ',');
    
    // Update stripe modal amount
    const stripeAmount = document.getElementById('stripeAmount');
    if (stripeAmount) {
        stripeAmount.textContent = '€' + total.toFixed(2).replace('.', ',');
    }
    
    // Update button preview
    updateTotalPreview();
}

function updateTotalPreview() {
    const total = parseFloat(document.getElementById('total').textContent.replace('€', '').replace(',', '.'));
    const preview = document.getElementById('totalAmountPreview');
    if (preview) {
        preview.textContent = '€' + total.toFixed(2).replace('.', ',');
    }
}

function initializeStripe() {
    stripe = Stripe('<?php echo e(env("STRIPE_PUBLIC_KEY")); ?>');
    elements = stripe.elements();
    
    const style = {
        base: {
            color: '#000000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#888888'
            }
        },
        invalid: {
            color: '#dc2626',
            iconColor: '#dc2626'
        }
    };
    
    cardElement = elements.create('card', { style: style });
}

async function validateForm() {
    const form = document.getElementById('checkoutForm');
    let isValid = true;
    let firstInvalidField = null;
    
    // Get all required fields
    const requiredFields = [
        { name: 'customer_first_name', label: 'Nome' },
        { name: 'customer_last_name', label: 'Cognome' },
        { name: 'customer_email', label: 'Email' },
        { name: 'shipping_address', label: 'Indirizzo di spedizione' },
        { name: 'shipping_city', label: 'Città' },
        { name: 'shipping_zip', label: 'CAP' },
        { name: 'shipping_country', label: 'Paese' },
        { name: 'shipping_method', label: 'Metodo di spedizione' },
    ];
    
    // Validate each field
    requiredFields.forEach(field => {
        const fieldElement = form.querySelector(`[name="${field.name}"]`);
        if (!fieldElement) return;
        
        const value = fieldElement.value ? fieldElement.value.trim() : '';
        
        if (!value) {
            isValid = false;
            fieldElement.classList.add('border-red-500', 'bg-red-50');
            if (!firstInvalidField) firstInvalidField = fieldElement;
        } else {
            fieldElement.classList.remove('border-red-500', 'bg-red-50');
        }
    });
    
    // Validate email format
    const emailField = form.querySelector('[name="customer_email"]');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            isValid = false;
            emailField.classList.add('border-red-500', 'bg-red-50');
            if (!firstInvalidField) firstInvalidField = emailField;
            showNotification('Inserisci un indirizzo email valido', 'error');
            return false;
        }
    }
    
    if (!isValid) {
        if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showNotification('Compila tutti i campi obbligatori (contrassegnati con *)', 'error');
        return false;
    }
    
    return true;
}

async function proceedToPayment() {
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = `
        <span class="inline-block animate-spin mr-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
        </span>
        Elaborazione...
    `;
    submitBtn.disabled = true;
    
    // Validate form
    if (!await validateForm()) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }
    
    try {
        // Save checkout data first
        const saveData = await saveCheckoutData();
        
        if (!saveData.success) {
            throw new Error(saveData.message || 'Errore nel salvataggio dell\'ordine');
        }
        
        // Get payment method
        const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
        
        // Show appropriate payment modal
        if (paymentMethod === 'stripe') {
            showStripeModal();
        } else if (paymentMethod === 'paypal') {
            showPayPalModal();
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification(error.message || 'Si è verificato un errore', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-none z-50 ${type === 'error' ? 'bg-red-600' : 'bg-black'} text-white font-medium`;
    notification.textContent = message;
    notification.style.minWidth = '300px';
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

async function saveCheckoutData() {
    const form = document.getElementById('checkoutForm');
    const formData = new FormData(form);
    
    const payload = Object.fromEntries(formData.entries());
    payload.shipping_method = getSelectedShipping();
    payload.order_id = orderId;
    
    if (document.getElementById('sameAsShipping').checked) {
        payload.billing_address = payload.shipping_address;
        payload.billing_city = payload.shipping_city;
        payload.billing_zip = payload.shipping_zip;
        payload.billing_country = payload.shipping_country;
    }
    
    if (appliedDiscount) {
        payload.discount_code = appliedDiscount.code;
    }
    
    try {
        const response = await fetch('<?php echo e(route("checkout.create")); ?>', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': '<?php echo e(csrf_token()); ?>',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        const data = await response.json();
        
        if (data.order_id) {
            orderId = data.order_id;
        }
        
        return data;
        
    } catch (error) {
        throw new Error('Errore di connessione al server');
    }
}

function showStripeModal() {
    const modal = document.getElementById('stripeModal');
    modal.classList.remove('hidden');
    
    // Mount card element if not already mounted
    setTimeout(() => {
        if (!cardElement._component) {
            cardElement.mount('#card-element');
        }
        
        // Clear any previous errors
        document.getElementById('card-errors').textContent = '';
    }, 100);
    
    // Listen for card errors
    cardElement.on('change', (event) => {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
}

function closeStripeModal() {
    document.getElementById('stripeModal').classList.add('hidden');
}

function showPayPalModal() {
    const modal = document.getElementById('paypalModal');
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        initializePayPal();
    }, 100);
}

function closePayPalModal() {
    document.getElementById('paypalModal').classList.add('hidden');
    const container = document.getElementById('paypal-button-container');
    container.innerHTML = '';
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

async function submitStripePayment() {
    const submitBtn = document.getElementById('stripeSubmit');
    const originalText = submitBtn.innerHTML;
    
    // Show loading
    submitBtn.innerHTML = 'Elaborazione...';
    submitBtn.disabled = true;
    showLoading();
    
    try {
        // Get client secret
        const response = await fetch('<?php echo e(route("payment.stripe.checkout")); ?>', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': '<?php echo e(csrf_token()); ?>',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order_id: orderId }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Errore nella creazione del pagamento');
        }
        
        // Confirm payment with card
        const { paymentIntent, error } = await stripe.confirmCardPayment(data.clientSecret, {
            payment_method: {
                card: cardElement,
            }
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        if (paymentIntent.status === 'succeeded') {
            // Redirect to success page
            window.location.href = '<?php echo e(route("checkout.success", ["order" => ":order"])); ?>'.replace(':order', orderId);
        }
        
    } catch (error) {
        console.error('Stripe error:', error);
        showNotification(error.message || 'Errore nel pagamento', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        hideLoading();
    }
}

function initializePayPal() {
    const container = document.getElementById('paypal-button-container');
    container.innerHTML = '';
    
    const total = parseFloat(document.getElementById('total').textContent.replace('€', '').replace(',', '.'));
    
    paypal.Buttons({
        style: {
            shape: 'rect',
            color: 'black',
            layout: 'vertical',
            label: 'pay',
            height: 50
        },
        
        createOrder: (data, actions) => {
            return fetch('<?php echo e(route("payment.paypal.checkout")); ?>', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '<?php echo e(csrf_token()); ?>',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    order_id: orderId,
                    amount: total 
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    throw new Error(data.message);
                }
                return data.orderId;
            });
        },
        
        onApprove: (data, actions) => {
            showLoading();
            
            return fetch('<?php echo e(route("payment.paypal.capture")); ?>', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '<?php echo e(csrf_token()); ?>',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: data.orderID,
                    local_order_id: orderId,
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '<?php echo e(route("checkout.success", ["order" => ":order"])); ?>'.replace(':order', orderId);
                } else {
                    throw new Error(data.message || 'Errore nel completamento del pagamento');
                }
            })
            .catch(error => {
                hideLoading();
                showNotification(error.message, 'error');
            });
        },
        
        onError: (err) => {
            console.error('PayPal Error:', err);
            showNotification('Errore PayPal: ' + err.message, 'error');
        },
        
        onCancel: () => {
            showNotification('Pagamento annullato', 'info');
        }
        
    }).render('#paypal-button-container');
}
</script>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/checkout/index.blade.php ENDPATH**/ ?>