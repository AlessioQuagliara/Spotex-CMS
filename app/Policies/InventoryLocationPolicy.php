<?php

namespace App\Policies;

use App\Models\InventoryLocation;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class InventoryLocationPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, InventoryLocation $inventoryLocation): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($inventoryLocation->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, InventoryLocation $inventoryLocation): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($inventoryLocation->store_id);
    }

    public function delete(User $user, InventoryLocation $inventoryLocation): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($inventoryLocation->store_id);
    }
}
