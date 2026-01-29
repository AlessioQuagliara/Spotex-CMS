<?php $__env->startSection('seo_title', $product->name . ' - SPOTEX'); ?>
<?php $__env->startSection('seo_description', Str::limit($product->description, 160)); ?>
<?php $__env->startSection('seo_keywords', $product->category?->name ?? ''); ?>

<?php
    $imageUrl = function ($path, $fallback = 'https://via.placeholder.com/500') {
        if (!$path) {
            return $fallback;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }
        if (str_starts_with($path, '/storage/')) {
            return $path;
        }
        if (str_starts_with($path, 'storage/')) {
            return '/' . $path;
        }
        return '/storage/' . ltrim($path, '/');
    };
?>

<?php $__env->startSection('content'); ?>
<div class="container mx-auto px-4 py-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <!-- Galleria Immagini -->
        <div>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($product->images->count()): ?>
                <div class="mb-4">
                    <img id="mainImage" src="<?php echo e($imageUrl($product->images->first()?->image_path)); ?>" 
                         alt="<?php echo e($product->name); ?>" class="w-full rounded-lg shadow-lg">
                </div>
                <?php if($product->images->count() > 1): ?>
                    <div class="grid grid-cols-4 gap-2">
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $product->images; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $image): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                               <img src="<?php echo e($imageUrl($image->image_path)); ?>" alt="<?php echo e($product->name); ?>" 
                                 class="w-full rounded cursor-pointer hover:opacity-75 transition"
                                 onclick="document.getElementById('mainImage').src = this.src">
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </div>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            <?php else: ?>
                <div class="bg-gray-200 rounded-lg w-full aspect-square flex items-center justify-center">
                    <span class="text-gray-400">Immagine non disponibile</span>
                </div>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </div>

        <!-- Dettagli Prodotto -->
        <div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2"><?php echo e($product->name); ?></h1>
            
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($product->category): ?>
                     <a href="<?php echo e(route('products', ['category' => $product->category->slug])); ?>" 
                         class="text-slate-700 hover:text-slate-900 mb-4 inline-block">
                    <?php echo e($product->category->name); ?>

                </a>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

            <div class="flex items-baseline gap-4 mb-6">
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($product->discounted_price): ?>
                    <span class="text-3xl font-bold text-slate-900">€<?php echo e(number_format($product->discounted_price, 2, ',', '.')); ?></span>
                    <span class="text-xl text-gray-400 line-through">€<?php echo e(number_format($product->price, 2, ',', '.')); ?></span>
                    <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        -<?php echo e(round((1 - $product->discounted_price / $product->price) * 100)); ?>%
                    </span>
                <?php else: ?>
                    <span class="text-3xl font-bold text-slate-900">€<?php echo e(number_format($product->price, 2, ',', '.')); ?></span>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </div>

            <p class="text-gray-700 mb-6 text-lg"><?php echo e($product->description); ?></p>

            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($product->stock > 0): ?>
                <div class="flex items-center gap-4 mb-6">
                          <input type="number" id="quantity" value="1" min="1" max="<?php echo e($product->stock); ?>" 
                              class="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none">
                          <button data-product-id="<?php echo e($product->id); ?>" data-qty-input="#quantity" class="js-add-to-cart flex-1 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition">
                        Aggiungi al Carrello
                    </button>
                </div>
                <p class="text-green-600 font-semibold">✓ In stock (<?php echo e($product->stock); ?> disponibili)</p>
            <?php else: ?>
                <div class="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg mb-6">
                    <p class="text-yellow-800 font-semibold">Prodotto al momento non disponibile</p>
                </div>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

            <!-- Info aggiuntive -->
            <div class="border-t pt-6 mt-8">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-gray-600 text-sm uppercase tracking-wide mb-2">SKU</p>
                        <p class="font-semibold"><?php echo e($product->sku ?? 'N/A'); ?></p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm uppercase tracking-wide mb-2">Categoria</p>
                        <p class="font-semibold"><?php echo e($product->category?->name ?? 'N/A'); ?></p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Descrizione Dettagliata -->
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($product->long_description): ?>
        <div class="bg-gray-50 rounded-lg p-8 mb-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Descrizione Dettagliata</h2>
            <div class="prose prose-lg max-w-none">
                <?php echo e($product->long_description); ?>

            </div>
        </div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    <!-- Prodotti Correlati -->
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($relatedProducts = $product->category?->products()->where('id', '!=', $product->id)->where('is_active', true)->take(4)->get()): ?>
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($relatedProducts->count() > 0): ?>
            <div class="mb-12">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Prodotti Correlati</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $relatedProducts; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $related): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <a href="<?php echo e(route('product.show', $related->slug)); ?>" class="group">
                            <div class="bg-gray-100 rounded-lg overflow-hidden mb-3 aspect-square">
                                  <img src="<?php echo e($imageUrl($related->primaryImage?->image_path, 'https://via.placeholder.com/300')); ?>" 
                                     alt="<?php echo e($related->name); ?>" class="w-full h-full object-cover group-hover:scale-105 transition">
                            </div>
                            <h3 class="font-semibold text-gray-900 group-hover:text-slate-700 transition"><?php echo e($related->name); ?></h3>
                            <p class="text-slate-900 font-bold">€<?php echo e(number_format($related->discounted_price ?? $related->price, 2, ',', '.')); ?></p>
                        </a>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </div>
            </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
</div>

<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/products/show.blade.php ENDPATH**/ ?>