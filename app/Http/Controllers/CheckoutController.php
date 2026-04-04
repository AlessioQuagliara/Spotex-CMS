<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\ShippingRule;
use App\Services\Inventory\InventoryReservationService;
use App\Services\Pricing\PriceResolver;
use App\Services\Tax\TaxCalculator;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly InventoryReservationService $inventoryReservationService,
        private readonly PriceResolver $priceResolver,
        private readonly TaxCalculator $taxCalculator,
    ) {
    }

    public function index(Request $request)
    {
        $cart = session()->get('cart', []);
        $requestedCurrency = $this->resolveRequestedCheckoutCurrency($request);
        $estimatedCountryCode = $this->resolveDefaultCountryCode();
        $lineItems = $this->buildOrderLinesFromCart($cart, $requestedCurrency, $estimatedCountryCode);

        if (empty($lineItems)) {
            return redirect()->route('cart.show');
        }

        $currency = (string) ($lineItems[0]['currency'] ?? $this->resolveStoreDefaultCurrency());
        $subtotal = $this->calculateSubtotal($lineItems);
        $shippingCost = 0.0;
        $discountAmount = 0.0;
        $taxBreakdown = $this->calculateTaxForLineItems($lineItems, $estimatedCountryCode, null, null);
        $taxTotal = (float) ($taxBreakdown['tax_total'] ?? 0);
        $total = max(0, $subtotal + $shippingCost + $taxTotal - $discountAmount);

        try {
            $order = DB::transaction(function () use ($subtotal, $shippingCost, $discountAmount, $taxTotal, $total, $lineItems, $taxBreakdown, $currency) {
                $this->releasePreviousCheckoutReservation();

                $order = Order::create([
                    'store_id' => $this->tenantContext->storeId(),
                    'user_id' => Auth::id() ?? null,
                    'status' => 'pending',
                    'payment_status' => 'pending',
                    'shipping_status' => 'not_shipped',
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'tax_total' => $taxTotal,
                    'discount_amount' => $discountAmount,
                    'discount_code' => null,
                    'shipping_method' => null,
                    'total' => $total,
                    'currency' => $currency,
                    'fx_rate' => 1,
                    'shipping_address' => '',
                    'billing_address' => '',
                ]);

                foreach ($lineItems as $index => $line) {
                    $taxLine = $taxBreakdown['items'][$index] ?? null;

                    OrderItem::create([
                        'store_id' => (int) $order->store_id,
                        'order_id' => (int) $order->id,
                        'product_id' => (int) $line['product_id'],
                        'variant_id' => (int) $line['variant_id'],
                        'inventory_location_id' => $line['inventory_location_id'] !== null ? (int) $line['inventory_location_id'] : null,
                        'tax_class_id' => $line['tax_class_id'] !== null ? (int) $line['tax_class_id'] : null,
                        'price_list_id' => $line['price_list_id'] !== null ? (int) $line['price_list_id'] : null,
                        'quantity' => (int) $line['quantity'],
                        'unit_price' => (float) $line['price'],
                        'tax_rate_snapshot' => $taxLine !== null ? (float) $taxLine['tax_rate_snapshot'] : 0,
                        'subtotal' => (float) $line['subtotal'],
                        'tax_amount' => $taxLine !== null ? (float) $taxLine['tax_amount'] : 0,
                    ]);
                }

                $this->inventoryReservationService->reserveForOrder($order);

                return $order->fresh('items');
            });
        } catch (RuntimeException $exception) {
            return redirect()
                ->route('cart.show')
                ->with('error', $exception->getMessage());
        }

        session()->put('checkout_order_id', $order->id);
        session()->put('checkout_currency', $currency);

        $shippingAddress = null;
        $billingAddress = null;
        $userFirstName = null;
        $userLastName = null;
        $userEmail = null;

        if (Auth::check()) {
            $user = Auth::user();
            $shippingAddress = $user->getShippingAddress();
            $billingAddress = $user->getBillingAddress();

            $nameParts = $this->splitName($user->name);
            $userFirstName = $nameParts['first'];
            $userLastName = $nameParts['last'];
            $userEmail = $user->email;
        }

        return view('checkout.index', [
            'order' => $order,
            'cart' => array_values($lineItems),
            'shippingAddress' => $shippingAddress,
            'billingAddress' => $billingAddress,
            'userFirstName' => $userFirstName,
            'userLastName' => $userLastName,
            'userEmail' => $userEmail,
            'checkoutCurrency' => $currency,
        ]);
    }

    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'shipping_address' => 'required|string',
            'shipping_city' => 'required|string',
            'shipping_zip' => 'required|string',
            'shipping_country' => 'required|string',
            'shipping_method' => 'required|string',
            'discount_code' => 'nullable|string',
            'billing_address' => 'nullable|string',
            'billing_city' => 'nullable|string',
            'billing_zip' => 'nullable|string',
            'billing_country' => 'nullable|string',
        ]);

        $order = Order::findOrFail($validated['order_id']);

        if ($order->user_id !== Auth::id()) {
            return response()->json(['success' => false], 403);
        }

        $countryCode = $this->normalizeCountryCode($validated['shipping_country']) ?? $this->resolveDefaultCountryCode();
        $postalCode = isset($validated['shipping_zip']) ? strtoupper(trim((string) $validated['shipping_zip'])) : null;

        try {
            DB::transaction(function () use ($order, $countryCode): void {
                if ($order->items()->exists()) {
                    if ($order->inventory_reservation_expires_at === null || $order->inventory_reservation_expires_at->isPast()) {
                        $this->inventoryReservationService->reserveForOrder($order);
                    }

                    return;
                }

                $lineItems = $this->buildOrderLinesFromCart(
                    session()->get('cart', []),
                    (string) ($order->currency ?: $this->resolveRequestedCheckoutCurrency()),
                    $countryCode
                );

                if (empty($lineItems)) {
                    throw new RuntimeException('Carrello vuoto');
                }

                $taxBreakdown = $this->calculateTaxForLineItems($lineItems, $countryCode, null, null);

                foreach ($lineItems as $index => $line) {
                    $taxLine = $taxBreakdown['items'][$index] ?? null;

                    OrderItem::create([
                        'store_id' => (int) $order->store_id,
                        'order_id' => (int) $order->id,
                        'product_id' => (int) $line['product_id'],
                        'variant_id' => (int) $line['variant_id'],
                        'inventory_location_id' => $line['inventory_location_id'] !== null ? (int) $line['inventory_location_id'] : null,
                        'tax_class_id' => $line['tax_class_id'] !== null ? (int) $line['tax_class_id'] : null,
                        'price_list_id' => $line['price_list_id'] !== null ? (int) $line['price_list_id'] : null,
                        'quantity' => (int) $line['quantity'],
                        'unit_price' => (float) $line['price'],
                        'tax_rate_snapshot' => $taxLine !== null ? (float) $taxLine['tax_rate_snapshot'] : 0,
                        'subtotal' => (float) $line['subtotal'],
                        'tax_amount' => $taxLine !== null ? (float) $taxLine['tax_amount'] : 0,
                    ]);
                }

                if ($order->currency === null) {
                    $order->forceFill([
                        'currency' => (string) ($lineItems[0]['currency'] ?? $this->resolveStoreDefaultCurrency()),
                        'fx_rate' => 1,
                    ])->save();
                }

                $this->inventoryReservationService->reserveForOrder($order);
            });
        } catch (RuntimeException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        $shippingAddress = "{$validated['shipping_address']}, {$validated['shipping_city']}, {$validated['shipping_zip']}, {$validated['shipping_country']}";

        $billingAddress = $shippingAddress;
        if (!empty($validated['billing_address'])) {
            $billingAddress = "{$validated['billing_address']}, {$validated['billing_city']}, {$validated['billing_zip']}, {$validated['billing_country']}";
        }

        $taxBreakdown = $this->recalculateOrderItemTaxes($order, $countryCode, null, $postalCode);

        $subtotal = (float) $order->items()->sum('subtotal');
        $shippingCost = $this->calculateShipping($validated['shipping_method'], $subtotal);
        $discountAmount = $this->calculateDiscount($validated['discount_code'] ?? null, $subtotal);
        $taxTotal = (float) ($taxBreakdown['tax_total'] ?? 0);
        $total = max(0, $subtotal + $shippingCost + $taxTotal - $discountAmount);
        $currency = $this->normalizeCurrencyCode($order->currency) ?? $this->resolveStoreDefaultCurrency();

        $order->update([
            'shipping_address' => $shippingAddress,
            'billing_address' => $billingAddress,
            'shipping_method' => $validated['shipping_method'],
            'discount_code' => $validated['discount_code'] ?? null,
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'tax_total' => $taxTotal,
            'discount_amount' => $discountAmount,
            'total' => $total,
            'currency' => $currency,
            'fx_rate' => 1,
        ]);

        session()->put('checkout_currency', $currency);

        return response()->json([
            'success' => true,
            'order_id' => $order->id,
            'currency' => $currency,
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'tax_total' => $taxTotal,
            'discount_amount' => $discountAmount,
            'total' => $total,
        ]);
    }

    private function splitName(string $fullName): array
    {
        $parts = explode(' ', trim($fullName), 2);

        return [
            'first' => $parts[0] ?? '',
            'last' => $parts[1] ?? '',
        ];
    }

    private function calculateSubtotal(array $cart): float
    {
        return array_reduce($cart, function ($total, $item) {
            return $total + ($item['price'] * $item['quantity']);
        }, 0);
    }

    private function calculateShipping(string $method, float $subtotal): float
    {
        $rule = ShippingRule::where('type', $method)->where('is_active', true)->first();

        if (!$rule) {
            return 0;
        }

        return $rule->calculateCost($subtotal);
    }

    private function calculateDiscount(?string $code, float $subtotal): float
    {
        if (!$code) {
            return 0.0;
        }

        $coupon = Coupon::where('code', strtoupper(trim($code)))
            ->where('is_active', true)
            ->first();

        if (!$coupon) {
            return 0.0;
        }

        return $coupon->calculateDiscount($subtotal);
    }

    /**
     * @param array<int|string, array<string, mixed>> $cart
     * @return array<int, array<string, mixed>>
     */
    private function buildOrderLinesFromCart(array $cart, ?string $requestedCurrency = null, ?string $countryCode = null): array
    {
        $storeId = $this->tenantContext->storeId();
        $lines = [];

        $targetCurrency = $storeId !== null
            ? $this->priceResolver->resolveStoreCurrency(
                $storeId,
                $requestedCurrency,
                $this->resolveStoreDefaultCurrency()
            )
            : ($this->normalizeCurrencyCode($requestedCurrency) ?? $this->resolveStoreDefaultCurrency());

        foreach ($cart as $item) {
            $variantId = isset($item['variant_id']) ? (int) $item['variant_id'] : null;
            $productId = isset($item['product_id']) ? (int) $item['product_id'] : (isset($item['id']) ? (int) $item['id'] : null);
            $quantity = max(1, (int) ($item['quantity'] ?? 1));

            $variantQuery = ProductVariant::query()
                ->with(['product.primaryImage'])
                ->when($variantId !== null, fn ($query) => $query->whereKey($variantId))
                ->when($variantId === null && $productId !== null, fn ($query) => $query->where('product_id', $productId));

            if ($storeId !== null) {
                $variantQuery->where('store_id', $storeId);
            }

            $variant = $variantQuery
                ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
                ->orderBy('id')
                ->first();

            if ($variant === null || $variant->product === null) {
                continue;
            }

            $price = $this->priceResolver->resolveVariantPrice(
                $variant,
                $targetCurrency,
                $countryCode,
                'online'
            );

            $resolvedUnitPrice = round((float) $price['amount'], 2);

            $lines[] = [
                'key' => (string) ($item['key'] ?? sprintf('v:%d', $variant->id)),
                'id' => (int) $variant->product->id,
                'product_id' => (int) $variant->product->id,
                'variant_id' => (int) $variant->id,
                'inventory_location_id' => isset($item['inventory_location_id']) ? (int) $item['inventory_location_id'] : null,
                'tax_class_id' => is_numeric($variant->product->tax_class_id) ? (int) $variant->product->tax_class_id : null,
                'price_list_id' => is_numeric($price['price_list_id']) ? (int) $price['price_list_id'] : null,
                'currency' => (string) $price['currency'],
                'name' => (string) $variant->product->name,
                'variant_label' => (string) ($item['variant_label'] ?? $variant->sku),
                'price' => $resolvedUnitPrice,
                'quantity' => $quantity,
                'subtotal' => round($resolvedUnitPrice * $quantity, 2),
                'image' => $variant->product->primaryImage?->image_path,
            ];
        }

        return $lines;
    }

    private function releasePreviousCheckoutReservation(): void
    {
        $previousOrderId = session()->get('checkout_order_id');

        if (!is_numeric($previousOrderId)) {
            return;
        }

        $query = Order::query()->whereKey((int) $previousOrderId)->where('payment_status', 'pending');

        if (Auth::id() !== null) {
            $query->where('user_id', Auth::id());
        }

        if ($this->tenantContext->storeId() !== null) {
            $query->where('store_id', $this->tenantContext->storeId());
        }

        $previousOrder = $query->first();

        if ($previousOrder === null) {
            return;
        }

        $this->inventoryReservationService->releaseForOrder($previousOrder, 'released', 'superseded_checkout');
    }

    /**
     * @param array<int, array<string, mixed>> $lineItems
     * @return array{subtotal: float, tax_total: float, total: float, items: array<int, array<string, mixed>>}
     */
    private function calculateTaxForLineItems(
        array $lineItems,
        ?string $countryCode,
        ?string $regionCode,
        ?string $postalCode
    ): array {
        $storeId = $this->tenantContext->storeId();
        if ($storeId === null) {
            return [
                'subtotal' => $this->calculateSubtotal($lineItems),
                'tax_total' => 0.0,
                'total' => $this->calculateSubtotal($lineItems),
                'items' => array_map(function (array $line): array {
                    return [
                        'key' => (string) ($line['key'] ?? ''),
                        'tax_class_id' => $line['tax_class_id'] ?? null,
                        'tax_rate_snapshot' => 0.0,
                        'tax_amount' => 0.0,
                        'is_inclusive' => false,
                    ];
                }, $lineItems),
            ];
        }

        $taxLines = array_map(function (array $line): array {
            return [
                'key' => (string) ($line['key'] ?? ''),
                'tax_class_id' => is_numeric($line['tax_class_id'] ?? null) ? (int) $line['tax_class_id'] : null,
                'unit_price' => (float) ($line['price'] ?? 0),
                'quantity' => max(1, (int) ($line['quantity'] ?? 1)),
            ];
        }, $lineItems);

        return $this->taxCalculator->calculateForLines(
            storeId: (int) $storeId,
            lines: $taxLines,
            countryCode: $countryCode,
            regionCode: $regionCode,
            postalCode: $postalCode
        );
    }

    /**
     * @return array{subtotal: float, tax_total: float, total: float, items: array<int, array<string, mixed>>}
     */
    private function recalculateOrderItemTaxes(
        Order $order,
        ?string $countryCode,
        ?string $regionCode,
        ?string $postalCode
    ): array {
        $items = $order->items()
            ->with(['product:id,tax_class_id'])
            ->orderBy('id')
            ->get();

        if ($items->isEmpty()) {
            return [
                'subtotal' => 0.0,
                'tax_total' => 0.0,
                'total' => 0.0,
                'items' => [],
            ];
        }

        $taxLines = [];

        foreach ($items as $item) {
            $taxClassId = $item->tax_class_id ?? $item->product?->tax_class_id;

            $taxLines[] = [
                'key' => (string) $item->id,
                'tax_class_id' => is_numeric($taxClassId) ? (int) $taxClassId : null,
                'unit_price' => (float) $item->unit_price,
                'quantity' => max(1, (int) $item->quantity),
            ];
        }

        $taxBreakdown = $this->taxCalculator->calculateForLines(
            storeId: (int) $order->store_id,
            lines: $taxLines,
            countryCode: $countryCode,
            regionCode: $regionCode,
            postalCode: $postalCode
        );

        foreach ($items as $index => $item) {
            $taxLine = $taxBreakdown['items'][$index] ?? null;
            if ($taxLine === null) {
                continue;
            }

            $item->forceFill([
                'tax_class_id' => is_numeric($taxLine['tax_class_id'] ?? null) ? (int) $taxLine['tax_class_id'] : $item->tax_class_id,
                'tax_rate_snapshot' => (float) ($taxLine['tax_rate_snapshot'] ?? 0),
                'tax_amount' => (float) ($taxLine['tax_amount'] ?? 0),
            ])->save();
        }

        return $taxBreakdown;
    }

    private function resolveRequestedCheckoutCurrency(?Request $request = null): ?string
    {
        if ($request !== null) {
            $queryCurrency = $this->normalizeCurrencyCode($request->query('currency'));
            if ($queryCurrency !== null) {
                session()->put('checkout_currency', $queryCurrency);
                return $queryCurrency;
            }
        }

        return $this->normalizeCurrencyCode(session()->get('checkout_currency'));
    }

    private function resolveStoreDefaultCurrency(): string
    {
        return $this->normalizeCurrencyCode($this->tenantContext->store()?->default_currency) ?? 'EUR';
    }

    private function resolveDefaultCountryCode(): string
    {
        $locale = (string) ($this->tenantContext->store()?->default_locale ?? '');
        if ($locale !== '') {
            $parts = preg_split('/[_-]/', $locale);
            $country = $parts !== false ? strtoupper((string) end($parts)) : null;

            if (is_string($country) && strlen($country) === 2) {
                return $country;
            }
        }

        return 'IT';
    }

    private function normalizeCurrencyCode(mixed $currency): ?string
    {
        if (!is_string($currency)) {
            return null;
        }

        $normalized = strtoupper(trim($currency));
        if ($normalized === '' || strlen($normalized) !== 3) {
            return null;
        }

        return $normalized;
    }

    private function normalizeCountryCode(mixed $country): ?string
    {
        if (!is_string($country)) {
            return null;
        }

        $normalized = strtoupper(trim($country));
        if ($normalized === '') {
            return null;
        }

        $map = [
            'ITALIA' => 'IT',
            'ITALY' => 'IT',
            'FRANCIA' => 'FR',
            'FRANCE' => 'FR',
            'GERMANIA' => 'DE',
            'GERMANY' => 'DE',
            'SPAGNA' => 'ES',
            'SPAIN' => 'ES',
        ];

        if (isset($map[$normalized])) {
            return $map[$normalized];
        }

        return strlen($normalized) === 2 ? $normalized : null;
    }
}
