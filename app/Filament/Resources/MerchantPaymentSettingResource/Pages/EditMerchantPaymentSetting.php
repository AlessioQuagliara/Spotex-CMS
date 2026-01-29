<?php

namespace App\Filament\Resources\MerchantPaymentSettingResource\Pages;

use App\Filament\Resources\MerchantPaymentSettingResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditMerchantPaymentSetting extends EditRecord
{
    protected static string $resource = MerchantPaymentSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
