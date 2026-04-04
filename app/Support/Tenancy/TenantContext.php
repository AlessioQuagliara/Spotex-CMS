<?php

namespace App\Support\Tenancy;

use App\Models\Store;

class TenantContext
{
    private ?Store $store = null;

    public function setStore(?Store $store): void
    {
        $this->store = $store;
    }

    public function clear(): void
    {
        $this->store = null;
    }

    public function store(): ?Store
    {
        return $this->store;
    }

    public function storeId(): ?int
    {
        return $this->store?->id;
    }

    public function hasStore(): bool
    {
        return $this->store !== null;
    }
}
