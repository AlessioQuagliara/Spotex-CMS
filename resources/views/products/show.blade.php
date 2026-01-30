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
@php
    $reviewSchema = null;
    if ($reviewsCount > 0) {
        $reviewSchema = [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $product->name,
            'image' => $product->primaryImage?->image_path ? $imageUrl($product->primaryImage->image_path) : null,
            'description' => $product->description,
            'sku' => $product->sku ?? null,
            'aggregateRating' => [
                '@type' => 'AggregateRating',
                'ratingValue' => $averageRating,
                'reviewCount' => $reviewsCount,
                'bestRating' => 5,
                'worstRating' => 1,
            ],
            'review' => $product->reviews->take(10)->map(function ($review) {
                return [
                    '@type' => 'Review',
                    'author' => [
                        '@type' => 'Person',
                        'name' => $review->author_name,
                    ],
                    'datePublished' => $review->created_at->toDateString(),
                    'reviewRating' => [
                        '@type' => 'Rating',
                        'ratingValue' => $review->rating,
                        'bestRating' => 5,
                        'worstRating' => 1,
                    ],
                    'name' => $review->title,
                    'reviewBody' => $review->body,
                ];
            })->values()->all(),
        ];
    }
@endphp

@if($reviewSchema)
    <script type="application/ld+json">
        {!! json_encode($reviewSchema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endif
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
                <a href="{{ route('category.show', $product->category) }}" 
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

            <p class="text-gray-700 mb-4 text-lg">{{ $product->description }}</p>

            @if($reviewsCount > 0)
                <div class="flex items-center gap-3 mb-6">
                    <div class="flex items-center">
                        @for($i = 1; $i <= 5; $i++)
                            <svg class="w-4 h-4 {{ $averageRating >= $i ? 'text-yellow-400' : 'text-gray-300' }}" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.381 2.457a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118l-3.381-2.457a1 1 0 00-1.175 0l-3.381 2.457c-.784.57-1.838-.197-1.539-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.044 9.4c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.974z" />
                            </svg>
                        @endfor
                    </div>
                    <span class="text-sm font-semibold text-gray-900">{{ number_format($averageRating, 1, ',', '.') }}</span>
                    <span class="text-sm text-gray-500">({{ $reviewsCount }} recensioni)</span>
                </div>
            @endif

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
                    @if(!empty($product->sku))
                        <div>
                            <p class="text-gray-600 text-sm uppercase tracking-wide mb-2">SKU</p>
                            <p class="font-semibold">{{ $product->sku }}</p>
                        </div>
                    @endif
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

    <!-- Contenuto Personalizzato -->
    @if(!empty($product->custom_content_html))
        <div class="bg-white rounded-lg border border-gray-200 p-8 mb-12">
            <div id="customContent" class="prose prose-lg max-w-none" data-html="{{ $product->custom_content_html }}"></div>
        </div>
    @endif

    <!-- Recensioni & Rating -->
    <div class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Recensioni & Rating</h2>

        @if($reviewsCount > 0)
            <div class="flex items-center gap-4 mb-6">
                <div class="flex items-center">
                    @for($i = 1; $i <= 5; $i++)
                        <svg class="w-5 h-5 {{ $averageRating >= $i ? 'text-yellow-400' : 'text-gray-300' }}" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.381 2.457a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118l-3.381-2.457a1 1 0 00-1.175 0l-3.381 2.457c-.784.57-1.838-.197-1.539-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.044 9.4c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.974z" />
                        </svg>
                    @endfor
                </div>
                <span class="text-lg font-semibold text-gray-900">{{ number_format($averageRating, 1, ',', '.') }}</span>
                <span class="text-gray-500">({{ $reviewsCount }} recensioni)</span>
            </div>

            <div class="space-y-6 mb-10">
                @foreach($product->reviews as $review)
                    <div class="border border-gray-200 rounded-lg p-5">
                        <div class="flex items-center justify-between mb-2">
                            <p class="font-semibold text-gray-900">{{ $review->author_name }}</p>
                            <span class="text-sm text-gray-500">{{ $review->created_at->format('d/m/Y') }}</span>
                        </div>
                        <div class="flex items-center mb-2">
                            @for($i = 1; $i <= 5; $i++)
                                <svg class="w-4 h-4 {{ $review->rating >= $i ? 'text-yellow-400' : 'text-gray-300' }}" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.381 2.457a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118l-3.381-2.457a1 1 0 00-1.175 0l-3.381 2.457c-.784.57-1.838-.197-1.539-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.044 9.4c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.974z" />
                                </svg>
                            @endfor
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">{{ $review->title }}</h3>
                        <p class="text-gray-700 mt-2">{{ $review->body }}</p>
                    </div>
                @endforeach
            </div>
        @else
            <p class="text-gray-500 mb-6">Non ci sono recensioni per questo prodotto.</p>
        @endif

        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Lascia una recensione</h3>
            @if(session('success'))
                <div class="mb-4 rounded-md bg-green-50 p-3 border border-green-200 text-green-800 text-sm">
                    {{ session('success') }}
                </div>
            @endif
            @if($errors->any())
                <div class="mb-4 rounded-md bg-red-50 p-3 border border-red-200 text-red-800 text-sm">
                    <ul class="list-disc list-inside">
                        @foreach($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif
            <form method="POST" action="{{ route('product.reviews.store', $product) }}" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @csrf
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input type="text" name="author_name" value="{{ old('author_name') }}" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email (opzionale)</label>
                    <input type="email" name="author_email" value="{{ old('author_email') }}" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Valutazione</label>
                    <select name="rating" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500">
                        <option value="">Seleziona</option>
                        @for($i = 5; $i >= 1; $i--)
                            <option value="{{ $i }}" {{ old('rating') == $i ? 'selected' : '' }}>{{ $i }} stelle</option>
                        @endfor
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Titolo</label>
                    <input type="text" name="title" value="{{ old('title') }}" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Recensione</label>
                    <textarea name="body" rows="4" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500">{{ old('body') }}</textarea>
                </div>
                <div class="md:col-span-2">
                    <button type="submit" class="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition">Invia recensione</button>
                </div>
            </form>
        </div>
    </div>

    <!-- I clienti hanno scelto anche -->
    <div class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">I clienti hanno scelto anche</h2>
        @if($alsoChosen->count() === 3)
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                @foreach($alsoChosen as $related)
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
        @else
            <p class="text-gray-500">Non ci sono altre scelte disponibili</p>
        @endif
    </div>
</div>

@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const container = document.getElementById('customContent');
            if (container && container.dataset.html) {
                const clean = DOMPurify.sanitize(container.dataset.html, {
                    USE_PROFILES: { html: true },
                });
                container.innerHTML = clean;
            }
        });
    </script>
@endpush
