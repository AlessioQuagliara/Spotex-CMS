@extends('layouts.app')

@section('content')
<div class="min-h-screen" style="background-color: {{ $theme['background'] ?? '#f9fafb' }};">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <!-- Header -->
        <div class="mb-8">
            <a href="{{ route('customer.orders.show', $order) }}" class="text-sm font-medium hover:opacity-80 mb-4 inline-block" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                ← Torna all'ordine
            </a>
            <h1 class="text-3xl font-bold" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                Modifica Ordine #{{ $order->id }}
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

        <form method="POST" action="{{ route('customer.orders.update', $order) }}" class="bg-white rounded-lg shadow p-6">
            @csrf

            <!-- Fatturazione -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-6" style="color: {{ $theme['text'] ?? '#1f2937' }};">Informazioni Fatturazione</h2>

                <div class="space-y-4">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" name="billing_same_as_shipping" value="1" 
                            {{ $order->billing_same_as_shipping ? 'checked' : '' }}
                            class="w-5 h-5 rounded"
                            onchange="document.getElementById('billingFields').classList.toggle('hidden')"
                        >
                        <span class="font-medium">Indirizzo di fatturazione uguale a spedizione</span>
                    </label>

                    <div id="billingFields" class="{{ $order->billing_same_as_shipping ? 'hidden' : '' }} space-y-4 pt-4 border-t">
                        <div>
                            <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                                Nome Intestatario <span class="text-red-600">*</span>
                            </label>
                            <input type="text" name="billing_name" 
                                value="{{ old('billing_name', $order->billing_name) }}"
                                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                                style="focus:ring-color: {{ $theme['primary'] ?? '#3b82f6' }}; focus:border-color: {{ $theme['primary'] ?? '#3b82f6' }};"
                                placeholder="Es. Azienda XYZ S.r.l."
                            >
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                                Ragione Sociale
                            </label>
                            <input type="text" name="billing_company" 
                                value="{{ old('billing_company', $order->billing_company) }}"
                                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                                style="focus:ring-color: {{ $theme['primary'] ?? '#3b82f6' }}; focus:border-color: {{ $theme['primary'] ?? '#3b82f6' }};"
                                placeholder="Es. Azienda XYZ S.r.l."
                            >
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                                Codice Fiscale / P. IVA
                            </label>
                            <input type="text" name="billing_tax_id" 
                                value="{{ old('billing_tax_id', $order->billing_tax_id) }}"
                                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                                style="focus:ring-color: {{ $theme['primary'] ?? '#3b82f6' }}; focus:border-color: {{ $theme['primary'] ?? '#3b82f6' }};"
                                placeholder="Es. IT12345678901"
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Note Ordine -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-6" style="color: {{ $theme['text'] ?? '#1f2937' }};">Note Ordine</h2>

                <div>
                    <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                        Note (opzionale)
                    </label>
                    <textarea name="notes" rows="4"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" 
                        style="focus:ring-color: {{ $theme['primary'] ?? '#3b82f6' }}; focus:border-color: {{ $theme['primary'] ?? '#3b82f6' }};"
                        placeholder="Es. Consegnare solo di martedì pomeriggio..."
                    >{{ old('notes', $order->notes) }}</textarea>
                    <p class="text-xs text-gray-600 mt-2">Max 1000 caratteri</p>
                </div>
            </div>

            <!-- Submit -->
            <div class="flex gap-3">
                <button type="submit" class="flex-1 py-3 px-4 rounded-lg font-medium text-white transition hover:opacity-90" style="background-color: {{ $theme['primary'] ?? '#3b82f6' }};">
                    Salva Modifiche
                </button>
                <a href="{{ route('customer.orders.show', $order) }}" class="flex-1 py-3 px-4 rounded-lg font-medium text-center border transition hover:bg-gray-50" style="border-color: {{ $theme['border'] ?? '#e5e7eb' }}; color: {{ $theme['text'] ?? '#1f2937' }};">
                    Annulla
                </a>
            </div>
        </form>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const checkbox = document.querySelector('input[name="billing_same_as_shipping"]');
        const billingFields = document.getElementById('billingFields');
        
        if (checkbox && !checkbox.checked) {
            billingFields.classList.remove('hidden');
        }
    });
</script>
@endsection
