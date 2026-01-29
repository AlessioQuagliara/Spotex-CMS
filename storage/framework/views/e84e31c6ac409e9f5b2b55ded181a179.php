<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4" wire:key="theme-selector">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-12">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h1 class="text-4xl font-bold text-gray-900 mb-2">Seleziona il tema del sito</h1>
                    <p class="text-lg text-gray-600">Scegli il design che preferisci e visualizza l'anteprima della homepage</p>
                </div>
                <a href="<?php echo e(route('filament.admin.pages.settings')); ?>" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition" style="background-color: #111827; color: white;" onmouseover="this.style.backgroundColor='#0b1220'" onmouseout="this.style.backgroundColor='#111827'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Torna alle impostazioni
                </a>
            </div>
        </div>

        <!-- Themes Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $themes; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $theme): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <div
                    class="rounded-2xl overflow-hidden border-2 transition-all duration-300 flex flex-col bg-white dark:bg-gray-900
                        <?php echo e($selectedTheme === $theme['id'] 
                            ? 'border-blue-600 shadow-2xl' 
                            : 'border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-400 hover:shadow-md'); ?>"
                >
                    <!-- Card Header con colori -->
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            <?php echo e($theme['name']); ?>

                        </h3>
                        
                        <p class="text-gray-600 dark:text-gray-300 mb-4 min-h-12">
                            <?php echo e($theme['description']); ?>

                        </p>

                        <!-- Colors Preview -->
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($theme['colors'])): ?>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Colori:</span>
                                <div class="flex gap-1">
                                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = array_slice($theme['colors'], 0, 4); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $colorKey => $colorValue): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(is_string($colorValue)): ?>
                                            <div
                                                class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm hover:scale-110 transition"
                                                style="background-color: <?php echo e($colorValue); ?>"
                                                title="<?php echo e($colorKey); ?>"
                                            ></div>
                                        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                </div>
                            </div>
                        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </div>

                    <!-- Card Actions -->
                    <div class="p-6 flex flex-col gap-3">
                        <button
                            type="button"
                            wire:click="selectTheme('<?php echo e($theme['id']); ?>')"
                            class="w-full py-2 px-4 rounded-lg font-medium transition duration-200"
                            style="<?php echo e($selectedTheme === $theme['id']
                                ? 'background-color: #2563eb; color: white;'
                                : 'background-color: #dbeafe; color: #2563eb;'); ?>"
                            onmouseover="this.style.opacity='0.9'"
                            onmouseout="this.style.opacity='1'"
                        >
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($selectedTheme === $theme['id']): ?>
                                ✓ Selezionato
                            <?php else: ?>
                                Seleziona
                            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        </button>

                        <button
                            type="button"
                            wire:click="openPreview('<?php echo e($theme['id']); ?>')"
                            class="w-full py-2 px-4 rounded-lg font-medium transition duration-200"
                            style="background-color: #f3f4f6; color: #111827;"
                            onmouseover="this.style.backgroundColor='#e5e7eb'"
                            onmouseout="this.style.backgroundColor='#f3f4f6'"
                        >
                            👁️ Anteprima
                        </button>
                    </div>
                </div>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </div>
    </div>

    <!-- Modal Anteprima -->
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($showPreviewModal !== null && !empty($showPreviewModal)): ?>
        <?php
            $previewData = collect($themes)->firstWhere('id', $showPreviewModal);
        ?>
        
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($previewData): ?>
            <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity" wire:key="modal-<?php echo e($showPreviewModal); ?>">
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <!-- Modal Header -->
                    <div class="bg-gray-900 text-white px-8 py-4 flex items-center justify-between">
                        <h2 class="text-2xl font-bold">Anteprima: <?php echo e($previewData['name']); ?></h2>
                        <button
                            type="button"
                            wire:click="closePreview()"
                            class="text-white hover:text-gray-300 transition"
                            style="color: #ffffff;"
                        >
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Modal Content -->
                    <div class="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                        <iframe
                            x-init="$el.srcdoc = `<!doctype html><html lang='it'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>` +
                                `<script src='https://cdn.tailwindcss.com'></script>` +
                                `</head><body class='bg-white'>` + <?php echo \Illuminate\Support\Js::from($previewData['html_content'])->toHtml() ?> + `</body></html>`"
                            class="w-full border-0 h-full"
                            style="min-height: 600px;"
                            sandbox="allow-same-origin allow-scripts"
                        ></iframe>
                    </div>
                </div>
            </div>

            <!-- Backdrop -->
            <script>
                document.addEventListener('click', function(e) {
                    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
                        window.Livewire.find('<?php echo e($_instance->getId()); ?>').call('closePreview');
                    }
                });
            </script>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
</div>
<?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/livewire/theme-selector-modal.blade.php ENDPATH**/ ?>