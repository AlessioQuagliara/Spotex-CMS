<?php

namespace App\Policies;

use App\Models\Coupon;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class CouponPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function view(User $user, Coupon $coupon): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($coupon->store_id);
    }

    public function create(User $user): bool
    {
        return $this->backofficeWithStore($user);
    }

    public function update(User $user, Coupon $coupon): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($coupon->store_id);
    }

    public function delete(User $user, Coupon $coupon): bool
    {
        return $this->backofficeWithStore($user) && $this->sameStore($coupon->store_id);
    }
}
