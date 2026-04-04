<?php

namespace App\Services\Inventory;

use App\Models\InventoryLedger;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\ProductVariant;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class InventoryLedgerService
{
    public function record(
        ProductVariant $variant,
        InventoryLocation $location,
        string $eventType,
        int $qtyDelta,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $idempotencyKey = null,
    ): InventoryLedger {
        $this->assertValidContext($variant, $location);

        $normalizedQtyDelta = $this->normalizeQtyDelta($eventType, $qtyDelta);

        return DB::transaction(function () use (
            $variant,
            $location,
            $eventType,
            $normalizedQtyDelta,
            $referenceType,
            $referenceId,
            $idempotencyKey
        ): InventoryLedger {
            if ($idempotencyKey !== null && $idempotencyKey !== '') {
                $existing = InventoryLedger::query()
                    ->withoutGlobalScopes()
                    ->where('store_id', $variant->store_id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existing !== null) {
                    return $existing;
                }
            }

            $level = $this->lockInventoryLevel($variant, $location);

            [$onHand, $reserved] = $this->applyMovement(
                eventType: $eventType,
                qtyDelta: $normalizedQtyDelta,
                onHand: (int) $level->on_hand,
                reserved: (int) $level->reserved,
            );

            if ($onHand < 0 || $reserved < 0 || ($onHand - $reserved) < 0) {
                throw new RuntimeException('Inventory underflow detected for requested movement.');
            }

            try {
                $ledger = InventoryLedger::query()->withoutGlobalScopes()->create([
                    'store_id' => $variant->store_id,
                    'variant_id' => $variant->id,
                    'location_id' => $location->id,
                    'event_type' => $eventType,
                    'qty_delta' => $normalizedQtyDelta,
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                    'idempotency_key' => $idempotencyKey,
                ]);
            } catch (QueryException $exception) {
                if ($idempotencyKey === null || $idempotencyKey === '') {
                    throw $exception;
                }

                $existing = InventoryLedger::query()
                    ->withoutGlobalScopes()
                    ->where('store_id', $variant->store_id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existing !== null) {
                    return $existing;
                }

                throw $exception;
            }

            $level->on_hand = $onHand;
            $level->reserved = $reserved;
            $level->available = $onHand - $reserved;
            $level->save();

            return $ledger;
        });
    }

    private function assertValidContext(ProductVariant $variant, InventoryLocation $location): void
    {
        if ((int) $variant->store_id !== (int) $location->store_id) {
            throw new InvalidArgumentException('Variant and location must belong to the same store.');
        }
    }

    private function lockInventoryLevel(ProductVariant $variant, InventoryLocation $location): InventoryLevel
    {
        $baseQuery = InventoryLevel::query()
            ->withoutGlobalScopes()
            ->where('store_id', $variant->store_id)
            ->where('variant_id', $variant->id)
            ->where('location_id', $location->id);

        $level = (clone $baseQuery)->lockForUpdate()->first();

        if ($level !== null) {
            return $level;
        }

        try {
            InventoryLevel::query()->withoutGlobalScopes()->create([
                'store_id' => $variant->store_id,
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'on_hand' => 0,
                'reserved' => 0,
                'available' => 0,
            ]);
        } catch (QueryException) {
            // The row may have been inserted in a concurrent transaction.
        }

        return (clone $baseQuery)->lockForUpdate()->firstOrFail();
    }

    /**
     * @return array{int, int}
     */
    private function applyMovement(string $eventType, int $qtyDelta, int $onHand, int $reserved): array
    {
        switch ($eventType) {
            case InventoryLedger::EVENT_RESTOCK:
            case InventoryLedger::EVENT_ADJUST:
                $onHand += $qtyDelta;
                break;

            case InventoryLedger::EVENT_SALE:
                $onHand += $qtyDelta;
                $reserved = max(0, $reserved + $qtyDelta);
                break;

            case InventoryLedger::EVENT_RESERVE:
            case InventoryLedger::EVENT_RELEASE:
                $reserved += $qtyDelta;
                break;

            default:
                throw new InvalidArgumentException(sprintf('Unsupported inventory event type "%s".', $eventType));
        }

        return [$onHand, $reserved];
    }

    private function normalizeQtyDelta(string $eventType, int $qtyDelta): int
    {
        if (!in_array($eventType, InventoryLedger::eventTypes(), true)) {
            throw new InvalidArgumentException(sprintf('Unsupported inventory event type "%s".', $eventType));
        }

        if ($qtyDelta === 0) {
            throw new InvalidArgumentException('Inventory movement quantity cannot be zero.');
        }

        if ($eventType === InventoryLedger::EVENT_ADJUST) {
            return $qtyDelta;
        }

        $absQty = abs($qtyDelta);

        return match ($eventType) {
            InventoryLedger::EVENT_RESTOCK, InventoryLedger::EVENT_RESERVE => $absQty,
            InventoryLedger::EVENT_SALE, InventoryLedger::EVENT_RELEASE => -$absQty,
            default => throw new InvalidArgumentException(sprintf('Unsupported inventory event type "%s".', $eventType)),
        };
    }
}
