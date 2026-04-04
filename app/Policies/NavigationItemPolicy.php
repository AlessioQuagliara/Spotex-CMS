<?php

namespace App\Policies;

use App\Models\NavigationItem;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class NavigationItemPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, NavigationItem $navigationItem): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($navigationItem->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, NavigationItem $navigationItem): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($navigationItem->store_id);
    }

    public function delete(User $user, NavigationItem $navigationItem): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($navigationItem->store_id);
    }
}
