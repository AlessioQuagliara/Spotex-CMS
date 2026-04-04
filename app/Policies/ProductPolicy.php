<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class ProductPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, Product $product): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($product->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, Product $product): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($product->store_id);
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($product->store_id);
    }
}
