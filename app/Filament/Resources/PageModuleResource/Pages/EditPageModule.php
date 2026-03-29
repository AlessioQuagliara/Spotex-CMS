<?php

namespace App\Filament\Resources\PageModuleResource\Pages;

use App\Filament\Resources\PageModuleResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditPageModule extends EditRecord
{
    protected static string $resource = PageModuleResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
