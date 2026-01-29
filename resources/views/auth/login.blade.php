@extends('layouts.app')

@section('content')
<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style="background-color: {{ $theme['background'] ?? '#f9fafb' }};">
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                Accedi al tuo account
            </h2>
            <p class="mt-2 text-center text-sm" style="color: {{ $theme['muted'] ?? '#6b7280' }};">
                Oppure
                <a href="{{ route('register') }}" class="font-medium hover:opacity-80" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                    crea un nuovo account
                </a>
            </p>
        </div>

        @if(session('success'))
            <div class="rounded-md bg-green-50 p-4 border border-green-200">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
                    </div>
                </div>
            </div>
        @endif

        @if($errors->any())
            <div class="rounded-md bg-red-50 p-4 border border-red-200">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <ul class="text-sm text-red-800 list-disc list-inside">
                            @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                </div>
            </div>
        @endif

        <form class="mt-8 space-y-6" action="{{ route('login.post') }}" method="POST">
            @csrf
            
            <div class="rounded-md shadow-sm -space-y-px">
                <div>
                    <label for="email" class="sr-only">Email</label>
                    <input 
                        id="email" 
                        name="email" 
                        type="email" 
                        autocomplete="email" 
                        required 
                        value="{{ old('email') }}"
                        class="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm" 
                        style="focus:ring-color: {{ $theme['primary'] ?? '#3b82f6' }}; focus:border-color: {{ $theme['primary'] ?? '#3b82f6' }};"
                        placeholder="Indirizzo email"
                    >
                </div>
                <div>
                    <label for="password" class="sr-only">Password</label>
                    <input 
                        id="password" 
                        name="password" 
                        type="password" 
                        autocomplete="current-password" 
                        required 
                        class="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm" 
                        style="focus:ring-color: {{ $theme['primary'] ?? '#3b82f6' }}; focus:border-color: {{ $theme['primary'] ?? '#3b82f6' }};"
                        placeholder="Password"
                    >
                </div>
            </div>

            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <input 
                        id="remember" 
                        name="remember" 
                        type="checkbox" 
                        class="h-4 w-4 rounded border-gray-300 focus:ring-2" 
                        style="color: {{ $theme['primary'] ?? '#3b82f6' }}; focus:ring-color: {{ $theme['primary'] ?? '#3b82f6' }};"
                    >
                    <label for="remember" class="ml-2 block text-sm" style="color: {{ $theme['text'] ?? '#1f2937' }};">
                        Ricordami
                    </label>
                </div>

                <div class="text-sm">
                    <a href="#" class="font-medium hover:opacity-80" style="color: {{ $theme['primary'] ?? '#3b82f6' }};">
                        Password dimenticata?
                    </a>
                </div>
            </div>

            <div>
                <button 
                    type="submit" 
                    class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition"
                    style="background-color: {{ $theme['primary'] ?? '#3b82f6' }}; focus:ring-color: {{ $theme['primary'] ?? '#3b82f6' }};"
                >
                    <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style="opacity: 0.7;">
                            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                        </svg>
                    </span>
                    Accedi
                </button>
            </div>
        </form>
    </div>
</div>
@endsection
