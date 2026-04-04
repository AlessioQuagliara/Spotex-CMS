<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryLedger;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\ProductVariant;
use App\Services\Inventory\InventoryLedgerService;
use App\Support\Api\V1\ApiResponse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryLedgerService $inventoryLedgerService,
        private readonly TenantContext $tenantContext,
    ) {
    }

    public function levels(Request $request)
    {
        $validated = $request->validate([
            'variant_id' => 'nullable|integer',
            'location_id' => 'nullable|integer',
            'sort' => 'nullable|in:id,available,on_hand,reserved,updated_at,created_at',
            'direction' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:' . (int) config('spotex.api.v1.pagination.max_per_page', 100),
        ]);

        $sort = (string) ($validated['sort'] ?? 'id');
        $direction = (string) ($validated['direction'] ?? 'asc');
        $perPage = (int) ($validated['per_page'] ?? (int) config('spotex.api.v1.pagination.default_per_page', 20));

        $query = InventoryLevel::query()->with([
            'variant:id,product_id,sku,status,price',
            'location:id,name,code,is_active',
        ]);

        if (array_key_exists('variant_id', $validated) && $validated['variant_id'] !== null) {
            $query->where('variant_id', (int) $validated['variant_id']);
        }

        if (array_key_exists('location_id', $validated) && $validated['location_id'] !== null) {
            $query->where('location_id', (int) $validated['location_id']);
        }

        $paginator = $query
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        $items = $paginator->getCollection()
            ->map(fn (InventoryLevel $level): array => $this->transformLevel($level))
            ->values()
            ->all();

        return ApiResponse::paginated(
            paginator: $paginator,
            items: $items,
            meta: [
                'filters' => [
                    'variant_id' => $validated['variant_id'] ?? null,
                    'location_id' => $validated['location_id'] ?? null,
                    'sort' => $sort,
                    'direction' => $direction,
                ],
            ]
        );
    }

    public function movement(Request $request)
    {
        $storeId = $this->tenantContext->storeId();
        if ($storeId === null) {
            return ApiResponse::error(
                code: 'store_context_required',
                message: 'Store context is required.',
                status: 400
            );
        }

        $validated = $request->validate([
            'variant_id' => 'required|integer',
            'location_id' => 'required|integer',
            'event_type' => 'required|string|in:' . implode(',', InventoryLedger::eventTypes()),
            'quantity' => 'required|integer|not_in:0',
            'reference_type' => 'nullable|string|max:120',
            'reference_id' => 'nullable|integer|min:1',
        ]);

        $variant = ProductVariant::query()->whereKey((int) $validated['variant_id'])->first();
        if ($variant === null) {
            return ApiResponse::error(
                code: 'validation_error',
                message: 'Invalid variant_id for current store.',
                status: 422,
                errorDetails: ['fields' => ['variant_id' => ['Invalid variant_id for current store.']]]
            );
        }

        $location = InventoryLocation::query()->whereKey((int) $validated['location_id'])->first();
        if ($location === null) {
            return ApiResponse::error(
                code: 'validation_error',
                message: 'Invalid location_id for current store.',
                status: 422,
                errorDetails: ['fields' => ['location_id' => ['Invalid location_id for current store.']]]
            );
        }

        $eventType = (string) $validated['event_type'];
        $quantity = (int) $validated['quantity'];

        if ($eventType !== InventoryLedger::EVENT_ADJUST && $quantity < 1) {
            return ApiResponse::error(
                code: 'validation_error',
                message: 'quantity must be positive for the selected event_type.',
                status: 422,
                errorDetails: ['fields' => ['quantity' => ['quantity must be positive for the selected event_type.']]]
            );
        }

        $ledgerIdempotencyKey = $this->deriveLedgerIdempotencyKey($request, $storeId);

        try {
            $entry = $this->inventoryLedgerService->record(
                variant: $variant,
                location: $location,
                eventType: $eventType,
                qtyDelta: $quantity,
                referenceType: array_key_exists('reference_type', $validated) ? $validated['reference_type'] : null,
                referenceId: array_key_exists('reference_id', $validated) ? (int) $validated['reference_id'] : null,
                idempotencyKey: $ledgerIdempotencyKey,
            );
        } catch (RuntimeException $exception) {
            return ApiResponse::error(
                code: 'inventory_underflow',
                message: $exception->getMessage(),
                status: 409
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error(
                code: 'validation_error',
                message: $exception->getMessage(),
                status: 422
            );
        }

        $level = InventoryLevel::query()
            ->with([
                'variant:id,product_id,sku,status,price',
                'location:id,name,code,is_active',
            ])
            ->where('variant_id', $entry->variant_id)
            ->where('location_id', $entry->location_id)
            ->first();

        return ApiResponse::success([
            'movement' => [
                'id' => (int) $entry->id,
                'store_id' => (int) $entry->store_id,
                'variant_id' => (int) $entry->variant_id,
                'location_id' => (int) $entry->location_id,
                'event_type' => (string) $entry->event_type,
                'qty_delta' => (int) $entry->qty_delta,
                'reference_type' => $entry->reference_type !== null ? (string) $entry->reference_type : null,
                'reference_id' => $entry->reference_id !== null ? (int) $entry->reference_id : null,
                'idempotency_key' => $entry->idempotency_key !== null ? (string) $entry->idempotency_key : null,
                'created_at' => $entry->created_at?->toIso8601String(),
            ],
            'level' => $level !== null ? $this->transformLevel($level) : null,
        ], status: 201);
    }

    private function deriveLedgerIdempotencyKey(Request $request, int $storeId): ?string
    {
        $headerName = (string) config('spotex.api.v1.idempotency.header', 'Idempotency-Key');
        $headerValue = trim((string) $request->header($headerName, ''));

        if ($headerValue === '') {
            return null;
        }

        return 'api_v1_inv_' . substr(hash(
            'sha256',
            implode('|', [
                $storeId,
                $request->method(),
                $request->path(),
                $headerValue,
            ])
        ), 0, 64);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformLevel(InventoryLevel $level): array
    {
        return [
            'id' => (int) $level->id,
            'store_id' => (int) $level->store_id,
            'variant_id' => (int) $level->variant_id,
            'location_id' => (int) $level->location_id,
            'on_hand' => (int) $level->on_hand,
            'reserved' => (int) $level->reserved,
            'available' => (int) $level->available,
            'variant' => $level->relationLoaded('variant') && $level->variant !== null ? [
                'id' => (int) $level->variant->id,
                'product_id' => (int) $level->variant->product_id,
                'sku' => (string) $level->variant->sku,
                'status' => (string) $level->variant->status,
                'price' => (float) $level->variant->price,
            ] : null,
            'location' => $level->relationLoaded('location') && $level->location !== null ? [
                'id' => (int) $level->location->id,
                'name' => (string) $level->location->name,
                'code' => (string) $level->location->code,
                'is_active' => (bool) $level->location->is_active,
            ] : null,
            'created_at' => $level->created_at?->toIso8601String(),
            'updated_at' => $level->updated_at?->toIso8601String(),
        ];
    }
}
