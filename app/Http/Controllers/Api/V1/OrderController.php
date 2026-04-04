<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Services\Inventory\InventoryReservationService;
use App\Services\Pricing\PriceResolver;
use App\Services\Tax\TaxCalculator;
use App\Support\Api\V1\ApiResponse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class OrderController extends Controller
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly PriceResolver $priceResolver,
        private readonly TaxCalculator $taxCalculator,
        private readonly InventoryReservationService $inventoryReservationService,
    ) {
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'q' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:32',
            'payment_status' => 'nullable|string|max:32',
            'shipping_status' => 'nullable|string|max:32',
            'user_id' => 'nullable|integer',
            'sort' => 'nullable|in:id,total,created_at,updated_at,paid_at',
            'direction' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:' . (int) config('spotex.api.v1.pagination.max_per_page', 100),
        ]);

        $search = trim((string) ($validated['q'] ?? ''));
        $sort = (string) ($validated['sort'] ?? 'id');
        $direction = (string) ($validated['direction'] ?? 'desc');
        $perPage = (int) ($validated['per_page'] ?? (int) config('spotex.api.v1.pagination.default_per_page', 20));

        $query = Order::query()->withCount('items');

        if (array_key_exists('status', $validated) && $validated['status'] !== null) {
            $query->where('status', (string) $validated['status']);
        }

        if (array_key_exists('payment_status', $validated) && $validated['payment_status'] !== null) {
            $query->where('payment_status', (string) $validated['payment_status']);
        }

        if (array_key_exists('shipping_status', $validated) && $validated['shipping_status'] !== null) {
            $query->where('shipping_status', (string) $validated['shipping_status']);
        }

        if (array_key_exists('user_id', $validated) && $validated['user_id'] !== null) {
            $query->where('user_id', (int) $validated['user_id']);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('transaction_id', 'like', '%' . $search . '%')
                    ->orWhere('provider_payment_id', 'like', '%' . $search . '%');

                if (is_numeric($search)) {
                    $builder->orWhere('id', (int) $search);
                }
            });
        }

        $paginator = $query
            ->orderBy($sort, $direction)
            ->orderBy('id', $direction === 'asc' ? 'asc' : 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $items = $paginator->getCollection()
            ->map(fn (Order $order): array => $this->transformOrderSummary($order))
            ->values()
            ->all();

        return ApiResponse::paginated(
            paginator: $paginator,
            items: $items,
            meta: [
                'filters' => [
                    'q' => $search !== '' ? $search : null,
                    'status' => $validated['status'] ?? null,
                    'payment_status' => $validated['payment_status'] ?? null,
                    'shipping_status' => $validated['shipping_status'] ?? null,
                    'user_id' => $validated['user_id'] ?? null,
                    'sort' => $sort,
                    'direction' => $direction,
                ],
            ],
        );
    }

    public function show(Order $order)
    {
        return ApiResponse::success([
            'item' => $this->transformOrderDetail(
                $order->loadMissing([
                    'user:id,name,email',
                    'items.variant:id,product_id,sku,status',
                    'items.product:id,name,slug',
                    'items.inventoryLocation:id,name,code',
                ])
            ),
        ]);
    }

    public function store(Request $request)
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
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'currency' => 'nullable|string|size:3',
            'shipping_cost' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_code' => 'nullable|string|max:120',
            'shipping_method' => 'nullable|string|max:120',
            'payment_method' => 'nullable|string|max:120',
            'shipping_address' => 'nullable|string|max:2000',
            'billing_address' => 'nullable|string|max:2000',
            'billing_same_as_shipping' => 'nullable|boolean',
            'billing_name' => 'nullable|string|max:255',
            'billing_company' => 'nullable|string|max:255',
            'billing_tax_id' => 'nullable|string|max:120',
            'notes' => 'nullable|string|max:5000',
            'shipping_country_code' => 'nullable|string|size:2',
            'shipping_region_code' => 'nullable|string|max:32',
            'shipping_postal_code' => 'nullable|string|max:32',
            'reserve_inventory' => 'nullable|boolean',
            'items' => 'required|array|min:1|max:200',
            'items.*.variant_id' => [
                'required',
                'integer',
                Rule::exists('product_variants', 'id')->where(
                    fn ($query) => $query->where('store_id', $storeId)
                ),
            ],
            'items.*.quantity' => 'required|integer|min:1|max:10000',
            'items.*.inventory_location_id' => [
                'nullable',
                'integer',
                Rule::exists('inventory_locations', 'id')->where(
                    fn ($query) => $query->where('store_id', $storeId)
                ),
            ],
        ]);

        $countryCode = $this->normalizeCountryCode($validated['shipping_country_code'] ?? null);
        $regionCode = $this->normalizeRegionCode($validated['shipping_region_code'] ?? null);
        $postalCode = $this->normalizePostalCode($validated['shipping_postal_code'] ?? null);

        try {
            $lineItems = $this->buildLineItems(
                storeId: $storeId,
                payloadItems: (array) $validated['items'],
                requestedCurrency: $validated['currency'] ?? null,
                countryCode: $countryCode
            );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            return ApiResponse::error(
                code: 'invalid_order_items',
                message: 'Unable to build order items from payload.',
                status: 422
            );
        }

        $taxBreakdown = $this->calculateTaxForLineItems($storeId, $lineItems, $countryCode, $regionCode, $postalCode);
        $subtotal = (float) array_reduce($lineItems, fn (float $sum, array $line): float => $sum + (float) $line['subtotal'], 0.0);
        $shippingCost = round((float) ($validated['shipping_cost'] ?? 0), 2);
        $discountAmount = round((float) ($validated['discount_amount'] ?? 0), 2);
        $taxTotal = round((float) ($taxBreakdown['tax_total'] ?? 0), 2);
        $total = round(max(0, $subtotal + $shippingCost + $taxTotal - $discountAmount), 2);
        $currency = (string) ($lineItems[0]['currency'] ?? $this->resolveStoreDefaultCurrency());
        $reserveInventory = (bool) ($validated['reserve_inventory'] ?? false);

        try {
            /** @var Order $order */
            $order = DB::transaction(function () use (
                $validated,
                $storeId,
                $lineItems,
                $taxBreakdown,
                $subtotal,
                $shippingCost,
                $discountAmount,
                $taxTotal,
                $total,
                $currency,
                $reserveInventory
            ): Order {
                $order = Order::query()->create([
                    'store_id' => $storeId,
                    'user_id' => $validated['user_id'] ?? null,
                    'status' => 'pending',
                    'payment_status' => 'pending',
                    'shipping_status' => 'not_shipped',
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'discount_amount' => $discountAmount,
                    'discount_code' => $validated['discount_code'] ?? null,
                    'shipping_method' => $validated['shipping_method'] ?? null,
                    'total' => $total,
                    'currency' => $currency,
                    'fx_rate' => 1,
                    'tax_total' => $taxTotal,
                    'payment_method' => $validated['payment_method'] ?? null,
                    'shipping_address' => (string) ($validated['shipping_address'] ?? ''),
                    'billing_address' => (string) ($validated['billing_address'] ?? ''),
                    'billing_same_as_shipping' => (bool) ($validated['billing_same_as_shipping'] ?? true),
                    'billing_name' => $validated['billing_name'] ?? null,
                    'billing_company' => $validated['billing_company'] ?? null,
                    'billing_tax_id' => $validated['billing_tax_id'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($lineItems as $index => $line) {
                    $taxLine = $taxBreakdown['items'][$index] ?? null;

                    OrderItem::query()->create([
                        'store_id' => $storeId,
                        'order_id' => (int) $order->id,
                        'product_id' => (int) $line['product_id'],
                        'variant_id' => (int) $line['variant_id'],
                        'inventory_location_id' => $line['inventory_location_id'] !== null ? (int) $line['inventory_location_id'] : null,
                        'tax_class_id' => $line['tax_class_id'] !== null ? (int) $line['tax_class_id'] : null,
                        'price_list_id' => $line['price_list_id'] !== null ? (int) $line['price_list_id'] : null,
                        'quantity' => (int) $line['quantity'],
                        'unit_price' => (float) $line['unit_price'],
                        'tax_rate_snapshot' => $taxLine !== null ? (float) $taxLine['tax_rate_snapshot'] : 0,
                        'subtotal' => (float) $line['subtotal'],
                        'tax_amount' => $taxLine !== null ? (float) $taxLine['tax_amount'] : 0,
                    ]);
                }

                if ($reserveInventory) {
                    $this->inventoryReservationService->reserveForOrder($order);
                }

                return $order->fresh();
            });
        } catch (RuntimeException $exception) {
            return ApiResponse::error(
                code: 'inventory_reservation_failed',
                message: $exception->getMessage(),
                status: 409
            );
        }

        return ApiResponse::success(
            data: [
                'item' => $this->transformOrderDetail(
                    $order->loadMissing([
                        'user:id,name,email',
                        'items.variant:id,product_id,sku,status',
                        'items.product:id,name,slug',
                        'items.inventoryLocation:id,name,code',
                    ])
                ),
            ],
            status: 201
        );
    }

    /**
     * @param array<int, array<string, mixed>> $payloadItems
     * @return array<int, array<string, mixed>>
     */
    private function buildLineItems(
        int $storeId,
        array $payloadItems,
        ?string $requestedCurrency,
        ?string $countryCode
    ): array {
        $variantIds = collect($payloadItems)
            ->pluck('variant_id')
            ->filter(fn ($value) => is_numeric($value))
            ->map(fn ($value) => (int) $value)
            ->unique()
            ->values()
            ->all();

        $variants = ProductVariant::query()
            ->with(['product:id,name,slug,tax_class_id'])
            ->whereIn('id', $variantIds)
            ->get()
            ->keyBy('id');

        $defaultCurrency = $this->resolveStoreDefaultCurrency();
        $targetCurrency = $this->priceResolver->resolveStoreCurrency($storeId, $requestedCurrency, $defaultCurrency);
        $lines = [];

        foreach ($payloadItems as $index => $item) {
            $variantId = (int) $item['variant_id'];
            /** @var ProductVariant|null $variant */
            $variant = $variants->get($variantId);

            if ($variant === null || $variant->product === null) {
                throw ValidationException::withMessages([
                    "items.$index.variant_id" => ['Invalid variant_id for current store.'],
                ]);
            }

            $quantity = max(1, (int) ($item['quantity'] ?? 1));
            $price = $this->priceResolver->resolveVariantPrice(
                variant: $variant,
                requestedCurrency: $targetCurrency,
                countryCode: $countryCode,
                channel: 'online'
            );

            $unitPrice = round((float) $price['amount'], 2);

            $lines[] = [
                'key' => (string) $index,
                'product_id' => (int) $variant->product_id,
                'variant_id' => $variantId,
                'inventory_location_id' => isset($item['inventory_location_id']) && is_numeric($item['inventory_location_id'])
                    ? (int) $item['inventory_location_id']
                    : null,
                'tax_class_id' => is_numeric($variant->product->tax_class_id) ? (int) $variant->product->tax_class_id : null,
                'price_list_id' => is_numeric($price['price_list_id']) ? (int) $price['price_list_id'] : null,
                'currency' => (string) $price['currency'],
                'unit_price' => $unitPrice,
                'quantity' => $quantity,
                'subtotal' => round($unitPrice * $quantity, 2),
            ];
        }

        return $lines;
    }

    /**
     * @param array<int, array<string, mixed>> $lineItems
     * @return array{subtotal: float, tax_total: float, total: float, items: array<int, array<string, mixed>>}
     */
    private function calculateTaxForLineItems(
        int $storeId,
        array $lineItems,
        ?string $countryCode,
        ?string $regionCode,
        ?string $postalCode
    ): array {
        $taxLines = array_map(function (array $line): array {
            return [
                'key' => (string) ($line['key'] ?? ''),
                'tax_class_id' => is_numeric($line['tax_class_id'] ?? null) ? (int) $line['tax_class_id'] : null,
                'unit_price' => (float) ($line['unit_price'] ?? 0),
                'quantity' => max(1, (int) ($line['quantity'] ?? 1)),
            ];
        }, $lineItems);

        return $this->taxCalculator->calculateForLines(
            storeId: $storeId,
            lines: $taxLines,
            countryCode: $countryCode,
            regionCode: $regionCode,
            postalCode: $postalCode
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function transformOrderSummary(Order $order): array
    {
        return [
            'id' => (int) $order->id,
            'store_id' => (int) $order->store_id,
            'user_id' => $order->user_id !== null ? (int) $order->user_id : null,
            'status' => (string) $order->status,
            'payment_status' => (string) $order->payment_status,
            'shipping_status' => (string) $order->shipping_status,
            'transaction_id' => $order->transaction_id !== null ? (string) $order->transaction_id : null,
            'payment_method' => $order->payment_method !== null ? (string) $order->payment_method : null,
            'shipping_method' => $order->shipping_method !== null ? (string) $order->shipping_method : null,
            'currency' => $order->currency !== null ? (string) $order->currency : null,
            'subtotal' => (float) $order->subtotal,
            'shipping_cost' => (float) $order->shipping_cost,
            'tax_total' => (float) $order->tax_total,
            'discount_amount' => (float) $order->discount_amount,
            'total' => (float) $order->total,
            'items_count' => isset($order->items_count) ? (int) $order->items_count : null,
            'inventory_reservation_expires_at' => $order->inventory_reservation_expires_at?->toIso8601String(),
            'created_at' => $order->created_at?->toIso8601String(),
            'updated_at' => $order->updated_at?->toIso8601String(),
            'paid_at' => $order->paid_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformOrderDetail(Order $order): array
    {
        return array_merge($this->transformOrderSummary($order), [
            'user' => $order->relationLoaded('user') && $order->user !== null ? [
                'id' => (int) $order->user->id,
                'name' => (string) $order->user->name,
                'email' => (string) $order->user->email,
            ] : null,
            'shipping_address' => $order->shipping_address !== null ? (string) $order->shipping_address : null,
            'billing_address' => $order->billing_address !== null ? (string) $order->billing_address : null,
            'billing_same_as_shipping' => (bool) $order->billing_same_as_shipping,
            'billing_name' => $order->billing_name !== null ? (string) $order->billing_name : null,
            'billing_company' => $order->billing_company !== null ? (string) $order->billing_company : null,
            'billing_tax_id' => $order->billing_tax_id !== null ? (string) $order->billing_tax_id : null,
            'notes' => $order->notes !== null ? (string) $order->notes : null,
            'items' => $order->relationLoaded('items')
                ? $order->items->map(fn (OrderItem $item): array => $this->transformOrderItem($item))->values()->all()
                : [],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformOrderItem(OrderItem $item): array
    {
        return [
            'id' => (int) $item->id,
            'order_id' => (int) $item->order_id,
            'product_id' => $item->product_id !== null ? (int) $item->product_id : null,
            'product' => $item->relationLoaded('product') && $item->product !== null ? [
                'id' => (int) $item->product->id,
                'name' => (string) $item->product->name,
                'slug' => (string) $item->product->slug,
            ] : null,
            'variant_id' => $item->variant_id !== null ? (int) $item->variant_id : null,
            'variant' => $item->relationLoaded('variant') && $item->variant !== null ? [
                'id' => (int) $item->variant->id,
                'sku' => (string) $item->variant->sku,
                'status' => (string) $item->variant->status,
            ] : null,
            'inventory_location_id' => $item->inventory_location_id !== null ? (int) $item->inventory_location_id : null,
            'inventory_location' => $item->relationLoaded('inventoryLocation') && $item->inventoryLocation !== null ? [
                'id' => (int) $item->inventoryLocation->id,
                'name' => (string) $item->inventoryLocation->name,
                'code' => (string) $item->inventoryLocation->code,
            ] : null,
            'tax_class_id' => $item->tax_class_id !== null ? (int) $item->tax_class_id : null,
            'price_list_id' => $item->price_list_id !== null ? (int) $item->price_list_id : null,
            'quantity' => (int) $item->quantity,
            'unit_price' => (float) $item->unit_price,
            'tax_rate_snapshot' => (float) $item->tax_rate_snapshot,
            'subtotal' => (float) $item->subtotal,
            'tax_amount' => (float) $item->tax_amount,
            'created_at' => $item->created_at?->toIso8601String(),
            'updated_at' => $item->updated_at?->toIso8601String(),
        ];
    }

    private function normalizeCountryCode(mixed $countryCode): ?string
    {
        if (!is_string($countryCode)) {
            return null;
        }

        $normalized = strtoupper(trim($countryCode));
        if ($normalized === '' || strlen($normalized) !== 2) {
            return null;
        }

        return $normalized;
    }

    private function normalizeRegionCode(mixed $regionCode): ?string
    {
        if (!is_string($regionCode)) {
            return null;
        }

        $normalized = strtoupper(trim($regionCode));
        return $normalized === '' ? null : $normalized;
    }

    private function normalizePostalCode(mixed $postalCode): ?string
    {
        if (!is_string($postalCode)) {
            return null;
        }

        $normalized = strtoupper(trim($postalCode));
        return $normalized === '' ? null : $normalized;
    }

    private function resolveStoreDefaultCurrency(): string
    {
        $currency = (string) ($this->tenantContext->store()?->default_currency ?? 'EUR');
        $currency = strtoupper(trim($currency));

        if (strlen($currency) !== 3) {
            return 'EUR';
        }

        return $currency;
    }
}
