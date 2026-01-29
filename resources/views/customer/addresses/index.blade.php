@extends('layouts.app')

@section('content')
<div class="min-h-screen" style="background-color: {{ $theme['background'] ?? '#f9fafb' }};">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Header -->
        <div class="mb-8">
            <a href="{{ route('customer.dashboard') }}" class="text-sm font-medium hover:opacity-80 mb-4 inline-block" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                ← Torna alla dashboard
            </a>
            <h1 class="text-3xl font-bold" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                I miei Indirizzi
            </h1>
        </div>

        <!-- Alert Messages -->
        @if(session('success'))
            <div class="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
                <p class="text-sm text-green-800">{{ session('success') }}</p>
            </div>
        @endif

        <!-- Add Address Button -->
        <div class="mb-8">
            <a href="{{ route('customer.addresses.create') }}" class="inline-block py-3 px-6 rounded-lg font-medium text-white transition hover:opacity-90" 
                style="background-color: {{ $theme['primary'] ?? '#3b82f6' }};">
                + Aggiungi Nuovo Indirizzo
            </a>
        </div>

        <!-- Shipping Addresses -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4" style="color: {{ $theme['text'] ?? '#1f2937' }};">Indirizzi di Spedizione</h2>
            
            @if($shippingAddresses->count() > 0)
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @foreach($shippingAddresses as $address)
                        <div class="bg-white rounded-lg shadow p-6 border-l-4" style="border-left-color: {{ $theme['primary'] ?? '#3b82f6' }};">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="font-semibold text-lg">{{ $address->name }}</h3>
                                    @if($address->company)
                                        <p class="text-sm text-gray-600">{{ $address->company }}</p>
                                    @endif
                                </div>
                                @if($address->is_default)
                                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Default</span>
                                @endif
                            </div>

                            <div class="text-sm text-gray-700 space-y-1 mb-4">
                                <p>{{ $address->address }}</p>
                                <p>{{ $address->postal_code }} {{ $address->city }}</p>
                                @if($address->province)
                                    <p>{{ $address->province }}</p>
                                @endif
                                <p>{{ $address->country }}</p>
                                @if($address->phone)
                                    <p class="pt-2"><strong>Tel:</strong> {{ $address->phone }}</p>
                                @endif
                            </div>

                            <div class="flex gap-2 pt-4 border-t">
                                <a href="{{ route('customer.addresses.edit', $address) }}" class="flex-1 text-center py-2 px-3 rounded text-sm font-medium transition hover:opacity-80" 
                                    style="background-color: {{ $theme['primary'] ?? '#3b82f6' }}; color: white;">
                                    Modifica
                                </a>
                                <form method="POST" action="{{ route('customer.addresses.destroy', $address) }}" class="flex-1" onsubmit="return confirm('Sei sicuro di voler eliminare questo indirizzo?');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="w-full py-2 px-3 rounded text-sm font-medium text-red-600 border border-red-300 transition hover:bg-red-50">
                                        Elimina
                                    </button>
                                </form>
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="bg-gray-50 rounded-lg p-8 text-center">
                    <p class="text-gray-600 mb-4">Non hai ancora aggiunto un indirizzo di spedizione</p>
                    <a href="{{ route('customer.addresses.create') }}" class="inline-block font-medium hover:opacity-80" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                        Aggiungi il tuo primo indirizzo →
                    </a>
                </div>
            @endif
        </div>

        <!-- Billing Addresses -->
        <div>
            <h2 class="text-2xl font-bold mb-4" style="color: {{ $theme['text'] ?? '#1f2937' }};">Indirizzi di Fatturazione</h2>
            
            @if($billingAddresses->count() > 0)
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @foreach($billingAddresses as $address)
                        <div class="bg-white rounded-lg shadow p-6 border-l-4" style="border-left-color: #f59e0b;">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="font-semibold text-lg">{{ $address->name }}</h3>
                                    @if($address->company)
                                        <p class="text-sm text-gray-600">{{ $address->company }}</p>
                                    @endif
                                    @if($address->tax_id)
                                        <p class="text-sm text-gray-600"><strong>P. IVA:</strong> {{ $address->tax_id }}</p>
                                    @endif
                                </div>
                                @if($address->is_default)
                                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Default</span>
                                @endif
                            </div>

                            <div class="text-sm text-gray-700 space-y-1 mb-4">
                                <p>{{ $address->address }}</p>
                                <p>{{ $address->postal_code }} {{ $address->city }}</p>
                                @if($address->province)
                                    <p>{{ $address->province }}</p>
                                @endif
                                <p>{{ $address->country }}</p>
                                @if($address->email)
                                    <p class="pt-2"><strong>Email:</strong> {{ $address->email }}</p>
                                @endif
                            </div>

                            <div class="flex gap-2 pt-4 border-t">
                                <a href="{{ route('customer.addresses.edit', $address) }}" class="flex-1 text-center py-2 px-3 rounded text-sm font-medium transition hover:opacity-80" 
                                    style="background-color: #f59e0b; color: white;">
                                    Modifica
                                </a>
                                <form method="POST" action="{{ route('customer.addresses.destroy', $address) }}" class="flex-1" onsubmit="return confirm('Sei sicuro di voler eliminare questo indirizzo?');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="w-full py-2 px-3 rounded text-sm font-medium text-red-600 border border-red-300 transition hover:bg-red-50">
                                        Elimina
                                    </button>
                                </form>
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="bg-gray-50 rounded-lg p-8 text-center">
                    <p class="text-gray-600 mb-4">Non hai ancora aggiunto un indirizzo di fatturazione</p>
                    <a href="{{ route('customer.addresses.create') }}" class="inline-block font-medium hover:opacity-80" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                        Aggiungi il tuo primo indirizzo →
                    </a>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
