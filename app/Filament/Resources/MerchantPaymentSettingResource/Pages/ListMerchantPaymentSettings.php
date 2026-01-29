<?php

namespace App\Filament\Resources\MerchantPaymentSettingResource\Pages;

use App\Filament\Resources\MerchantPaymentSettingResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Actions;

class ListMerchantPaymentSettings extends ListRecords
{
    protected static string $resource = MerchantPaymentSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
