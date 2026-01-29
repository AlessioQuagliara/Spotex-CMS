<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use App\Models\Setting;
use App\Models\Page;

class ThemeService
{
    public static function getTheme($name = null)
    {
        $name = $name ?? Setting::get('theme', 'default');
        $path = resource_path("themes/{$name}.json");

        if (!File::exists($path)) {
            $defaultPath = resource_path('themes/default.json');
            return File::exists($defaultPath) ? json_decode(File::get($defaultPath), true) : [];
        }

        return json_decode(File::get($path), true);
    }

    public static function applyTheme($themeName)
    {
        $theme = self::getTheme($themeName);

        // Salva il tema nelle impostazioni
        Setting::set('theme', $themeName);
        Setting::set('business_name', $theme['business_name'] ?? 'La Tua Attività');

        // Crea le pagine del tema
        if (isset($theme['pages']) && is_array($theme['pages'])) {
            foreach ($theme['pages'] as $pageData) {
                $htmlContent = $pageData['html_content'] ?? '';
                
                // Se non ci sono builder_data ma c'è html_content, crea un elemento html-block
                $builderData = $pageData['builder_data'] ?? [];
                if (empty($builderData) && !empty($htmlContent)) {
                    $builderData = [
                        [
                            'id' => '0',
                            'type' => 'html-block',
                            'content' => $htmlContent,
                            'x' => 0,
                            'y' => 0,
                            'width' => 1200,
                            'height' => 400,
                            'styles' => ['backgroundColor' => 'transparent']
                        ]
                    ];
                }
                
                $page = Page::where('slug', $pageData['slug'])
                    ->orWhere('title', $pageData['title'])
                    ->first();

                if ($page) {
                    $page->update([
                        'slug' => $pageData['slug'],
                        'title' => $pageData['title'],
                        'description' => $pageData['description'] ?? '',
                        'html_content' => $htmlContent,
                        'builder_data' => $builderData,
                        'is_published' => true,
                    ]);
                } else {
                    Page::create([
                        'slug' => $pageData['slug'],
                        'title' => $pageData['title'],
                        'description' => $pageData['description'] ?? '',
                        'html_content' => $htmlContent,
                        'builder_data' => $builderData,
                        'is_published' => true,
                    ]);
                }
            }
        }

        return true;
    }

    public static function getAvailableThemes()
    {
        $path = resource_path('themes');
        if (!File::isDirectory($path)) {
            File::makeDirectory($path, 0755, true);
        }

        $files = File::files($path);
        $themes = [];

        foreach ($files as $file) {
            if ($file->getExtension() === 'json') {
                $name = $file->getBasename('.json');
                $data = json_decode(File::get($file->getRealPath()), true);
                $themes[$name] = $data['name'] ?? $name;
            }
        }

        return $themes;
    }

    public static function getBlocksByTheme($themeName = null)
    {
        $theme = self::getTheme($themeName);
        return $theme['blocks'] ?? [];
    }
}
