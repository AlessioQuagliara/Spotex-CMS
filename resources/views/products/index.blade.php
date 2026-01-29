@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-[#010f20] to-blue-900 text-white py-20">
        <div class="container mx-auto px-4">
            <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span class="text-2xl">⚡</span>
                </div>
                <h1 class="text-4xl font-bold">SPOTEX CMS</h1>
            </div>
            <p class="text-xl text-gray-300">E-Commerce Platform Innovativo</p>
        </div>
    </div>

    <!-- Products Section -->
    <div class="container mx-auto px-4 py-16">
        <!-- Filtri Categorie -->
        <div class="mb-12">
            <h2 class="text-2xl font-bold text-[#010f20] mb-6">Categorie</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="{{ route('products') }}" class="bg-white border-2 border-[#010f20] text-[#010f20] font-semibold py-3 px-4 rounded text-center hover:bg-[#010f20] hover:text-white transition">
                    Tutti
                </a>
                @foreach($categories as $category)
                    <a href="?category={{ $category->slug }}" class="bg-white border-2 border-gray-300 text-[#010f20] font-semibold py-3 px-4 rounded text-center hover:border-[#010f20] transition">
                        {{ $category->name }}
                    </a>
                @endforeach
            </div>
        </div>

        <!-- Prodotti Grid -->
        <div>
            <h2 class="text-2xl font-bold text-[#010f20] mb-8">I Nostri Prodotti</h2>
            @if($products->count())
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    @foreach($products as $product)
                        <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:scale-105">
                            <!-- Immagine Prodotto -->
                            <div class="h-48 bg-gray-200 overflow-hidden">
                                @if($product->primaryImage)
                                    <img src="{{ asset('storage/' . $product->primaryImage->image_path) }}" 
                                         alt="{{ $product->primaryImage->alt_text ?? $product->name }}"
                                         class="w-full h-full object-cover">
                                @else
                                    <div class="w-full h-full flex items-center justify-center bg-gray-300">
                                        <span class="text-gray-500">No Image</span>
                                    </div>
                                @endif
                            </div>

                            <!-- Contenuto Prodotto -->
                            <div class="p-4">
                                <a href="{{ route('product.show', $product) }}" class="block">
                                    <h3 class="text-lg font-bold text-[#010f20] hover:text-blue-600 transition">
                                        {{ $product->name }}
                                    </h3>
                                </a>
                                
                                <p class="text-gray-600 text-sm mt-2 line-clamp-2">
                                    {{ $product->description }}
                                </p>

                                <div class="mt-4 flex items-center justify-between">
                                    <span class="text-2xl font-bold text-[#010f20]">
                                        €{{ number_format($product->price, 2, ',', '.') }}
                                    </span>
                                    <span class="text-sm {{ $product->stock > 0 ? 'text-green-600' : 'text-red-600' }} font-semibold">
                                        {{ $product->stock > 0 ? 'Disponibile' : 'Esaurito' }}
                                    </span>
                                </div>

                                @if($product->stock > 0)
                                    <button
                                            data-product-id="{{ $product->id }}"
                                            class="js-add-to-cart w-full mt-4 bg-[#010f20] text-white font-bold py-2 rounded hover:bg-blue-900 transition">
                                        Aggiungi al Carrello
                                    </button>
                                @else
                                    <button disabled class="w-full mt-4 bg-gray-400 text-white font-bold py-2 rounded cursor-not-allowed">
                                        Esaurito
                                    </button>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="text-center py-12">
                    <p class="text-xl text-gray-500">Nessun prodotto trovato</p>
                </div>
            @endif
        </div>

        <!-- Paginazione -->
        @if($products->hasPages())
            <div class="mt-12">
                {{ $products->links() }}
            </div>
        @endif
    </div>
</div>

<script>
document.querySelectorAll('.js-add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        const productId = button.dataset.productId;
        addToCart(productId);
    });
});

function addToCart(productId) {
    fetch('{{ route("cart.add") }}', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': '{{ csrf_token() }}',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: 1,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Prodotto aggiunto al carrello!');
            window.location.href = '{{ route("cart.show") }}';
        }
    })
    .catch(error => console.error('Error:', error));
}
</script>
@endsection
