<?php $__env->startSection('content'); ?>
<div class="min-h-screen" style="background-color: <?php echo e($theme['background'] ?? '#f9fafb'); ?>;">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <!-- Header -->
        <div class="mb-8">
            <a href="<?php echo e(route('customer.addresses')); ?>" class="text-sm font-medium hover:opacity-80 mb-4 inline-block" style="color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                ← Torna agli indirizzi
            </a>
            <h1 class="text-3xl font-bold" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                Modifica Indirizzo
            </h1>
        </div>

        <!-- Alert Messages -->
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($errors->any()): ?>
            <div class="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
                <ul class="text-sm text-red-800 list-disc list-inside">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $errors->all(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $error): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <li><?php echo e($error); ?></li>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </ul>
            </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

        <form method="POST" action="<?php echo e(route('customer.addresses.update', $address)); ?>" class="bg-white rounded-lg shadow p-6">
            <?php echo csrf_field(); ?>

            <!-- Type Selection -->
            <div class="mb-6">
                <label class="block text-sm font-medium mb-3" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                    Tipo di Indirizzo <span class="text-red-600">*</span>
                </label>
                <div class="flex gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="type" value="shipping" <?php echo e($address->type === 'shipping' ? 'checked' : ''); ?> class="w-4 h-4">
                        <span>Spedizione</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="type" value="billing" <?php echo e($address->type === 'billing' ? 'checked' : ''); ?> class="w-4 h-4">
                        <span>Fatturazione</span>
                    </label>
                </div>
            </div>

            <div class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                        Nome <span class="text-red-600">*</span>
                    </label>
                    <input type="text" name="name" value="<?php echo e(old('name', $address->name)); ?>" required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                        style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                    >
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                            Telefono <span class="text-red-600">*</span>
                        </label>
                        <input type="tel" name="phone" value="<?php echo e(old('phone', $address->phone)); ?>" required
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                            style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                            Email <span class="text-red-600">*</span>
                        </label>
                        <input type="email" name="email" value="<?php echo e(old('email', $address->email)); ?>" required
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                            style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                        >
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                        Azienda
                    </label>
                    <input type="text" name="company" value="<?php echo e(old('company', $address->company)); ?>"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                        style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                        Indirizzo <span class="text-red-600">*</span>
                    </label>
                    <input type="text" name="address" value="<?php echo e(old('address', $address->address)); ?>" required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                        style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                    >
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                            Città <span class="text-red-600">*</span>
                        </label>
                        <input type="text" name="city" value="<?php echo e(old('city', $address->city)); ?>" required
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                            style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                            Provincia
                        </label>
                        <input type="text" name="province" value="<?php echo e(old('province', $address->province)); ?>"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                            style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                        >
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                            Codice Postale <span class="text-red-600">*</span>
                        </label>
                        <input type="text" name="postal_code" value="<?php echo e(old('postal_code', $address->postal_code)); ?>" required
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                            style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                            Paese <span class="text-red-600">*</span>
                        </label>
                        <input type="text" name="country" value="<?php echo e(old('country', $address->country)); ?>" required
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                            style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                            maxlength="2"
                        >
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                        Codice Fiscale / P. IVA
                    </label>
                    <input type="text" name="tax_id" value="<?php echo e(old('tax_id', $address->tax_id)); ?>"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                        style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                    >
                </div>

                <label class="flex items-center gap-3 cursor-pointer pt-2">
                    <input type="checkbox" name="is_default" value="1" <?php echo e($address->is_default ? 'checked' : ''); ?> class="w-4 h-4 rounded"
                        style="color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                    >
                    <span class="text-sm font-medium">Imposta come indirizzo predefinito</span>
                </label>
            </div>

            <!-- Submit -->
            <div class="flex gap-3">
                <button type="submit" class="flex-1 py-3 px-4 rounded-lg font-medium text-white transition hover:opacity-90" 
                    style="background-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                    Salva Modifiche
                </button>
                <a href="<?php echo e(route('customer.addresses')); ?>" class="flex-1 py-3 px-4 rounded-lg font-medium text-center border transition hover:bg-gray-50" 
                    style="border-color: <?php echo e($theme['border'] ?? '#e5e7eb'); ?>; color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                    Annulla
                </a>
            </div>
        </form>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/customer/addresses/edit.blade.php ENDPATH**/ ?>