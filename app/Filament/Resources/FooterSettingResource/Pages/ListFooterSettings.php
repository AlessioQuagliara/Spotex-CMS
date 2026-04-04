<?php

namespace App\Filament\Resources\FooterSettingResource\Pages;

use App\Filament\Resources\FooterSettingResource;
use App\Models\Setting;
use App\Support\Tenancy\TenantContext;
use Filament\Resources\Pages\ListRecords;

class ListFooterSettings extends ListRecords
{
    protected static string $resource = FooterSettingResource::class;

    protected function getHeaderActions(): array
    {
        $storeId = $this->currentStoreId();
        if ($storeId === null) {
            return [];
        }

        if (Setting::where('key', 'business_powered_by')->where('store_id', $storeId)->exists()) {
            return [];
        }

        return parent::getHeaderActions();
    }

    private function currentStoreId(): ?int
    {
        if (!app()->bound(TenantContext::class)) {
            return null;
        }

        /** @var TenantContext $context */
        $context = app(TenantContext::class);

        return $context->storeId();
    }
}
