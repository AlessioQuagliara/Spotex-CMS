<?php $__env->startSection('content'); ?>
<div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-16">
        <h1 class="text-4xl font-bold text-[#010f20] mb-12">Carrello</h1>

        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($cart)): ?>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Articoli Carrello -->
                <div class="lg:col-span-2 space-y-4">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $cart; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $productId => $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="bg-white rounded-lg shadow p-4 flex gap-4">
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($item['image']): ?>
                                <img src="<?php echo e(asset('storage/' . $item['image'])); ?>" alt="<?php echo e($item['name']); ?>"
                                     class="w-24 h-24 object-cover rounded">
                            <?php else: ?>
                                <div class="w-24 h-24 bg-gray-300 rounded flex items-center justify-center">
                                    <span class="text-gray-500">No Image</span>
                                </div>
                            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

                            <div class="flex-1">
                                <h3 class="font-bold text-lg text-[#010f20]"><?php echo e($item['name']); ?></h3>
                                <p class="text-gray-600">€<?php echo e(number_format($item['price'], 2, ',', '.')); ?></p>

                                <div class="mt-4 flex items-center gap-2">
                                    <input type="number" value="<?php echo e($item['quantity']); ?>" 
                                       data-product-id="<?php echo e($productId); ?>"
                                       class="js-qty-input w-12 text-center border border-gray-300 rounded">
                                    <button data-product-id="<?php echo e($productId); ?>" data-delta="1"
                                        class="js-qty-change bg-gray-300 px-3 py-1 rounded hover:bg-gray-400">Pulisci</button>
                                    <button data-product-id="<?php echo e($productId); ?>"
                                        class="js-remove-item ml-auto text-red-600 hover:text-red-800 font-semibold">Rimuovi</button>
                                </div>
                            </div>

                            <div class="text-right">
                                <p class="text-lg font-bold text-[#010f20]">
                                    €<?php echo e(number_format($item['price'] * $item['quantity'], 2, ',', '.')); ?>

                                </p>
                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </div>

                <!-- Riepilogo -->
                <div class="bg-white rounded-lg shadow p-6 h-fit sticky top-4">
                    <h2 class="text-2xl font-bold text-[#010f20] mb-6">Riepilogo</h2>

                    <div class="space-y-2 mb-6 border-b pb-4">
                        <?php
                            $subtotal = array_reduce($cart, fn($total, $item) => $total + ($item['price'] * $item['quantity']), 0);
                        ?>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotale</span>
                            <span class="font-semibold">€<?php echo e(number_format($subtotal, 2, ',', '.')); ?></span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Spedizione</span>
                            <span class="font-semibold">Da calcolare</span>
                        </div>
                    </div>

                    <div class="flex justify-between text-lg font-bold text-[#010f20] mb-2">
                        <span>Totale provvisorio</span>
                        <span>€<?php echo e(number_format($subtotal, 2, ',', '.')); ?></span>
                    </div>
                    <p class="text-xs text-gray-500 mb-6">Il costo di spedizione verrà calcolato al checkout.</p>

                    <a href="<?php echo e(route('checkout.index')); ?>" 
                       class="w-full bg-[#010f20] text-white font-bold py-3 rounded hover:bg-blue-900 transition block text-center">
                        Procedi al Checkout
                    </a>

                    <a href="<?php echo e(route('products')); ?>" class="text-blue-600 text-sm mt-4 inline-block hover:underline">
                        Continua Shopping
                    </a>
                </div>
            </div>
        <?php else: ?>
            <div class="bg-white rounded-lg shadow p-12 text-center">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1h7.586a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM15 16a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Carrello Vuoto</h2>
                <p class="text-gray-600 mb-6">Il tuo carrello non contiene ancora prodotti</p>
                <a href="<?php echo e(route('products')); ?>" 
                   class="inline-block bg-[#010f20] text-white font-bold py-3 px-8 rounded hover:bg-blue-900 transition">
                    Inizia a Fare Shopping
                </a>
            </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>
</div>

<script>
document.querySelectorAll('.js-qty-change').forEach(button => {
    button.addEventListener('click', () => {
        const productId = button.dataset.productId;
        const delta = parseInt(button.dataset.delta, 10);
        updateQuantity(productId, delta);
    });
});

document.querySelectorAll('.js-qty-input').forEach(input => {
    input.addEventListener('change', () => {
        const productId = input.dataset.productId;
        updateQuantity(productId, 0, input.value);
    });
});

document.querySelectorAll('.js-remove-item').forEach(button => {
    button.addEventListener('click', () => {
        const productId = button.dataset.productId;
        removeItem(productId);
    });
});

function updateQuantity(productId, change, newValue = null) {
    const quantity = newValue ? parseInt(newValue) : change;
    
    fetch('<?php echo e(route("cart.update")); ?>', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': '<?php echo e(csrf_token()); ?>',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: newValue ? parseInt(newValue) : quantity,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    })
    .catch(error => console.error('Error:', error));
}

function removeItem(productId) {
    if (confirm('Sei sicuro di voler rimuovere questo articolo?')) {
        fetch('<?php echo e(route("cart.remove")); ?>', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': '<?php echo e(csrf_token()); ?>',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            }
        })
        .catch(error => console.error('Error:', error));
    }
}
</script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/cart/show.blade.php ENDPATH**/ ?>