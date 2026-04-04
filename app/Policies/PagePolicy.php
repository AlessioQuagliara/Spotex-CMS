<?php

namespace App\Policies;

use App\Models\Page;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class PagePolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, Page $page): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($page->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, Page $page): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($page->store_id);
    }

    public function delete(User $user, Page $page): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($page->store_id);
    }
}
