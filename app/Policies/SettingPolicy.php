<?php

namespace App\Policies;

use App\Models\Setting;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class SettingPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, Setting $setting): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($setting->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, Setting $setting): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($setting->store_id);
    }

    public function delete(User $user, Setting $setting): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($setting->store_id);
    }
}
