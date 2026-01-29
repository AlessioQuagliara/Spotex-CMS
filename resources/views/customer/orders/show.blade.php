@extends('layouts.app')

@section('content')
<div class="min-h-screen" style="background-color: {{ $theme['background'] ?? '#f9fafb' }};">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <!-- Header -->
        <div class="mb-8">
            <a href="{{ route('customer.dashboard') }}" class="text-sm font-medium hover:opacity-80 mb-4 inline-block" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                ← Torna alla dashboard
            </a>
            <h1 class="text-3xl font-bold" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                Ordine #{{ $order->id }}
            </h1>
        </div>

        <!-- Alert Messages -->
        @if($errors->any())
            <div class="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
                <ul class="text-sm text-red-800 list-disc list-inside">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        @if(session('success'))
            <div class="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
                <p class="text-sm text-green-800">{{ session('success') }}</p>
            </div>
        @endif

        <!-- Order Status -->
        <div class="bg-white rounded-lg shadow mb-6 p-6">
            <h2 class="text-lg font-semibold mb-4" style="color: {{ $theme['text'] ?? '#1f2937' }};">Stato Ordine</h2>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <p class="text-xs text-gray-600 mb-1">Data Ordine</p>
                    <p class="font-semibold">{{ $order->created_at->format('d/m/Y H:i') }}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-600 mb-1">Pagamento</p>
                    <span class="px-3 py-1 rounded-full text-xs font-medium {{ 
                        $order->payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        ($order->payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')
                    }}">
                        {{ ucfirst($order->payment_status) }}
                    </span>
                </div>
                <div>
                    <p class="text-xs text-gray-600 mb-1">Spedizione</p>
                    <span class="px-3 py-1 rounded-full text-xs font-medium {{ 
                        $order->shipping_status === 'delivered' ? 'bg-green-100 text-green-800' :
                        ($order->shipping_status === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')
                    }}">
                        {{ ucfirst(str_replace('_', ' ', $order->shipping_status)) }}
                    </span>
                </div>
                <div>
                    <p class="text-xs text-gray-600 mb-1">Metodo Pagamento</p>
                    <p class="font-semibold text-sm">{{ ucfirst($order->payment_method ?? 'N/A') }}</p>
                </div>
            </div>

            @if($order->tracking_number)
                <div class="bg-blue-50 border border-blue-200 rounded p-4">
                    <p class="text-sm text-blue-800">
                        <strong>Numero Tracciamento:</strong> {{ $order->tracking_number }}
                    </p>
                </div>
            @endif
        </div>

        <!-- Items -->
        <div class="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div class="px-6 py-4 border-b" style="background-color: {{ $theme['muted'] ?? '#f3f4f6' }};">
                <h2 class="font-semibold" style="color: {{ $theme['text'] ?? '#1f2937' }};">Articoli Ordine</h2>
            </div>
            
            <div class="divide-y">
                @foreach($order->items as $item)
                    <div class="px-6 py-4 flex items-center gap-4">
                        <div class="flex-1">
                            <p class="font-semibold">{{ $item->product_name ?? 'Prodotto' }}</p>
                            <p class="text-sm text-gray-600">Quantità: {{ $item->quantity }}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold">€{{ number_format($item->total, 2, ',', '.') }}</p>
                            <p class="text-sm text-gray-600">€{{ number_format($item->price, 2, ',', '.') }} x {{ $item->quantity }}</p>
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Totals -->
            <div class="px-6 py-4 bg-gray-50 space-y-2">
                <div class="flex justify-between">
                    <span>Subtotale:</span>
                    <span>€{{ number_format($order->subtotal, 2, ',', '.') }}</span>
                </div>
                @if($order->discount_amount > 0)
                    <div class="flex justify-between text-green-600">
                        <span>Sconto ({{ $order->discount_code }}):</span>
                        <span>-€{{ number_format($order->discount_amount, 2, ',', '.') }}</span>
                    </div>
                @endif
                <div class="flex justify-between">
                    <span>Spedizione:</span>
                    <span>€{{ number_format($order->shipping_cost, 2, ',', '.') }}</span>
                </div>
                <div class="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Totale:</span>
                    <span>€{{ number_format($order->total, 2, ',', '.') }}</span>
                </div>
            </div>
        </div>

        <!-- Addresses -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Shipping Address -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="font-semibold mb-4" style="color: {{ $theme['text'] ?? '#1f2937' }};">Indirizzo di Spedizione</h2>
                @if($order->shipping_address)
                    <div class="text-sm space-y-1 text-gray-700">
                        @php
                            $shipping = json_decode($order->shipping_address, true) ?? [];
                        @endphp
                        <p><strong>{{ $shipping['name'] ?? '' }}</strong></p>
                        <p>{{ $shipping['address'] ?? '' }}</p>
                        <p>{{ $shipping['postal_code'] ?? '' }} {{ $shipping['city'] ?? '' }}</p>
                        <p>{{ $shipping['country'] ?? 'IT' }}</p>
                        @if(isset($shipping['phone']))
                            <p class="text-gray-600">Tel: {{ $shipping['phone'] }}</p>
                        @endif
                    </div>
                @else
                    <p class="text-gray-500">Non disponibile</p>
                @endif
            </div>

            <!-- Billing Address -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="font-semibold mb-4" style="color: {{ $theme['text'] ?? '#1f2937' }};">Indirizzo di Fatturazione</h2>
                @if(!$order->billing_same_as_shipping && $order->billing_address)
                    <div class="text-sm space-y-1 text-gray-700">
                        @php
                            $billing = json_decode($order->billing_address, true) ?? [];
                        @endphp
                        <p><strong>{{ $billing['name'] ?? $order->billing_name ?? '' }}</strong></p>
                        <p>{{ $billing['address'] ?? '' }}</p>
                        <p>{{ $billing['postal_code'] ?? '' }} {{ $billing['city'] ?? '' }}</p>
                        <p>{{ $billing['country'] ?? 'IT' }}</p>
                        @if($order->billing_company)
                            <p class="text-gray-600"><strong>Azienda:</strong> {{ $order->billing_company }}</p>
                        @endif
                        @if($order->billing_tax_id)
                            <p class="text-gray-600"><strong>P. IVA/C.F.:</strong> {{ $order->billing_tax_id }}</p>
                        @endif
                    </div>
                @else
                    <p class="text-gray-500">Uguale a spedizione</p>
                @endif
            </div>
        </div>

        <!-- Edit Button -->
        @if($order->canBeEdited())
            <div class="flex gap-3">
                <a href="{{ route('customer.orders.edit', $order) }}" class="flex-1 text-center py-3 px-4 rounded-lg font-medium text-white transition hover:opacity-90" style="background-color: {{ $theme['primary'] ?? '#3b82f6' }};">
                    Modifica Ordine
                </a>
            </div>
        @endif
    </div>
</div>
@endsection
