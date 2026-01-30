@php
    use App\Models\Setting;
    use App\Models\NavigationItem;
    use App\Helpers\NavigationHelper;
    use App\Services\ThemeService;
    
    $businessName = Setting::get('business_name', 'La Tua Attività');
    $businessDescription = Setting::get('business_description', '');
    $businessEmail = Setting::get('business_email', '');
    $businessPhone = Setting::get('business_phone', '');
    $businessVat = Setting::get('business_vat', '');
    $businessLogo = Setting::get('business_logo', '');
    $businessFavicon = Setting::get('business_favicon', '');
    $businessPoweredBy = Setting::get('business_powered_by', 'Spotex CMS');
    $theme = ThemeService::getTheme();
    $pages = \App\Models\Page::where('is_published', true)->get();
    $colors = Setting::get('colors', []);
    $navBg = $colors['secondary'] ?? $theme['navbar']['background_color'] ?? '#1F2937';
    $navText = $theme['navbar']['text_color'] ?? '#FFFFFF';
    $headerNav = NavigationItem::byLocation('header')->get();
    $footerNav = NavigationItem::byLocation('footer')->get();
    $cartItems = session()->get('cart', []);
    $cartCount = array_reduce($cartItems, fn($total, $item) => $total + (int)($item['quantity'] ?? 0), 0);
    $cartSubtotal = array_reduce($cartItems, fn($total, $item) => $total + ((float)($item['price'] ?? 0) * (int)($item['quantity'] ?? 0)), 0);
@endphp

