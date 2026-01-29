<div class="space-y-4">
    <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div>
            <p class="font-semibold text-gray-900">Tema attuale: <span class="text-blue-600">{{ ucfirst($currentTheme) }}</span></p>
            <p class="text-sm text-gray-600 mt-1">Clicca il bottone qui sotto per visualizzare e modificare il tema</p>
        </div>
        <a href="{{ route('filament.admin.pages.theme-selector') }}" class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Seleziona Tema
        </a>
    </div>
</div>
