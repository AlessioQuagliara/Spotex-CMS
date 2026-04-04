<?php

namespace App\Policies;

use App\Models\ProductOption;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class ProductOptionPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, ProductOption $productOption): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($productOption->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, ProductOption $productOption): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($productOption->store_id);
    }

    public function delete(User $user, ProductOption $productOption): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($productOption->store_id);
    }
}
