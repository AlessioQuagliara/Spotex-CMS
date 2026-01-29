@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-16">
        <h1 class="text-4xl font-bold text-[#010f20] mb-12">Carrello</h1>

        @if(!empty($cart))
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Articoli Carrello -->
                <div class="lg:col-span-2 space-y-4">
                    @foreach($cart as $productId => $item)
                        <div class="bg-white rounded-lg shadow p-4 flex gap-4">
                            @if($item['image'])
                                <img src="{{ asset('storage/' . $item['image']) }}" alt="{{ $item['name'] }}"
                                     class="w-24 h-24 object-cover rounded">
                            @else
                                <div class="w-24 h-24 bg-gray-300 rounded flex items-center justify-center">
                                    <span class="text-gray-500">No Image</span>
                                </div>
                            @endif

                            <div class="flex-1">
                                <h3 class="font-bold text-lg text-[#010f20]">{{ $item['name'] }}</h3>
                                <p class="text-gray-600">€{{ number_format($item['price'], 2, ',', '.') }}</p>

                                <div class="mt-4 flex items-center gap-2">
                                    <button onclick="updateQuantity({{ $productId }}, -1)" 
                                            class="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400">-</button>
                                    <input type="number" value="{{ $item['quantity'] }}" 
                                           onchange="updateQuantity({{ $productId }}, 0, this.value)"
                                           class="w-12 text-center border border-gray-300 rounded">
                                    <button onclick="updateQuantity({{ $productId }}, 1)" 
                                            class="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400">+</button>
                                    <button onclick="removeItem({{ $productId }})" 
                                            class="ml-auto text-red-600 hover:text-red-800 font-semibold">Rimuovi</button>
                                </div>
                            </div>

                            <div class="text-right">
                                <p class="text-lg font-bold text-[#010f20]">
                                    €{{ number_format($item['price'] * $item['quantity'], 2, ',', '.') }}
                                </p>
                            </div>
                        </div>
                    @endforeach
                </div>

                <!-- Riepilogo -->
                <div class="bg-white rounded-lg shadow p-6 h-fit sticky top-4">
                    <h2 class="text-2xl font-bold text-[#010f20] mb-6">Riepilogo</h2>

                    <div class="space-y-2 mb-6 border-b pb-4">
                        @php
                            $subtotal = array_reduce($cart, fn($total, $item) => $total + ($item['price'] * $item['quantity']), 0);
                        @endphp
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotale</span>
                            <span class="font-semibold">€{{ number_format($subtotal, 2, ',', '.') }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Spedizione</span>
                            <span class="font-semibold">Gratuita</span>
                        </div>
                    </div>

                    <div class="flex justify-between text-lg font-bold text-[#010f20] mb-6">
                        <span>Totale</span>
                        <span>€{{ number_format($subtotal, 2, ',', '.') }}</span>
                    </div>

                    <a href="{{ route('checkout.index') }}" 
                       class="w-full bg-[#010f20] text-white font-bold py-3 rounded hover:bg-blue-900 transition block text-center">
                        Procedi al Checkout
                    </a>

                    <a href="{{ route('products') }}" class="text-blue-600 text-sm mt-4 inline-block hover:underline">
                        Continua Shopping
                    </a>
                </div>
            </div>
        @else
            <div class="bg-white rounded-lg shadow p-12 text-center">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1h7.586a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM15 16a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Carrello Vuoto</h2>
                <p class="text-gray-600 mb-6">Il tuo carrello non contiene ancora prodotti</p>
                <a href="{{ route('products') }}" 
                   class="inline-block bg-[#010f20] text-white font-bold py-3 px-8 rounded hover:bg-blue-900 transition">
                    Inizia a Fare Shopping
                </a>
            </div>
        @endif
    </div>
</div>

<script>
function updateQuantity(productId, change, newValue = null) {
    const quantity = newValue ? parseInt(newValue) : change;
    
    fetch('{{ route("cart.update") }}', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': '{{ csrf_token() }}',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: newValue ? parseInt(newValue) : quantity,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    })
    .catch(error => console.error('Error:', error));
}

function removeItem(productId) {
    if (confirm('Sei sicuro di voler rimuovere questo articolo?')) {
        fetch('{{ route("cart.remove") }}', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': '{{ csrf_token() }}',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            }
        })
        .catch(error => console.error('Error:', error));
    }
}
</script>
@endsection
