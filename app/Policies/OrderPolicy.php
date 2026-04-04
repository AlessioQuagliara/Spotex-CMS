<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use App\Policies\Concerns\ChecksStoreBoundary;

class OrderPolicy
{
    use ChecksStoreBoundary;

    public function viewAny(User $user): bool
    {
        return $user->isBackofficeUser() && $this->currentStoreId() !== null;
    }

    public function view(User $user, Order $order): bool
    {
        if ($user->isBackofficeUser()) {
            return $this->sameStore($order->store_id);
        }

        return $user->id === $order->user_id && $this->canAccessCustomerOrder($order);
    }

    public function update(User $user, Order $order): bool
    {
        if ($user->isBackofficeUser()) {
            return $this->sameStore($order->store_id);
        }

        return $user->id === $order->user_id && $this->canAccessCustomerOrder($order);
    }

    private function canAccessCustomerOrder(Order $order): bool
    {
        $storeId = $this->currentStoreId();

        if ($storeId === null) {
            return true;
        }

        return $order->store_id === $storeId;
    }
}
