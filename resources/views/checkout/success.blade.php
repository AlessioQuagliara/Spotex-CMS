@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-gray-50 py-16">
    <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div class="mb-6">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>

            <h1 class="text-3xl font-bold text-green-600 mb-4">Pagamento Completato!</h1>
            <p class="text-gray-600 text-lg mb-8">
                Grazie per l'acquisto. Il tuo ordine #{{ $order->id }} è stato confermato.
            </p>

            <div class="bg-gray-50 p-6 rounded mb-8 text-left">
                <h2 class="text-xl font-bold text-[#010f20] mb-4">Dettagli Ordine</h2>
                
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">ID Ordine:</span>
                        <span class="font-semibold">#{{ $order->id }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Data:</span>
                        <span class="font-semibold">{{ $order->created_at->format('d/m/Y H:i') }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Metodo Pagamento:</span>
                        <span class="font-semibold">{{ ucfirst($order->payment_method) }}</span>
                    </div>
                    <div class="flex justify-between border-t pt-2 mt-2">
                        <span class="text-gray-600 font-semibold">Totale:</span>
                        <span class="font-bold text-lg text-[#010f20]">€{{ number_format($order->total, 2, ',', '.') }}</span>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-xl font-bold text-[#010f20] mb-4 text-left">Articoli Ordinati</h2>
                <div class="space-y-2">
                    @foreach($order->items as $item)
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div class="flex-1">
                                <p class="font-semibold text-gray-800">{{ $item->product->name }}</p>
                                <p class="text-sm text-gray-500">Quantità: {{ $item->quantity }}</p>
                            </div>
                            <p class="font-semibold">€{{ number_format($item->subtotal, 2, ',', '.') }}</p>
                        </div>
                    @endforeach
                </div>
            </div>

            <p class="text-gray-600 mb-6">
                Riceverai una email di conferma a <strong>{{ auth()->user()->email }}</strong>
            </p>

            <div class="space-y-3">
                <a href="{{ route('home') }}" class="inline-block w-full bg-[#010f20] text-white font-bold py-3 rounded hover:bg-blue-900 transition">
                    Continua Shopping
                </a>
                <a href="#" class="inline-block text-blue-600 hover:underline">
                    Traccia il tuo ordine
                </a>
            </div>
        </div>
    </div>
</div>
@endsection