<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('seo_title', $businessName . ' - E-Commerce')</title>
    <meta name="description" content="@yield('seo_description', $theme['description'] ?? 'E-Commerce Platform Innovativo')">
    <meta name="keywords" content="@yield('seo_keywords', '')">
    @if($businessFavicon)
        <link rel="icon" href="{{ asset('storage/' . $businessFavicon) }}" type="image/x-icon">
    @endif
    <!-- Tailwind CSS inline per sviluppo -->
    @if(file_exists(public_path('build/manifest.json')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @else
        <script src="https://cdn.tailwindcss.com"></script>
    @endif
    <style>
        :root {
            --color-primary: {{ $colors['primary'] ?? $theme['colors']['primary'] ?? '#3B82F6' }};
            --color-secondary: {{ $colors['secondary'] ?? $theme['colors']['secondary'] ?? '#1F2937' }};
            --color-accent: {{ $colors['accent'] ?? $theme['colors']['accent'] ?? '#F59E0B' }};
        }
        .bg-theme-primary { background-color: var(--color-primary); }
        .bg-theme-secondary { background-color: var(--color-secondary); }
        .bg-theme-accent { background-color: var(--color-accent); }
        body { padding-top: 70px; }
    </style>
</head>
<body class="bg-white">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 shadow-lg z-50" style="background-color: {{ $navBg }}; color: {{ $navText }};">
        <div class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <!-- Logo Section -->
                <div class="flex items-center gap-3">
                    @if($businessLogo)
                        <img src="{{ asset('storage/' . $businessLogo) }}" alt="Logo" class="h-12 w-auto">
                    @else
                        <span class="text-2xl">⚡</span>
                    @endif
                    <a href="{{ route('home') }}" class="text-xl font-bold hover:opacity-80 transition">{{ $businessName }}</a>
                </div>

                <!-- Desktop Menu -->
                <div class="hidden md:flex items-center gap-6">
                    {{-- Dynamic Header Navigation --}}
                    @if($headerNav->isNotEmpty())
                        @foreach($headerNav as $item)
                            @if($item->children->isNotEmpty())
                                {{-- Menu con sottomenu --}}
                                <div class="relative group">
                                    <button class="hover:opacity-80 transition flex items-center gap-2">
                                        {{ $item->label }}
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                    <div class="hidden group-hover:block absolute left-0 w-48 bg-white text-gray-800 rounded shadow-lg py-2 z-20">
                                        @foreach($item->children as $subitem)
                                            <a href="{{ NavigationHelper::getNavigationUrl($subitem) }}" 
                                               target="{{ $subitem->target }}"
                                               class="block px-4 py-2 hover:bg-gray-100">
                                                {{ $subitem->label }}
                                            </a>
                                        @endforeach
                                    </div>
                                </div>
                            @else
                                {{-- Menu singolo --}}
                                <a href="{{ NavigationHelper::getNavigationUrl($item) }}" 
                                   target="{{ $item->target }}"
                                   class="hover:opacity-80 transition">
                                    {{ $item->label }}
                                </a>
                            @endif
                        @endforeach
                    @else
                        {{-- Fallback alla navigazione statica --}}
                        <a href="{{ route('products') }}" class="hover:opacity-80 transition">Prodotti</a>
                        @foreach($pages as $page)
                            <a href="{{ route('page.show', $page->slug) }}" class="hover:opacity-80 transition">{{ $page->title }}</a>
                        @endforeach
                    @endif
                    
                    <div class="hidden md:flex items-center gap-4">
                        <a href="{{ route('products') }}" class="p-2 rounded hover:opacity-80 transition" title="Cerca">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18.5a7.5 7.5 0 006.15-3.85z" />
                            </svg>
                        </a>

                        <div class="relative group">
                            <a href="{{ route('cart.show') }}" class="p-2 rounded hover:opacity-80 transition relative" title="Carrello">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1h7.586a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM15 16a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span id="cart-count" class="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 {{ $cartCount ? '' : 'hidden' }}">
                                    {{ $cartCount }}
                                </span>
                            </a>

                            <div id="cart-preview" class="hidden group-hover:block absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded shadow-lg py-3 z-30">
                                <div class="px-4 pb-2 border-b text-sm font-semibold">Anteprima Carrello</div>
                                <div id="cart-preview-items" class="max-h-60 overflow-auto">
                                    @forelse($cartItems as $item)
                                        <div class="px-4 py-2 flex items-center gap-3">
                                            @if(!empty($item['image']))
                                                <img src="{{ asset('storage/' . $item['image']) }}" alt="{{ $item['name'] }}" class="w-10 h-10 rounded object-cover">
                                            @else
                                                <div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">Img</div>
                                            @endif
                                            <div class="flex-1">
                                                <div class="text-sm font-medium leading-tight">{{ $item['name'] }}</div>
                                                <div class="text-xs text-gray-500">{{ $item['quantity'] }} x €{{ number_format($item['price'], 2, ',', '.') }}</div>
                                            </div>
                                        </div>
                                    @empty
                                        <div class="px-4 py-4 text-sm text-gray-500">Carrello vuoto</div>
                                    @endforelse
                                </div>
                                <div class="px-4 pt-2 border-t text-sm flex justify-between">
                                    <span>Subtotale</span>
                                    <span id="cart-subtotal">€{{ number_format($cartSubtotal, 2, ',', '.') }}</span>
                                </div>
                                <div class="px-4 pt-2">
                                    <a href="{{ route('cart.show') }}" class="block text-center bg-slate-900 text-white py-2 rounded text-sm hover:bg-slate-800">Vai al carrello</a>
                                </div>
                            </div>
                        </div>

                        @auth
                            <div class="relative group">
                                <button class="p-2 rounded hover:opacity-80 transition" title="Il mio account">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zm-7 16a7 7 0 0114 0H3z" clip-rule="evenodd" />
                                    </svg>
                                </button>

                                <div class="hidden group-hover:block absolute right-0 w-48 bg-white text-gray-800 rounded shadow-lg py-2 z-20">
                                    <div class="px-4 py-2 text-sm text-gray-500 border-b">
                                        {{ auth()->user()->name }}
                                    </div>
                                    @if(!auth()->user()->hasVerifiedEmail())
                                        <div class="px-4 py-2 text-xs bg-yellow-50 text-yellow-800 border-b">
                                            ⚠️ Email non verificata
                                        </div>
                                    @endif
                                    <a href="#" class="block px-4 py-2 hover:bg-gray-100">Il mio profilo</a>
                                    <a href="#" class="block px-4 py-2 hover:bg-gray-100">I miei ordini</a>
                                    <form method="POST" action="{{ route('logout') }}" class="block">
                                        @csrf
                                        <button type="submit" class="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Logout</button>
                                    </form>
                                </div>
                            </div>
                        @else
                            <a href="{{ route('login') }}" class="p-2 rounded hover:opacity-80 transition" title="Accedi">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zm-7 16a7 7 0 0114 0H3z" clip-rule="evenodd" />
                                </svg>
                            </a>
                        @endauth
                    </div>
                </div>

                <!-- Mobile Menu Button -->
                <button class="md:hidden p-2 rounded" onclick="document.getElementById('mobileMenu').classList.toggle('hidden')" style="color: {{ $navText }};">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <!-- Mobile Menu -->
            <div id="mobileMenu" class="hidden md:hidden mt-4 space-y-2 pb-4">
                {{-- Dynamic Mobile Navigation --}}
                @if($headerNav->isNotEmpty())
                    @foreach($headerNav as $item)
                        <a href="{{ NavigationHelper::getNavigationUrl($item) }}" 
                           target="{{ $item->target }}"
                           class="block px-4 py-2 rounded hover:opacity-80 transition">
                            {{ $item->label }}
                        </a>
                        {{-- Sottomenu mobile --}}
                        @foreach($item->children as $subitem)
                            <a href="{{ NavigationHelper::getNavigationUrl($subitem) }}" 
                               target="{{ $subitem->target }}"
                               class="block px-4 py-2 pl-8 rounded text-sm hover:opacity-80 transition">
                                {{ $subitem->label }}
                            </a>
                        @endforeach
                    @endforeach
                @else
                    {{-- Fallback --}}
                    <a href="{{ route('products') }}" class="block px-4 py-2 rounded hover:opacity-80 transition">Prodotti</a>
                    @foreach($pages as $page)
                        <a href="{{ route('page.show', $page->slug) }}" class="block px-4 py-2 rounded hover:opacity-80 transition">{{ $page->title }}</a>
                    @endforeach
                @endif

                <a href="{{ route('products') }}" class="block px-4 py-2 rounded hover:opacity-80 transition">Cerca</a>
                <a href="{{ route('cart.show') }}" class="block px-4 py-2 rounded hover:opacity-80 transition">Carrello</a>
                
                @auth
                    <div class="border-t pt-2 mt-2">
                        <div class="px-4 py-2 text-sm font-medium">{{ auth()->user()->name }}</div>
                        @if(!auth()->user()->hasVerifiedEmail())
                            <div class="px-4 py-1 text-xs bg-yellow-50 text-yellow-800">⚠️ Email non verificata</div>
                        @endif
                        <a href="#" class="block px-4 py-2 rounded hover:opacity-80 transition">Il mio profilo</a>
                        <a href="#" class="block px-4 py-2 rounded hover:opacity-80 transition">I miei ordini</a>
                        @if(auth()->user()->is_admin ?? false)
                            <a href="/admin" class="block px-4 py-2 rounded hover:opacity-80 transition">Pannello Admin</a>
                        @endif
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="w-full text-left px-4 py-2 rounded hover:opacity-80 transition text-red-600">Logout</button>
                        </form>
                    </div>
                @else
                    <a href="{{ route('login') }}" class="block px-4 py-2 rounded hover:opacity-80 transition">Accedi</a>
                    <a href="{{ route('register') }}" class="block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition text-center">Registrati</a>
                @endauth
            </div>
        </div>
    </nav>

    @auth
        @if(auth()->user()->is_admin ?? false)
            <!-- Edit Mode Banner -->
            <div class="bg-blue-600 text-white shadow-lg sticky top-0 z-40">
                <div class="container mx-auto px-4 py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span class="font-medium">Pagina in visualizzazione</span>
                        </div>
                        @if(isset($page) && $page->id)
                            <a href="/admin/pages/{{ $page->id }}/builder" class="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition font-medium text-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Modifica questa pagina
                            </a>
                        @else
                            <a href="/admin" class="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition font-medium text-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Vai al Pannello Admin
                            </a>
                        @endif
                    </div>
                </div>
            </div>
        @endif
    @endauth

    <!-- Main Content -->
    <main>
        @yield('content')
    </main>

    <!-- Footer -->
    <footer class="shadow-lg py-12 mt-16" style="background-color: {{ $navBg }}; color: {{ $navText }};">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    @if($businessLogo)
                        <img src="{{ asset('storage/' . $businessLogo) }}" alt="Logo" class="h-12 w-auto mb-4">
                    @else
                        <div class="flex items-center gap-2 mb-4">
                            <span class="text-2xl">⚡</span>
                            <h3 class="text-xl font-bold">{{ $businessName }}</h3>
                        </div>
                    @endif
                    <p class="opacity-75">{{ $businessDescription ?? $theme['description'] ?? 'E-Commerce Platform Innovativo' }}</p>
                    @if($businessVat)
                        <p class="text-sm mt-2 opacity-60">P.IVA: {{ $businessVat }}</p>
                    @endif
                </div>

                <div>
                    <h4 class="font-bold mb-4">Navigazione</h4>
                    <ul class="space-y-2 opacity-75">
                        <li><a href="{{ route('home') }}" class="hover:opacity-100 transition">Home</a></li>
                        <li><a href="{{ route('products') }}" class="hover:opacity-100 transition">Prodotti</a></li>
                        @if($footerNav->isNotEmpty())
                            @foreach($footerNav as $item)
                                @if($item->children->isEmpty())
                                    <li><a href="{{ NavigationHelper::getNavigationUrl($item) }}" 
                                           target="{{ $item->target }}"
                                           class="hover:opacity-100 transition">{{ $item->label }}</a></li>
                                @else
                                    <li class="font-semibold mt-3">{{ $item->label }}</li>
                                    @foreach($item->children as $subitem)
                                        <li class="ml-4"><a href="{{ NavigationHelper::getNavigationUrl($subitem) }}" 
                                               target="{{ $subitem->target }}"
                                               class="hover:opacity-100 transition text-sm">{{ $subitem->label }}</a></li>
                                    @endforeach
                                @endif
                            @endforeach
                        @else
                            @foreach($pages as $page)
                                <li><a href="{{ route('page.show', $page->slug) }}" class="hover:opacity-100 transition">{{ $page->title }}</a></li>
                            @endforeach
                        @endif
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold mb-4">Contatti</h4>
                    <ul class="space-y-2 opacity-75">
                        @if($businessEmail)
                            <li><a href="mailto:{{ $businessEmail }}" class="hover:opacity-100 transition">{{ $businessEmail }}</a></li>
                        @endif
                        @if($businessPhone)
                            <li><a href="tel:{{ $businessPhone }}" class="hover:opacity-100 transition">{{ $businessPhone }}</a></li>
                        @endif
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

            <div class="border-t opacity-50 pt-8 text-center opacity-75">
                <p>&copy; {{ date('Y') }} {{ $businessName }}. Tutti i diritti riservati.</p>
                <p class="text-sm mt-2">{{ $businessPoweredBy }}</p>
            </div>
        </div>
    </footer>

    <script>
        const formatEuro = (value) => {
            return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
        };

        const updateCartPreview = (cart) => {
            const countEl = document.getElementById('cart-count');
            const itemsEl = document.getElementById('cart-preview-items');
            const subtotalEl = document.getElementById('cart-subtotal');
            const previewEl = document.getElementById('cart-preview');

            if (!countEl || !itemsEl || !subtotalEl) return;

            if (cart.count > 0) {
                countEl.classList.remove('hidden');
                countEl.textContent = cart.count;
            } else {
                countEl.classList.add('hidden');
            }

            itemsEl.innerHTML = '';
            if (!cart.items || cart.items.length === 0) {
                itemsEl.innerHTML = '<div class="px-4 py-4 text-sm text-gray-500">Carrello vuoto</div>';
            } else {
                cart.items.forEach((item) => {
                    const imageHtml = item.image
                        ? `<img src="/storage/${item.image}" alt="${item.name}" class="w-10 h-10 rounded object-cover">`
                        : `<div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">Img</div>`;

                    itemsEl.insertAdjacentHTML('beforeend', `
                        <div class="px-4 py-2 flex items-center gap-3">
                            ${imageHtml}
                            <div class="flex-1">
                                <div class="text-sm font-medium leading-tight">${item.name}</div>
                                <div class="text-xs text-gray-500">${item.quantity} x ${formatEuro(item.price)}</div>
                            </div>
                        </div>
                    `);
                });
            }

            subtotalEl.textContent = formatEuro(cart.subtotal);

            if (previewEl) {
                previewEl.classList.remove('hidden');
                previewEl.classList.add('block');
                clearTimeout(previewEl._hideTimeout);
                previewEl._hideTimeout = setTimeout(() => {
                    if (!previewEl.matches(':hover')) {
                        previewEl.classList.remove('block');
                        previewEl.classList.add('hidden');
                    }
                }, 2000);
            }
        };

        const handleAddToCart = async (productId, quantity = 1) => {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const response = await fetch('{{ route('cart.add') }}', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Errore nell\'aggiunta al carrello');
            }

            const data = await response.json();
            if (data.success && data.cart) {
                updateCartPreview(data.cart);
            }

            return data;
        };

        document.querySelectorAll('.js-add-to-cart').forEach((button) => {
            button.addEventListener('click', async () => {
                const productId = button.dataset.productId;
                const qtyInput = button.dataset.qtyInput ? document.querySelector(button.dataset.qtyInput) : null;
                const quantity = qtyInput ? parseInt(qtyInput.value || '1', 10) : 1;

                try {
                    const data = await handleAddToCart(productId, quantity);
                    if (data.success) {
                        button.classList.add('ring-2', 'ring-green-500');
                        setTimeout(() => button.classList.remove('ring-2', 'ring-green-500'), 800);
                    }
                } catch (error) {
                    console.error(error);
                    alert('Errore nell\'aggiunta al carrello');
                }
            });
        });
    </script>
    @stack('scripts')
</body>
</html>
