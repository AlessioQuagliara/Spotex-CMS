<?php

namespace App\Policies;

use App\Models\InventoryReservation;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class InventoryReservationPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, InventoryReservation $inventoryReservation): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($inventoryReservation->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, InventoryReservation $inventoryReservation): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($inventoryReservation->store_id);
    }

    public function delete(User $user, InventoryReservation $inventoryReservation): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($inventoryReservation->store_id);
    }
}
