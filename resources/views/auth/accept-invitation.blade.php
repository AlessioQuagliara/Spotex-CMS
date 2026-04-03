@extends('layouts.app')

@section('content')
<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style="background-color: {{ $theme['background'] ?? '#f9fafb' }};">
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                Accetta Invito
            </h2>
            <p class="mt-2 text-center text-sm" style="color: {{ $theme['muted'] ?? '#6b7280' }};">
                Completa il tuo accesso a Spotex CMS
            </p>
        </div>

        @if(!empty($invalidInvitation))
            <div class="rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-800">
                Invito non valido. Contatta un amministratore per riceverne uno nuovo.
            </div>
        @elseif(!empty($expiredInvitation))
            <div class="rounded-md bg-yellow-50 p-4 border border-yellow-200 text-sm text-yellow-900">
                Questo invito è scaduto per <strong>{{ $email ?? 'utente' }}</strong>. Chiedi un nuovo invito.
            </div>
        @else
            @if($errors->any())
                <div class="rounded-md bg-red-50 p-4 border border-red-200">
                    <ul class="text-sm text-red-800 list-disc list-inside">
                        @foreach($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form class="mt-8 space-y-6" action="{{ route('invitation.accept.store', ['token' => $token]) }}" method="POST">
                @csrf

                <div class="rounded-md shadow-sm space-y-4">
                    <div>
                        <label for="email" class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">Email</label>
                        <input id="email" type="email" value="{{ $email }}" disabled class="appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
                    </div>
                    <div>
                        <label for="name" class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">Nome</label>
                        <input id="name" name="name" type="text" required value="{{ old('name', $defaultName ?? '') }}" class="appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 sm:text-sm" placeholder="Il tuo nome completo">
                    </div>
                    <div>
                        <label for="password" class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">Password</label>
                        <input id="password" name="password" type="password" required class="appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 sm:text-sm" placeholder="Crea una password">
                    </div>
                    <div>
                        <label for="password_confirmation" class="block text-sm font-medium mb-2" style="color: {{ $theme['text'] ?? '#1f2937' }};">Conferma Password</label>
                        <input id="password_confirmation" name="password_confirmation" type="password" required class="appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 sm:text-sm" placeholder="Ripeti la password">
                    </div>
                </div>

                <div>
                    <button type="submit" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition" style="background-color: {{ $theme['primary'] ?? '#3b82f6' }};">
                        Accetta Invito
                    </button>
                </div>
            </form>
        @endif
    </div>
</div>
@endsection
