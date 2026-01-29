<?php $__env->startSection('content'); ?>
<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style="background-color: <?php echo e($theme['background'] ?? '#f9fafb'); ?>;">
    <div class="max-w-md w-full space-y-8">
        <div class="text-center">
            <svg class="mx-auto h-16 w-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            
            <h2 class="mt-6 text-center text-3xl font-extrabold" style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>;">
                Verifica la tua email
            </h2>
            
            <p class="mt-2 text-center text-sm" style="color: <?php echo e($theme['muted'] ?? '#6b7280'); ?>;">
                Grazie per esserti registrato! Prima di iniziare, potresti verificare il tuo indirizzo email cliccando sul link che ti abbiamo appena inviato via email? Se non hai ricevuto l'email, saremo felici di inviartene un'altra.
            </p>
        </div>

        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('success')): ?>
            <div class="rounded-md bg-green-50 p-4 border border-green-200">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-green-800"><?php echo e(session('success')); ?></p>
                    </div>
                </div>
            </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

        <div class="space-y-4">
            <form method="POST" action="<?php echo e(route('verification.send')); ?>">
                <?php echo csrf_field(); ?>
                <button 
                    type="submit" 
                    class="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition"
                    style="background-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>; focus:ring-color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;"
                >
                    Invia nuovamente email di verifica
                </button>
            </form>

            <form method="POST" action="<?php echo e(route('logout')); ?>">
                <?php echo csrf_field(); ?>
                <button 
                    type="submit" 
                    class="w-full flex justify-center py-3 px-4 border text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition"
                    style="color: <?php echo e($theme['text'] ?? '#1f2937'); ?>; border-color: <?php echo e($theme['border'] ?? '#e5e7eb'); ?>;"
                >
                    Logout
                </button>
            </form>
        </div>

        <div class="text-center">
            <a href="<?php echo e(route('home')); ?>" class="text-sm font-medium hover:opacity-80" style="color: <?php echo e($theme['primary'] ?? '#3b82f6'); ?>;">
                ← Torna alla home
            </a>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/auth/verify-email.blade.php ENDPATH**/ ?>