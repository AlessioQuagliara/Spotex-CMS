<?php

namespace App\Filament\Components;

use Livewire\Component;
use App\Services\ThemeService;
use Illuminate\Support\Facades\File;

class ThemeSelectorCards extends Component
{
    public ?string $selected = null;
    public array $themes = [];

    public function mount(?string $selected = null)
    {
        $this->selected = $selected;
        $this->loadThemes();
    }

    public function loadThemes()
    {
        $themesPath = resource_path('themes');
        $themeFiles = File::files($themesPath);

        foreach ($themeFiles as $file) {
            if ($file->getExtension() === 'json') {
                $themeName = $file->getFilenameWithoutExtension();
                $themeData = json_decode(File::get($file->getPathname()), true);
                
                // Estrai la homepage
                $homePage = collect($themeData['pages'] ?? [])->firstWhere('slug', '') 
                    ?? collect($themeData['pages'] ?? [])->first();

                $this->themes[] = [
                    'id' => $themeName,
                    'name' => $themeData['name'] ?? $themeName,
                    'description' => $themeData['description'] ?? '',
                    'colors' => $themeData['colors'] ?? [],
                    'html_content' => $homePage['html_content'] ?? '<p>Nessun contenuto disponibile</p>',
                ];
            }
        }
    }

    public function selectTheme(string $themeId)
    {
        $this->selected = $themeId;
        $this->dispatch('theme-selected', theme: $themeId);
    }

    public function render()
    {
        return view('filament.components.theme-selector-cards');
    }
}
