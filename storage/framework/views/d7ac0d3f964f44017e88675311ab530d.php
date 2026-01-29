<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPOTEX CMS - E-Commerce</title>
    <!-- Tailwind CSS inline per sviluppo -->
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(file_exists(public_path('build/manifest.json'))): ?>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/app.js']); ?>
    <?php else: ?>
        <script src="https://cdn.tailwindcss.com"></script>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
</head>
<body class="bg-white">
    <!-- Navigation -->
    <nav class="bg-[#010f20] text-white shadow-lg">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="text-2xl">⚡</span>
                <a href="<?php echo e(route('home')); ?>" class="text-xl font-bold hover:text-blue-300 transition">SPOTEX</a>
            </div>

            <div class="flex items-center gap-6">
                <a href="<?php echo e(route('products')); ?>" class="hover:text-blue-300 transition">Prodotti</a>
                
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(auth()->guard()->check()): ?>
                    <div class="relative group">
                        <button class="hover:text-blue-300 transition flex items-center gap-2">
                            <?php echo e(auth()->user()->name); ?>

                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>

                        <div class="hidden group-hover:block absolute right-0 w-48 bg-white text-gray-800 rounded shadow-lg py-2 z-10">
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(auth()->user()->is_admin ?? false): ?>
                                <a href="/admin" class="block px-4 py-2 hover:bg-gray-100">Pannello Admin</a>
                            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            <form method="POST" action="<?php echo e(route('logout')); ?>" class="block">
                                <?php echo csrf_field(); ?>
                                <button type="submit" class="w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
                            </form>
                        </div>
                    </div>

                    <a href="<?php echo e(route('cart.show')); ?>" class="flex items-center gap-2 hover:text-blue-300 transition">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1h7.586a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM15 16a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Carrello
                    </a>
                <?php else: ?>
                    <a href="<?php echo e(route('login')); ?>" class="hover:text-blue-300 transition">Login</a>
                    <a href="<?php echo e(route('register')); ?>" class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition">Registrati</a>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main>
        <?php echo $__env->yieldContent('content'); ?>
    </main>

    <!-- Footer -->
    <footer class="bg-[#010f20] text-white py-12 mt-16">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <span class="text-2xl">⚡</span>
                        <h3 class="text-xl font-bold">SPOTEX</h3>
                    </div>
                    <p class="text-gray-400">E-Commerce Platform Innovativo</p>
                </div>

                <div>
                    <h4 class="font-bold mb-4">Navigazione</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="<?php echo e(route('home')); ?>" class="hover:text-white transition">Home</a></li>
                        <li><a href="<?php echo e(route('products')); ?>" class="hover:text-white transition">Prodotti</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold mb-4">Assistenza</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white transition">FAQ</a></li>
                        <li><a href="#" class="hover:text-white transition">Contatti</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold mb-4">Pagamenti</h4>
                    <div class="flex gap-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Stripe_logo.png/512px-Stripe_logo.png" alt="Stripe" class="h-6 opacity-70">
                        <img src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/checkout-logo-medium.png" alt="PayPal" class="h-6 opacity-70">
                    </div>
                </div>
            </div>

            <div class="border-t border-gray-700 pt-8 text-center text-gray-400">
                <p>&copy; 2026 SPOTEX CMS. Tutti i diritti riservati.</p>
            </div>
        </div>
    </footer>
</body>
</html>
<?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/layouts/app.blade.php ENDPATH**/ ?>