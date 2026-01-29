<?php $__env->startSection('content'); ?>
<div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <div class="bg-gray-50 text-slate-900 py-16 border-b border-gray-200">
        <div class="container mx-auto px-4">
            <h1 class="text-4xl font-bold">Prodotti</h1>
            <p class="text-lg text-slate-600 mt-2">Catalogo prodotti</p>
        </div>
    </div>

    <!-- Products Section -->
    <div class="container mx-auto px-4 py-16">
        <!-- Filtri Categorie -->
        <div class="mb-12">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Categorie</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="<?php echo e(route('products')); ?>" class="bg-slate-900 text-white font-semibold py-3 px-4 rounded text-center hover:bg-slate-800 transition">
                    Tutti
                </a>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $categories; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $category): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <a href="?category=<?php echo e($category->slug); ?>" class="bg-white border border-gray-300 text-slate-800 font-semibold py-3 px-4 rounded text-center hover:border-slate-500 transition">
                        <?php echo e($category->name); ?>

                    </a>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </div>
        </div>

        <!-- Prodotti Grid -->
        <div>
            <h2 class="text-2xl font-bold text-slate-900 mb-8">I Nostri Prodotti</h2>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($products->count()): ?>
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $products; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $product): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                            <!-- Immagine Prodotto -->
                            <div class="h-48 bg-gray-200 overflow-hidden">
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($product->primaryImage): ?>
                                    <img src="<?php echo e(asset('storage/' . $product->primaryImage->image_path)); ?>" 
                                         alt="<?php echo e($product->primaryImage->alt_text ?? $product->name); ?>"
                                         class="w-full h-full object-cover">
                                <?php else: ?>
                                    <div class="w-full h-full flex items-center justify-center bg-gray-300">
                                        <span class="text-gray-500">No Image</span>
                                    </div>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </div>

                            <!-- Contenuto Prodotto -->
                            <div class="p-4">
                                <a href="<?php echo e(route('product.show', $product)); ?>" class="block">
                                    <h3 class="text-lg font-bold text-slate-900 hover:text-slate-700 transition">
                                        <?php echo e($product->name); ?>

                                    </h3>
                                </a>
                                
                                <p class="text-gray-600 text-sm mt-2 line-clamp-2">
                                    <?php echo e($product->description); ?>

                                </p>

                                <div class="mt-4 flex items-center justify-between">
                                    <span class="text-2xl font-bold text-slate-900">
                                        €<?php echo e(number_format($product->price, 2, ',', '.')); ?>

                                    </span>
                                    <span class="text-sm <?php echo e($product->stock > 0 ? 'text-green-600' : 'text-red-600'); ?> font-semibold">
                                        <?php echo e($product->stock > 0 ? 'Disponibile' : 'Esaurito'); ?>

                                    </span>
                                </div>

                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($product->stock > 0): ?>
                                    <button
                                            data-product-id="<?php echo e($product->id); ?>"
                                            class="js-add-to-cart w-full mt-4 bg-slate-900 text-white font-bold py-2 rounded hover:bg-slate-800 transition">
                                        Aggiungi al Carrello
                                    </button>
                                <?php else: ?>
                                    <button disabled class="w-full mt-4 bg-gray-400 text-white font-bold py-2 rounded cursor-not-allowed">
                                        Esaurito
                                    </button>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </div>
            <?php else: ?>
                <div class="text-center py-12">
                    <p class="text-xl text-gray-500">Nessun prodotto trovato</p>
                </div>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </div>

        <!-- Paginazione -->
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($products->hasPages()): ?>
            <div class="mt-12">
                <?php echo e($products->links()); ?>

            </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>
</div>

<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/products/index.blade.php ENDPATH**/ ?>