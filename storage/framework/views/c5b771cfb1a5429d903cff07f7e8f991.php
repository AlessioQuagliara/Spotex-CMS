<?php $__env->startSection('content'); ?>
<div class="min-h-screen" style="background-color: <?php echo e($theme['background'] ?? '#f9fafb'); ?>;">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <!-- Header -->
        <div class="mb-8">
            <a href="<?php echo e(route('customer.dashboard')); ?>" class="text-sm font-medium hover:opacity-80 mb-4 inline-block" style="color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                ← Torna alla dashboard
            </a>
            <h1 class="text-3xl font-bold" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                Il mio Profilo
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

        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('success')): ?>
            <div class="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
                <p class="text-sm text-green-800"><?php echo e(session('success')); ?></p>
            </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

        <!-- Profile Form -->
        <form method="POST" action="<?php echo e(route('customer.profile.update')); ?>" class="bg-white rounded-lg shadow p-6 mb-6">
            <?php echo csrf_field(); ?>

            <h2 class="text-xl font-semibold mb-6" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">Informazioni Personali</h2>

            <div class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                        Nome Completo
                    </label>
                    <input type="text" name="name" value="<?php echo e(old('name', $user->name)); ?>" 
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                        style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                        required
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                        Email
                    </label>
                    <input type="email" name="email" value="<?php echo e(old('email', $user->email)); ?>" 
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                        style="focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:border-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                        required
                    >
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
                    <strong>Email verificata:</strong>
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($user->hasVerifiedEmail()): ?>
                        <span class="text-green-600">✓ Sì</span>
                    <?php else: ?>
                        <span class="text-yellow-600">⚠ No - Controlla la tua casella di posta</span>
                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </div>
            </div>

            <button type="submit" class="w-full py-3 px-4 rounded-lg font-medium text-white transition hover:opacity-90" 
                style="background-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                Salva Modifiche
            </button>
        </form>

        <!-- Account Info -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-semibold mb-6" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">Informazioni Account</h2>

            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Account creato:</span>
                    <strong><?php echo e($user->created_at->format('d/m/Y H:i')); ?></strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Ultimo accesso:</span>
                    <strong><?php echo e($user->last_login_at?->format('d/m/Y H:i') ?? 'Primo accesso'); ?></strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Totale ordini:</span>
                    <strong><?php echo e($user->orders()->count()); ?></strong>
                </div>
            </div>
        </div>

        <!-- Navigation -->
        <div class="flex gap-3">
            <a href="<?php echo e(route('customer.addresses')); ?>" class="flex-1 py-3 px-4 rounded-lg font-medium text-center border transition hover:bg-gray-50" 
                style="border-color: <?php echo e($theme['border'] ?? '#e5e7eb'); ?>; color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                I miei Indirizzi
            </a>
            <a href="<?php echo e(route('customer.orders')); ?>" class="flex-1 py-3 px-4 rounded-lg font-medium text-center border transition hover:bg-gray-50" 
                style="border-color: <?php echo e($theme['border'] ?? '#e5e7eb'); ?>; color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                I miei Ordini
            </a>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/customer/profile.blade.php ENDPATH**/ ?>