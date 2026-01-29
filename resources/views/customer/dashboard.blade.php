@extends('layouts.app')

@section('content')
<div class="min-h-screen" style="background-color: {{ $theme['background'] ?? '#f9fafb' }};">
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-4xl font-bold" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                Benvenuto, {{ auth()->user()->name }}!
            </h1>
            <p class="text-gray-600 mt-2">Gestisci il tuo account e gli ordini</p>
        </div>

        <!-- Alert Email Non Verificata -->
        @if(!auth()->user()->hasVerifiedEmail())
            <div class="mb-8 rounded-lg p-4 border-l-4" style="background-color: #fef3c7; border-color: {{ $theme['primary'] ?? '#f59e0b' }};">
                <div class="flex items-start gap-3">
                    <svg class="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <div class="flex-1">
                        <h3 class="font-semibold text-yellow-900">Email non verificata</h3>
                        <p class="text-sm text-yellow-800 mt-1">Verifica il tuo indirizzo email per sbloccare tutte le funzionalità.</p>
                        <form method="POST" action="{{ route('verification.send') }}" class="mt-3">
                            @csrf
                            <button type="submit" class="text-sm font-medium text-yellow-900 hover:text-yellow-800 underline">
                                Rinvia email di verifica
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        @endif

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Total Spent -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Totale Speso</p>
                        <p class="text-3xl font-bold mt-2" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                            €{{ number_format($totalSpent, 2, ',', '.') }}
                        </p>
                    </div>
                    <svg class="w-12 h-12 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>

            <!-- Active Orders -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Ordini Attivi</p>
                        <p class="text-3xl font-bold mt-2" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                            {{ $activeOrders }}
                        </p>
                    </div>
                    <svg class="w-12 h-12 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z" />
                        <path d="M16 16a2 2 0 11-4 0 2 2 0 014 0zM4 12a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
            </div>

            <!-- Account Status -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Stato Account</p>
                        <p class="text-lg font-semibold mt-2">
                            @if(auth()->user()->hasVerifiedEmail())
                                <span class="text-green-600">✓ Verificato</span>
                            @else
                                <span class="text-yellow-600">⚠ In attesa</span>
                            @endif
                        </p>
                    </div>
                    <svg class="w-12 h-12 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 3.062v6.218c0 1.816-.895 3.51-2.365 4.427a5.986 5.986 0 01-2.275.93 5.9 5.9 0 01-2.617 0 5.986 5.986 0 01-2.275-.93 4.406 4.406 0 01-2.365-4.427V6.517a3.066 3.066 0 012.812-3.062zM9 6.5a1 1 0 100-2 1 1 0 000 2zm-3 1.5a1 1 0 11-2 0 1 1 0 012 0zm10-1a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <a href="{{ route('customer.profile') }}" class="block p-4 rounded-lg border-2 text-center hover:shadow-lg transition" style="border-color: {{ $theme['border'] ?? '#e5e7eb' }}; hover:border-color: {{ $theme['primary'] ?? '#3b82f6' }};">
                <svg class="w-8 h-8 mx-auto mb-2" style="color: {{ $theme['primary'] ?? '#3b82f6' }}" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                <p class="font-medium">Il mio Profilo</p>
            </a>

            <a href="{{ route('customer.orders') }}" class="block p-4 rounded-lg border-2 text-center hover:shadow-lg transition" style="border-color: {{ $theme['border'] ?? '#e5e7eb' }}; hover:border-color: {{ $theme['primary'] ?? '#3b82f6' }};">
                <svg class="w-8 h-8 mx-auto mb-2" style="color: {{ $theme['primary'] ?? '#3b82f6' }}" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z" />
                    <path d="M16 16a2 2 0 11-4 0 2 2 0 014 0zM4 12a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p class="font-medium">I miei Ordini</p>
            </a>

            <a href="{{ route('customer.addresses') }}" class="block p-4 rounded-lg border-2 text-center hover:shadow-lg transition" style="border-color: {{ $theme['border'] ?? '#e5e7eb' }}; hover:border-color: {{ $theme['primary'] ?? '#3b82f6' }};">
                <svg class="w-8 h-8 mx-auto mb-2" style="color: {{ $theme['primary'] ?? '#3b82f6' }}" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L9.9 13.95a7 7 0 01-9.9-9.9zM9 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                </svg>
                <p class="font-medium">Indirizzi</p>
            </a>

            <form method="POST" action="{{ route('logout') }}" class="block">
                @csrf
                <button type="submit" class="w-full p-4 rounded-lg border-2 text-center hover:shadow-lg transition text-red-600" style="border-color: {{ $theme['border'] ?? '#e5e7eb' }};">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
                    </svg>
                    <p class="font-medium">Logout</p>
                </button>
            </form>
        </div>

        <!-- Recent Orders -->
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b">
                <h2 class="text-2xl font-bold" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                    Ordini Recenti
                </h2>
            </div>

            <div class="overflow-x-auto">
                @if($orders->count() > 0)
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ordine</th>
                                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Importo</th>
                                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pagamento</th>
                                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Spedizione</th>
                                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Azioni</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            @foreach($orders as $order)
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 text-sm font-medium text-gray-900">#{{ $order->id }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-600">
                                        {{ $order->created_at->format('d/m/Y') }}
                                    </td>
                                    <td class="px-6 py-4 text-sm font-semibold">
                                        €{{ number_format($order->total, 2, ',', '.') }}
                                    </td>
                                    <td class="px-6 py-4 text-sm">
                                        <span class="px-3 py-1 rounded-full text-xs font-medium {{ 
                                            $order->payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                            ($order->payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')
                                        }}">
                                            {{ ucfirst($order->payment_status) }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm">
                                        <span class="px-3 py-1 rounded-full text-xs font-medium {{ 
                                            $order->shipping_status === 'delivered' ? 'bg-green-100 text-green-800' :
                                            ($order->shipping_status === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')
                                        }}">
                                            {{ ucfirst(str_replace('_', ' ', $order->shipping_status)) }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm">
                                        <a href="{{ route('customer.orders.show', $order) }}" class="font-medium hover:opacity-80" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                                            Dettagli
                                        </a>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>

                    <!-- Pagination -->
                    <div class="px-6 py-4">
                        {{ $orders->links() }}
                    </div>
                @else
                    <div class="px-6 py-12 text-center">
                        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p class="text-gray-600 text-lg">Non hai ancora alcun ordine</p>
                        <a href="{{ route('products') }}" class="inline-block mt-4 font-medium hover:opacity-80" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                            Inizia a fare acquisti →
                        </a>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection
