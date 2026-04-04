<?php

namespace App\Services\Inventory;

use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InventoryReservationService
{
    public function __construct(private readonly InventoryLedgerService $ledgerService)
    {
    }

    public function reserveForOrder(Order $order, ?CarbonInterface $expiresAt = null): int
    {
        return DB::transaction(function () use ($order, $expiresAt): int {
            $this->releaseForOrder($order, InventoryReservation::STATUS_RELEASED, 'replaced');

            $items = $order->items()
                ->with(['variant', 'product'])
                ->orderBy('id')
                ->get();

            if ($items->isEmpty()) {
                return 0;
            }

            $expiry = $expiresAt ?? now()->addMinutes((int) config('spotex.inventory.reservation_ttl_minutes', 15));
            $reservedCount = 0;

            foreach ($items as $item) {
                $variant = $this->resolveVariantForItem($item);

                if ($variant === null) {
                    throw new RuntimeException(sprintf('Nessuna variante disponibile per order_item #%d.', $item->id));
                }

                $level = $this->resolveLevelForReservation($order->store_id, $variant->id, (int) $item->quantity);

                if ($level === null) {
                    throw new RuntimeException(sprintf('Stock insufficiente per la variante #%d.', $variant->id));
                }

                /** @var InventoryLocation $location */
                $location = InventoryLocation::query()->withoutGlobalScopes()->findOrFail($level->location_id);

                $this->ledgerService->record(
                    variant: $variant,
                    location: $location,
                    eventType: \App\Models\InventoryLedger::EVENT_RESERVE,
                    qtyDelta: (int) $item->quantity,
                    referenceType: 'order',
                    referenceId: (int) $order->id,
                    idempotencyKey: sprintf('order:%d:item:%d:reserve', $order->id, $item->id),
                );

                InventoryReservation::query()->withoutGlobalScopes()->create([
                    'store_id' => (int) $order->store_id,
                    'variant_id' => (int) $variant->id,
                    'location_id' => (int) $location->id,
                    'order_id' => (int) $order->id,
                    'qty' => (int) $item->quantity,
                    'expires_at' => $expiry,
                    'status' => InventoryReservation::STATUS_ACTIVE,
                ]);

                $item->forceFill([
                    'variant_id' => (int) $variant->id,
                    'inventory_location_id' => (int) $location->id,
                ])->save();

                $reservedCount++;
            }

            $order->forceFill([
                'inventory_reservation_expires_at' => $expiry,
            ])->save();

            return $reservedCount;
        });
    }

    public function releaseForOrder(Order $order, string $status = InventoryReservation::STATUS_RELEASED, string $reason = 'manual'): int
    {
        return DB::transaction(function () use ($order, $status, $reason): int {
            $reservations = InventoryReservation::query()
                ->withoutGlobalScopes()
                ->where('order_id', $order->id)
                ->where('status', InventoryReservation::STATUS_ACTIVE)
                ->lockForUpdate()
                ->get();

            if ($reservations->isEmpty()) {
                return 0;
            }

            $released = 0;

            foreach ($reservations as $reservation) {
                $variant = ProductVariant::query()->withoutGlobalScopes()->find($reservation->variant_id);
                $location = InventoryLocation::query()->withoutGlobalScopes()->find($reservation->location_id);

                if ($variant !== null && $location !== null) {
                    $this->ledgerService->record(
                        variant: $variant,
                        location: $location,
                        eventType: \App\Models\InventoryLedger::EVENT_RELEASE,
                        qtyDelta: (int) $reservation->qty,
                        referenceType: 'reservation',
                        referenceId: (int) $reservation->id,
                        idempotencyKey: sprintf('reservation:%d:release', $reservation->id),
                    );
                }

                $reservation->forceFill([
                    'status' => $status,
                    'released_at' => now(),
                    'release_reason' => $reason,
                ])->save();

                $released++;
            }

            $order->forceFill([
                'inventory_reservation_expires_at' => null,
            ])->save();

            return $released;
        });
    }

    public function convertReservationsToSale(Order $order): int
    {
        return DB::transaction(function () use ($order): int {
            $reservations = InventoryReservation::query()
                ->withoutGlobalScopes()
                ->where('order_id', $order->id)
                ->where('status', InventoryReservation::STATUS_ACTIVE)
                ->lockForUpdate()
                ->get();

            if ($reservations->isEmpty()) {
                return 0;
            }

            $converted = 0;

            foreach ($reservations as $reservation) {
                $variant = ProductVariant::query()->withoutGlobalScopes()->find($reservation->variant_id);
                $location = InventoryLocation::query()->withoutGlobalScopes()->find($reservation->location_id);

                if ($variant !== null && $location !== null) {
                    $this->ledgerService->record(
                        variant: $variant,
                        location: $location,
                        eventType: \App\Models\InventoryLedger::EVENT_SALE,
                        qtyDelta: (int) $reservation->qty,
                        referenceType: 'reservation',
                        referenceId: (int) $reservation->id,
                        idempotencyKey: sprintf('reservation:%d:sale', $reservation->id),
                    );
                }

                $reservation->forceFill([
                    'status' => InventoryReservation::STATUS_CONVERTED,
                    'released_at' => now(),
                    'release_reason' => 'paid',
                ])->save();

                $converted++;
            }

            $order->forceFill([
                'inventory_reservation_expires_at' => null,
            ])->save();

            return $converted;
        });
    }

    public function releaseExpiredReservations(?int $storeId = null, int $limit = 200): int
    {
        $releasedTotal = 0;

        do {
            $releasedNow = DB::transaction(function () use ($storeId, $limit): int {
                $query = InventoryReservation::query()
                    ->withoutGlobalScopes()
                    ->where('status', InventoryReservation::STATUS_ACTIVE)
                    ->where('expires_at', '<=', now())
                    ->orderBy('id')
                    ->limit($limit)
                    ->lockForUpdate();

                if ($storeId !== null) {
                    $query->where('store_id', $storeId);
                }

                $reservations = $query->get();

                if ($reservations->isEmpty()) {
                    return 0;
                }

                $released = 0;

                foreach ($reservations as $reservation) {
                    $variant = ProductVariant::query()->withoutGlobalScopes()->find($reservation->variant_id);
                    $location = InventoryLocation::query()->withoutGlobalScopes()->find($reservation->location_id);

                    if ($variant !== null && $location !== null) {
                        $this->ledgerService->record(
                            variant: $variant,
                            location: $location,
                            eventType: \App\Models\InventoryLedger::EVENT_RELEASE,
                            qtyDelta: (int) $reservation->qty,
                            referenceType: 'reservation',
                            referenceId: (int) $reservation->id,
                            idempotencyKey: sprintf('reservation:%d:release', $reservation->id),
                        );
                    }

                    $reservation->forceFill([
                        'status' => InventoryReservation::STATUS_EXPIRED,
                        'released_at' => now(),
                        'release_reason' => 'expired',
                    ])->save();

                    $released++;
                }

                return $released;
            });

            $releasedTotal += $releasedNow;
        } while ($releasedNow > 0 && $releasedNow === $limit);

        return $releasedTotal;
    }

    private function resolveVariantForItem(OrderItem $item): ?ProductVariant
    {
        if ($item->variant_id !== null) {
            return ProductVariant::query()->withoutGlobalScopes()->find($item->variant_id);
        }

        if ($item->product_id === null) {
            return null;
        }

        return ProductVariant::query()
            ->withoutGlobalScopes()
            ->where('product_id', $item->product_id)
            ->where('store_id', $item->store_id)
            ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
            ->orderBy('id')
            ->first();
    }

    private function resolveLevelForReservation(int $storeId, int $variantId, int $requiredQty): ?InventoryLevel
    {
        return InventoryLevel::query()
            ->withoutGlobalScopes()
            ->select('inventory_levels.*')
            ->join('inventory_locations', 'inventory_locations.id', '=', 'inventory_levels.location_id')
            ->where('inventory_levels.store_id', $storeId)
            ->where('inventory_levels.variant_id', $variantId)
            ->where('inventory_locations.is_active', true)
            ->where('inventory_levels.available', '>=', $requiredQty)
            ->orderBy('inventory_locations.priority')
            ->orderBy('inventory_levels.id')
            ->lockForUpdate()
            ->first();
    }
}
