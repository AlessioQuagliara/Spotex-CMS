<?php

namespace App\Livewire;

use App\Models\Setting;
use App\Services\ThemeService;
use Livewire\Component;
use Livewire\Attributes\On;
use Illuminate\Support\Facades\File;
use Filament\Notifications\Notification;

class ThemeSelectorModal extends Component
{
    public ?string $selectedTheme = null;
    public array $themes = [];
    public ?string $showPreviewModal = null;

    public function mount()
    {
        $this->selectedTheme = Setting::get('theme', 'default');
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
        $this->selectedTheme = $themeId;
        
        // Salva in background
        ThemeService::applyTheme($themeId);
        Setting::set('theme', $themeId);

        Notification::make()
            ->title('Tema selezionato!')
            ->body('Il tema è stato applicato.')
            ->success()
            ->send();
    }

    public function openPreview(string $themeId)
    {
        $this->showPreviewModal = $themeId;
    }

    public function closePreview()
    {
        $this->showPreviewModal = null;
    }

    public function render()
    {
        return view('livewire.theme-selector-modal');
    }
}