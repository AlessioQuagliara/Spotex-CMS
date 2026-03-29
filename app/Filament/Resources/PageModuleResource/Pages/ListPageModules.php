<?php

namespace App\Filament\Resources\PageModuleResource\Pages;

use App\Filament\Resources\PageModuleResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListPageModules extends ListRecords
{
    protected static string $resource = PageModuleResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
