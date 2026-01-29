@extends('layouts.app')

@section('seo_title', $product->name . ' - SPOTEX')
@section('seo_description', Str::limit($product->description, 160))
@section('seo_keywords', $product->category?->name ?? '')

@php
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
@endphp

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <!-- Galleria Immagini -->
        <div>
            @if($product->images->count())
                <div class="mb-4">
                    <img id="mainImage" src="{{ $imageUrl($product->images->first()?->image_path) }}" 
                         alt="{{ $product->name }}" class="w-full rounded-lg shadow-lg">
                </div>
                @if($product->images->count() > 1)
                    <div class="grid grid-cols-4 gap-2">
                        @foreach($product->images as $image)
                               <img src="{{ $imageUrl($image->image_path) }}" alt="{{ $product->name }}" 
                                 class="w-full rounded cursor-pointer hover:opacity-75 transition"
                                 onclick="document.getElementById('mainImage').src = this.src">
                        @endforeach
                    </div>
                @endif
            @else
                <div class="bg-gray-200 rounded-lg w-full aspect-square flex items-center justify-center">
                    <span class="text-gray-400">Immagine non disponibile</span>
                </div>
            @endif
        </div>

        <!-- Dettagli Prodotto -->
        <div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">{{ $product->name }}</h1>
            
            @if($product->category)
                     <a href="{{ route('products', ['category' => $product->category->slug]) }}" 
                         class="text-slate-700 hover:text-slate-900 mb-4 inline-block">
                    {{ $product->category->name }}
                </a>
            @endif

            <div class="flex items-baseline gap-4 mb-6">
                @if($product->discounted_price)
                    <span class="text-3xl font-bold text-slate-900">€{{ number_format($product->discounted_price, 2, ',', '.') }}</span>
                    <span class="text-xl text-gray-400 line-through">€{{ number_format($product->price, 2, ',', '.') }}</span>
                    <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        -{{ round((1 - $product->discounted_price / $product->price) * 100) }}%
                    </span>
                @else
                    <span class="text-3xl font-bold text-slate-900">€{{ number_format($product->price, 2, ',', '.') }}</span>
                @endif
            </div>

            <p class="text-gray-700 mb-6 text-lg">{{ $product->description }}</p>

            @if($product->stock > 0)
                <div class="flex items-center gap-4 mb-6">
                          <input type="number" id="quantity" value="1" min="1" max="{{ $product->stock }}" 
                              class="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none">
                          <button data-product-id="{{ $product->id }}" data-qty-input="#quantity" class="js-add-to-cart flex-1 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition">
                        Aggiungi al Carrello
                    </button>
                </div>
                <p class="text-green-600 font-semibold">✓ In stock ({{ $product->stock }} disponibili)</p>
            @else
                <div class="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg mb-6">
                    <p class="text-yellow-800 font-semibold">Prodotto al momento non disponibile</p>
                </div>
            @endif

            <!-- Info aggiuntive -->
            <div class="border-t pt-6 mt-8">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-gray-600 text-sm uppercase tracking-wide mb-2">SKU</p>
                        <p class="font-semibold">{{ $product->sku ?? 'N/A' }}</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm uppercase tracking-wide mb-2">Categoria</p>
                        <p class="font-semibold">{{ $product->category?->name ?? 'N/A' }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Descrizione Dettagliata -->
    @if($product->long_description)
        <div class="bg-gray-50 rounded-lg p-8 mb-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Descrizione Dettagliata</h2>
            <div class="prose prose-lg max-w-none">
                {{ $product->long_description }}
            </div>
        </div>
    @endif

    <!-- Prodotti Correlati -->
    @if($relatedProducts = $product->category?->products()->where('id', '!=', $product->id)->where('is_active', true)->take(4)->get())
        @if($relatedProducts->count() > 0)
            <div class="mb-12">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Prodotti Correlati</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    @foreach($relatedProducts as $related)
                        <a href="{{ route('product.show', $related->slug) }}" class="group">
                            <div class="bg-gray-100 rounded-lg overflow-hidden mb-3 aspect-square">
                                  <img src="{{ $imageUrl($related->primaryImage?->image_path, 'https://via.placeholder.com/300') }}" 
                                     alt="{{ $related->name }}" class="w-full h-full object-cover group-hover:scale-105 transition">
                            </div>
                            <h3 class="font-semibold text-gray-900 group-hover:text-slate-700 transition">{{ $related->name }}</h3>
                            <p class="text-slate-900 font-bold">€{{ number_format($related->discounted_price ?? $related->price, 2, ',', '.') }}</p>
                        </a>
                    @endforeach
                </div>
            </div>
        @endif
    @endif
</div>

@endsection
