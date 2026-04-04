<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class CategoryPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, Category $category): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($category->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, Category $category): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($category->store_id);
    }

    public function delete(User $user, Category $category): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($category->store_id);
    }
}
