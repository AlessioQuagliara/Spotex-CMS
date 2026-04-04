<?php

namespace App\Policies;

use App\Models\ProductVariant;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class ProductVariantPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, ProductVariant $productVariant): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($productVariant->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, ProductVariant $productVariant): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($productVariant->store_id);
    }

    public function delete(User $user, ProductVariant $productVariant): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($productVariant->store_id);
    }
}
