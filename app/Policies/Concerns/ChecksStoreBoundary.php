<?php

namespace App\Policies\Concerns;

use App\Models\User;
use App\Support\Tenancy\TenantContext;

trait ChecksStoreBoundary
{
    protected function backofficeWithStore(User $user): bool
    {
        return $user->isBackofficeUser() && $this->currentStoreId() !== null;
    }

    protected function sameStore(?int $recordStoreId): bool
    {
        $storeId = $this->currentStoreId();

        return $storeId !== null && $recordStoreId !== null && $storeId === $recordStoreId;
    }

    protected function currentStoreId(): ?int
    {
        if (!app()->bound(TenantContext::class)) {
            return null;
        }

        /** @var TenantContext $context */
        $context = app(TenantContext::class);

        return $context->storeId();
    }
}
