<?php $__env->startSection('content'); ?>
<div class="min-h-screen" style="background-color: <?php echo e($theme['background'] ?? '#f9fafb'); ?>;">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Header -->
        <div class="mb-8">
            <a href="<?php echo e(route('customer.dashboard')); ?>" class="text-sm font-medium hover:opacity-80 mb-4 inline-block" style="color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                ← Torna alla dashboard
            </a>
            <h1 class="text-3xl font-bold" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                I miei Indirizzi
            </h1>
        </div>

        <!-- Alert Messages -->
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('success')): ?>
            <div class="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
                <p class="text-sm text-green-800"><?php echo e(session('success')); ?></p>
            </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

        <!-- Add Address Button -->
        <div class="mb-8">
            <a href="<?php echo e(route('customer.addresses.create')); ?>" class="inline-block py-3 px-6 rounded-lg font-medium text-white transition hover:opacity-90" 
                style="background-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                + Aggiungi Nuovo Indirizzo
            </a>
        </div>

        <!-- Shipping Addresses -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">Indirizzi di Spedizione</h2>
            
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($shippingAddresses->count() > 0): ?>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $shippingAddresses; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $address): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="bg-white rounded-lg shadow p-6 border-l-4" style="border-left-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="font-semibold text-lg"><?php echo e($address->name); ?></h3>
                                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($address->company): ?>
                                        <p class="text-sm text-gray-600"><?php echo e($address->company); ?></p>
                                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                </div>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($address->is_default): ?>
                                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Default</span>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </div>

                            <div class="text-sm text-gray-700 space-y-1 mb-4">
                                <p><?php echo e($address->address); ?></p>
                                <p><?php echo e($address->postal_code); ?> <?php echo e($address->city); ?></p>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($address->province): ?>
                                    <p><?php echo e($address->province); ?></p>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                <p><?php echo e($address->country); ?></p>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($address->phone): ?>
                                    <p class="pt-2"><strong>Tel:</strong> <?php echo e($address->phone); ?></p>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </div>

                            <div class="flex gap-2 pt-4 border-t">
                                <a href="<?php echo e(route('customer.addresses.edit', $address)); ?>" class="flex-1 text-center py-2 px-3 rounded text-sm font-medium transition hover:opacity-80" 
                                    style="background-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; color: white;">
                                    Modifica
                                </a>
                                <form method="POST" action="<?php echo e(route('customer.addresses.destroy', $address)); ?>" class="flex-1" onsubmit="return confirm('Sei sicuro di voler eliminare questo indirizzo?');">
                                    <?php echo csrf_field(); ?>
                                    <?php echo method_field('DELETE'); ?>
                                    <button type="submit" class="w-full py-2 px-3 rounded text-sm font-medium text-red-600 border border-red-300 transition hover:bg-red-50">
                                        Elimina
                                    </button>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </div>
            <?php else: ?>
                <div class="bg-gray-50 rounded-lg p-8 text-center">
                    <p class="text-gray-600 mb-4">Non hai ancora aggiunto un indirizzo di spedizione</p>
                    <a href="<?php echo e(route('customer.addresses.create')); ?>" class="inline-block font-medium hover:opacity-80" style="color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                        Aggiungi il tuo primo indirizzo →
                    </a>
                </div>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </div>

        <!-- Billing Addresses -->
        <div>
            <h2 class="text-2xl font-bold mb-4" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">Indirizzi di Fatturazione</h2>
            
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($billingAddresses->count() > 0): ?>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $billingAddresses; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $address): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="bg-white rounded-lg shadow p-6 border-l-4" style="border-left-color: #f59e0b;">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="font-semibold text-lg"><?php echo e($address->name); ?></h3>
                                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($address->company): ?>
                                        <p class="text-sm text-gray-600"><?php echo e($address->company); ?></p>
                                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($address->tax_id): ?>
                                        <p class="text-sm text-gray-600"><strong>P. IVA:</strong> <?php echo e($address->tax_id); ?></p>
                                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                </div>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($address->is_default): ?>
                                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Default</span>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </div>

                            <div class="text-sm text-gray-700 space-y-1 mb-4">
                                <p><?php echo e($address->address); ?></p>
                                <p><?php echo e($address->postal_code); ?> <?php echo e($address->city); ?></p>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($address->province): ?>
                                    <p><?php echo e($address->province); ?></p>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                <p><?php echo e($address->country); ?></p>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($address->email): ?>
                                    <p class="pt-2"><strong>Email:</strong> <?php echo e($address->email); ?></p>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </div>

                            <div class="flex gap-2 pt-4 border-t">
                                <a href="<?php echo e(route('customer.addresses.edit', $address)); ?>" class="flex-1 text-center py-2 px-3 rounded text-sm font-medium transition hover:opacity-80" 
                                    style="background-color: #f59e0b; color: white;">
                                    Modifica
                                </a>
                                <form method="POST" action="<?php echo e(route('customer.addresses.destroy', $address)); ?>" class="flex-1" onsubmit="return confirm('Sei sicuro di voler eliminare questo indirizzo?');">
                                    <?php echo csrf_field(); ?>
                                    <?php echo method_field('DELETE'); ?>
                                    <button type="submit" class="w-full py-2 px-3 rounded text-sm font-medium text-red-600 border border-red-300 transition hover:bg-red-50">
                                        Elimina
                                    </button>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </div>
            <?php else: ?>
                <div class="bg-gray-50 rounded-lg p-8 text-center">
                    <p class="text-gray-600 mb-4">Non hai ancora aggiunto un indirizzo di fatturazione</p>
                    <a href="<?php echo e(route('customer.addresses.create')); ?>" class="inline-block font-medium hover:opacity-80" style="color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                        Aggiungi il tuo primo indirizzo →
                    </a>
                </div>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/customer/addresses/index.blade.php ENDPATH**/ ?>