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
                Il mio Profilo
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

        <!-- Profile Form -->
        <form method="POST" action="{{ route('customer.profile.update') }}" class="bg-white rounded-lg shadow p-6 mb-6">
            @csrf

            <h2 class="text-xl font-semibold mb-6" style="color: {{ $theme['text'] ?? '#1f2937' }};">Dati Profilo</h2>

            <div class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm font-medium mb-3" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                        Tipo profilo
                    </label>
                    @php
                        $profileType = old('profile_type', $user->profile_type ?? 'private');
                    @endphp
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="profile_type" value="private" class="w-4 h-4" {{ $profileType === 'private' ? 'checked' : '' }}>
                            <span>Privato</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="profile_type" value="company" class="w-4 h-4" {{ $profileType === 'company' ? 'checked' : '' }}>
                            <span>Azienda</span>
                        </label>
                    </div>
                </div>

                <div class="js-private-fields grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                            Nome
                        </label>
                        <input type="text" name="first_name" value="{{ old('first_name', $user->first_name) }}"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            placeholder="Es. Mario">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                            Cognome
                        </label>
                        <input type="text" name="last_name" value="{{ old('last_name', $user->last_name) }}"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            placeholder="Es. Rossi">
                    </div>
                </div>

                <div class="js-company-fields grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                            Ragione sociale
                        </label>
                        <input type="text" name="company_name" value="{{ old('company_name', $user->company_name) }}"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            placeholder="Es. Spotex S.r.l.">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                            Forma giuridica
                        </label>
                        <input type="text" name="company_legal_form" value="{{ old('company_legal_form', $user->company_legal_form) }}"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            placeholder="Es. SRL, SPA">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">Nome profilo</label>
                    <input type="text" name="name" value="{{ old('name', $user->name) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        placeholder="Nome visualizzato per l'account">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                        Email
                    </label>
                        <input type="email" name="email" value="{{ old('email', $user->email) }}"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                            Telefono
                        </label>
                        <input type="text" name="phone" value="{{ old('phone', $user->phone) }}"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            placeholder="+39...">
                    </div>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
                    <strong>Email verificata:</strong>
                    @if($user->hasVerifiedEmail())
                        <span class="text-green-600">✓ Sì</span>
                    @else
                        <span class="text-yellow-600">⚠ No - Controlla la tua casella di posta</span>
                    @endif
                </div>
            </div>

            <h3 class="text-lg font-semibold mb-4" style="color: {{ $theme['text'] ?? '#1f2937' }};">Dati demografici</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium mb-2">Data di nascita</label>
                    <input type="date" name="birth_date" value="{{ old('birth_date', optional($user->birth_date)->format('Y-m-d')) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Genere</label>
                    <select name="gender" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2">
                        <option value="">Seleziona</option>
                        <option value="male" @selected(old('gender', $user->gender) === 'male')>Uomo</option>
                        <option value="female" @selected(old('gender', $user->gender) === 'female')>Donna</option>
                        <option value="other" @selected(old('gender', $user->gender) === 'other')>Altro</option>
                        <option value="undisclosed" @selected(old('gender', $user->gender) === 'undisclosed')>Preferisco non indicare</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Città di nascita</label>
                    <input type="text" name="birth_city" value="{{ old('birth_city', $user->birth_city) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Provincia di nascita</label>
                    <input type="text" name="birth_province" value="{{ old('birth_province', $user->birth_province) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" maxlength="8">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Nazionalità (ISO2)</label>
                    <input type="text" name="nationality" value="{{ old('nationality', $user->nationality ?? 'IT') }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 uppercase" maxlength="2">
                </div>
            </div>

            <h3 class="text-lg font-semibold mb-4" style="color: {{ $theme['text'] ?? '#1f2937' }};">Dati fiscali</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium mb-2">Codice Fiscale</label>
                    <input type="text" name="tax_code" value="{{ old('tax_code', $user->tax_code) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 uppercase">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Partita IVA</label>
                    <input type="text" name="vat_number" value="{{ old('vat_number', $user->vat_number) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 uppercase">
                </div>
                <div class="js-company-fields">
                    <label class="block text-sm font-medium mb-2">PEC</label>
                    <input type="email" name="pec" value="{{ old('pec', $user->pec) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2">
                </div>
                <div class="js-company-fields">
                    <label class="block text-sm font-medium mb-2">Codice SDI</label>
                    <input type="text" name="sdi_code" value="{{ old('sdi_code', $user->sdi_code) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 uppercase">
                </div>
            </div>

            <h3 class="text-lg font-semibold mb-4" style="color: {{ $theme['text'] ?? '#1f2937' }};">Indirizzo principale</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium mb-2">Indirizzo</label>
                    <input type="text" name="billing_address" value="{{ old('billing_address', $user->billing_address) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Città</label>
                    <input type="text" name="billing_city" value="{{ old('billing_city', $user->billing_city) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Provincia</label>
                    <input type="text" name="billing_province" value="{{ old('billing_province', $user->billing_province) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" maxlength="8">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">CAP</label>
                    <input type="text" name="billing_postal_code" value="{{ old('billing_postal_code', $user->billing_postal_code) }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Paese (ISO2)</label>
                    <input type="text" name="billing_country" value="{{ old('billing_country', $user->billing_country ?? 'IT') }}"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 uppercase" maxlength="2">
                </div>
            </div>

            <button type="submit" class="w-full py-3 px-4 rounded-lg font-medium text-white transition hover:opacity-90" 
                style="background-color: {{ $theme['primary'] ?? '#3b82f6' }};">
                Salva Modifiche
            </button>
        </form>

        <!-- Account Info -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-semibold mb-6" style="color: {{ $theme['text'] ?? '#1f2937' }};">Informazioni Account</h2>

            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Account creato:</span>
                    <strong>{{ $user->created_at->format('d/m/Y H:i') }}</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Ultimo accesso:</span>
                    <strong>{{ $user->last_login_at?->format('d/m/Y H:i') ?? 'Primo accesso' }}</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Totale ordini:</span>
                    <strong>{{ $user->orders()->count() }}</strong>
                </div>
            </div>
        </div>

        <!-- Navigation -->
        <div class="flex gap-3">
            <a href="{{ route('customer.addresses') }}" class="flex-1 py-3 px-4 rounded-lg font-medium text-center border transition hover:bg-gray-50" 
                style="border-color: {{ $theme['border'] ?? '#e5e7eb' }}; color: {{ $theme['text'] ?? '#1f2937' }};">
                I miei Indirizzi
            </a>
            <a href="{{ route('customer.orders') }}" class="flex-1 py-3 px-4 rounded-lg font-medium text-center border transition hover:bg-gray-50" 
                style="border-color: {{ $theme['border'] ?? '#e5e7eb' }}; color: {{ $theme['text'] ?? '#1f2937' }};">
                I miei Ordini
            </a>
        </div>
    </div>
</div>

<script>
    (() => {
        const radios = Array.from(document.querySelectorAll('input[name="profile_type"]'));
        const privateFields = Array.from(document.querySelectorAll('.js-private-fields'));
        const companyFields = Array.from(document.querySelectorAll('.js-company-fields'));

        const applyVisibility = () => {
            const selected = radios.find((radio) => radio.checked)?.value || 'private';
            const showPrivate = selected === 'private';
            const showCompany = selected === 'company';

            privateFields.forEach((el) => {
                el.classList.toggle('hidden', !showPrivate);
            });

            companyFields.forEach((el) => {
                el.classList.toggle('hidden', !showCompany);
            });
        };

        radios.forEach((radio) => {
            radio.addEventListener('change', applyVisibility);
        });

        applyVisibility();
    })();
</script>
@endsection
