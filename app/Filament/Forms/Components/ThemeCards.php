<?php

namespace App\Filament\Forms\Components;

use Filament\Forms\Components\Field;

class ThemeCards extends Field
{
    protected string $view = 'filament.forms.components.theme-cards';

    public array $themes = [];

    public function setUp(): void
    {
        parent::setUp();
        $this->loadThemes();
        
        // Passa i temi alla view
        $this->viewData([
            'themes' => $this->getThemes(),
        ]);
    }

    protected function loadThemes(): void
    {
        $themesPath = resource_path('themes');
        $themeFiles = \Illuminate\Support\Facades\File::files($themesPath);

        foreach ($themeFiles as $file) {
            if ($file->getExtension() === 'json') {
                $themeName = $file->getFilenameWithoutExtension();
                $themeData = json_decode(\Illuminate\Support\Facades\File::get($file->getPathname()), true);
                
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

    public function getThemes(): array
    {
        return $this->themes;
    }
}
