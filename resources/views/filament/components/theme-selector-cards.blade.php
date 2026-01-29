<div class="w-full">
    <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Seleziona un tema</h3>
        <p class="text-gray-600 text-sm mb-6">Clicca su una card per visualizzare un'anteprima della homepage</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        @foreach ($themes as $theme)
            <div
                wire:click="selectTheme('{{ $theme['id'] }}')"
                class="group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300
                    {{ $selected === $theme['id'] 
                        ? 'border-blue-600 shadow-xl bg-blue-50' 
                        : 'border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-md' }}"
            >
                <!-- Preview Container -->
                <div class="relative h-48 bg-gray-100 overflow-hidden border-b border-gray-200">
                    <!-- IFrame per il rendering del contenuto HTML -->
                    <iframe
                        srcdoc="{{ htmlspecialchars($theme['html_content'], ENT_QUOTES, 'UTF-8') }}"
                        class="w-full h-full scale-50 origin-top-left pointer-events-none"
                        style="width: 200%; height: 200%;"
                        sandbox="allow-same-origin"
                    ></iframe>
                    
                    <!-- Overlay per il checkmark -->
                    @if ($selected === $theme['id'])
                        <div class="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                            <div class="bg-blue-600 rounded-full p-3 text-white">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    @endif
                </div>

                <!-- Card Content -->
                <div class="p-6">
                    <h4 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                        {{ $theme['name'] }}
                    </h4>
                    
                    <p class="text-sm text-gray-600 mb-4 line-clamp-2">
                        {{ $theme['description'] }}
                    </p>

                    <!-- Color Preview -->
                    @if (!empty($theme['colors']))
                        <div class="flex items-center gap-2 mb-4">
                            <span class="text-xs font-semibold text-gray-700">Colori:</span>
                            <div class="flex gap-1">
                                @foreach (array_slice($theme['colors'], 0, 3) as $colorKey => $colorValue)
                                    @if (is_string($colorValue))
                                        <div
                                            class="w-5 h-5 rounded-full border border-gray-300 shadow-sm"
                                            style="background-color: {{ $colorValue }}"
                                            title="{{ $colorKey }}"
                                        ></div>
                                    @endif
                                @endforeach
                            </div>
                        </div>
                    @endif

                    <!-- Selection Button -->
                    <button
                        type="button"
                        wire:click="selectTheme('{{ $theme['id'] }}')"
                        class="w-full py-2 px-4 rounded-lg font-medium transition duration-200
                            {{ $selected === $theme['id']
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200' }}"
                    >
                        @if ($selected === $theme['id'])
                            ✓ Selezionato
                        @else
                            Seleziona tema
                        @endif
                    </button>
                </div>
            </div>
        @endforeach
    </div>

    <!-- Hidden input per passare il valore selezionato al form -->
    <input
        type="hidden"
        name="theme_selection"
        value="{{ $selected }}"
        wire:model.live="selected"
    />
</div>
