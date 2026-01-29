@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-gray-50 py-16">
    <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div class="mb-6">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg class="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>

            <h1 class="text-3xl font-bold text-red-600 mb-4">Pagamento Annullato</h1>
            <p class="text-gray-600 text-lg mb-8">
                Il pagamento per l'ordine #{{ $order->id }} è stato annullato.
            </p>

            <p class="text-gray-600 mb-6">
                Non è stato addebitato alcun importo. Puoi riprovare il pagamento in qualsiasi momento.
            </p>

            <div class="space-y-3">
                <a href="{{ route('checkout.index', ['order' => $order->id]) }}" 
                   class="inline-block w-full bg-[#010f20] text-white font-bold py-3 rounded hover:bg-blue-900 transition">
                    Riprova il Pagamento
                </a>
                <a href="{{ route('cart.show') }}" class="inline-block text-blue-600 hover:underline">
                    Torna al Carrello
                </a>
                <a href="{{ route('home') }}" class="inline-block text-blue-600 hover:underline">
                    Continua Shopping
                </a>
            </div>
        </div>
    </div>
</div>
@endsection
