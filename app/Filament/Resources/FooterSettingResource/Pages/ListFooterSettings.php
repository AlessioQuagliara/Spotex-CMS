<?php

namespace App\Filament\Resources\FooterSettingResource\Pages;

use App\Filament\Resources\FooterSettingResource;
use App\Models\Setting;
use Filament\Resources\Pages\ListRecords;

class ListFooterSettings extends ListRecords
{
    protected static string $resource = FooterSettingResource::class;

    protected function getHeaderActions(): array
    {
        if (Setting::where('key', 'business_powered_by')->exists()) {
            return [];
        }

        return parent::getHeaderActions();
    }
}
