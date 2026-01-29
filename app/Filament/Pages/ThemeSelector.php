<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class ThemeSelector extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-swatch';
    protected static string $view = 'filament.pages.theme-selector';
    protected static ?string $title = 'Seleziona Tema';
    protected static ?string $navigationLabel = 'Seleziona Tema';
    protected static ?int $navigationSort = 0;

    public function getHeading(): string
    {
        return '';
    }
}
