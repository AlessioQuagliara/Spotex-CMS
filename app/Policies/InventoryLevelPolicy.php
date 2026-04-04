<?php

namespace App\Policies;

use App\Models\InventoryLevel;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class InventoryLevelPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, InventoryLevel $inventoryLevel): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($inventoryLevel->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, InventoryLevel $inventoryLevel): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($inventoryLevel->store_id);
    }

    public function delete(User $user, InventoryLevel $inventoryLevel): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($inventoryLevel->store_id);
    }
}
