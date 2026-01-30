@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <div class="bg-gray-50 text-slate-900 py-16 border-b border-gray-200">
        <div class="container mx-auto px-4">
            <h1 class="text-4xl font-bold">
                {{ isset($selectedCategory) && $selectedCategory ? $selectedCategory->name : 'Prodotti' }}
            </h1>
            <p class="text-lg text-slate-600 mt-2">
                {{ isset($selectedCategory) && $selectedCategory ? 'Prodotti nella categoria' : 'Catalogo prodotti' }}
            </p>
        </div>
    </div>

    <!-- Products Section -->
    <div class="container mx-auto px-4 py-16">
        <!-- Filtri Categorie -->
        <div class="mb-12">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Categorie</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                @php
                    $isAllActive = empty($selectedCategory);
                @endphp
                <a href="{{ route('products') }}" class="{{ $isAllActive ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white border border-gray-300 text-slate-800 hover:border-slate-500' }} font-semibold py-3 px-4 rounded text-center transition">
                    Tutti
                </a>
                @foreach($categories as $category)
                    @php
                        $isActive = isset($selectedCategory) && $selectedCategory && $selectedCategory->id === $category->id;
                    @endphp
                    <a href="{{ route('category.show', $category) }}" class="{{ $isActive ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white border border-gray-300 text-slate-800 hover:border-slate-500' }} font-semibold py-3 px-4 rounded text-center transition">
                        {{ $category->name }}
                    </a>
                @endforeach
            </div>
        </div>

        <!-- Prodotti Grid -->
        <div>
            <h2 class="text-2xl font-bold text-slate-900 mb-8">I Nostri Prodotti</h2>
            @if($products->count())
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    @foreach($products as $product)
                        <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
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
                                    <h3 class="text-lg font-bold text-slate-900 hover:text-slate-700 transition">
                                        {{ $product->name }}
                                    </h3>
                                </a>
                                
                                <p class="text-gray-600 text-sm mt-2 line-clamp-2">
                                    {{ $product->description }}
                                </p>

                                <div class="mt-4 flex items-center justify-between">
                                    <span class="text-2xl font-bold text-slate-900">
                                        €{{ number_format($product->price, 2, ',', '.') }}
                                    </span>
                                    <span class="text-sm {{ $product->stock > 0 ? 'text-green-600' : 'text-red-600' }} font-semibold">
                                        {{ $product->stock > 0 ? 'Disponibile' : 'Esaurito' }}
                                    </span>
                                </div>

                                @if($product->stock > 0)
                                    <button
                                            data-product-id="{{ $product->id }}"
                                            class="js-add-to-cart w-full mt-4 bg-slate-900 text-white font-bold py-2 rounded hover:bg-slate-800 transition">
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

@endsection
