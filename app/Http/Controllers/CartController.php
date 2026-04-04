<?php

namespace App\Http\Controllers;

use App\Models\InventoryLevel;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function add(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'variant_id' => 'nullable|integer|exists:product_variants,id|required_without:product_id',
            'product_id' => 'nullable|integer|exists:products,id|required_without:variant_id',
            'quantity' => 'required|integer|min:1',
        ]);

        [$product, $variant] = $this->resolveProductAndVariant($validated);

        if ($product === null || $variant === null) {
            return response()->json([
                'success' => false,
                'message' => 'Variante prodotto non disponibile.',
            ], 422);
        }

        [$available, $locationId] = $this->resolveVariantAvailability($variant);

        if ($available <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Prodotto non disponibile o esaurito.',
            ], 422);
        }

        $cart = session()->get('cart', []);
        $cartKey = $this->cartKeyForVariant($variant->id);

        if (isset($cart[$cartKey])) {
            $newQty = (int) $cart[$cartKey]['quantity'] + (int) $validated['quantity'];
            if ($newQty > $available) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quantità richiesta supera le scorte disponibili.',
                ], 422);
            }

            $cart[$cartKey]['quantity'] = $newQty;
            $cart[$cartKey]['max_available'] = $available;
            $cart[$cartKey]['inventory_location_id'] = $locationId;
        } else {
            if ((int) $validated['quantity'] > $available) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quantità richiesta supera le scorte disponibili.',
                ], 422);
            }

            $cart[$cartKey] = [
                'key' => $cartKey,
                'id' => $product->id,
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'inventory_location_id' => $locationId,
                'name' => $product->name,
                'variant_label' => $variant->sku,
                'price' => (float) $variant->price,
                'quantity' => (int) $validated['quantity'],
                'image' => $product->primaryImage?->image_path,
                'max_available' => $available,
            ];
        }

        session()->put('cart', $cart);

        return response()->json([
            'success' => true,
            'cart' => $this->buildCartSummary($cart),
        ]);
    }

    public function show()
    {
        $cart = session()->get('cart', []);

        return view('cart.show', ['cart' => $cart]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cart_key' => 'nullable|string',
            'variant_id' => 'nullable|integer|exists:product_variants,id|required_without_all:cart_key,product_id',
            'product_id' => 'nullable|integer|exists:products,id|required_without_all:cart_key,variant_id',
            'quantity' => 'required|integer|min:0',
        ]);

        $cart = session()->get('cart', []);
        $cartKey = $this->resolveCartKey($validated);

        if ($cartKey === null || !isset($cart[$cartKey])) {
            return response()->json([
                'success' => true,
                'cart' => $this->buildCartSummary($cart),
            ]);
        }

        if ((int) $validated['quantity'] <= 0) {
            unset($cart[$cartKey]);
        } else {
            $variantId = (int) ($cart[$cartKey]['variant_id'] ?? 0);
            $variant = ProductVariant::query()->whereKey($variantId)->first();

            if ($variant === null) {
                unset($cart[$cartKey]);
            } else {
                [$available, $locationId] = $this->resolveVariantAvailability($variant);

                if ((int) $validated['quantity'] > $available) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Quantità richiesta supera le scorte disponibili.',
                    ], 422);
                }

                $cart[$cartKey]['quantity'] = (int) $validated['quantity'];
                $cart[$cartKey]['max_available'] = $available;
                $cart[$cartKey]['inventory_location_id'] = $locationId;
            }
        }

        session()->put('cart', $cart);

        return response()->json([
            'success' => true,
            'cart' => $this->buildCartSummary($cart),
        ]);
    }

    public function remove(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cart_key' => 'nullable|string',
            'variant_id' => 'nullable|integer|exists:product_variants,id|required_without_all:cart_key,product_id',
            'product_id' => 'nullable|integer|exists:products,id|required_without_all:cart_key,variant_id',
        ]);

        $cart = session()->get('cart', []);
        $cartKey = $this->resolveCartKey($validated);

        if ($cartKey !== null) {
            unset($cart[$cartKey]);
        }

        session()->put('cart', $cart);

        return response()->json([
            'success' => true,
            'cart' => $this->buildCartSummary($cart),
        ]);
    }

    /**
     * @param  array{variant_id?: mixed, product_id?: mixed}  $validated
     * @return array{?Product, ?ProductVariant}
     */
    private function resolveProductAndVariant(array $validated): array
    {
        $storeId = $this->tenantContext->storeId();

        if (!empty($validated['variant_id'])) {
            $variantQuery = ProductVariant::query()
                ->with(['product.primaryImage'])
                ->whereKey((int) $validated['variant_id']);

            if ($storeId !== null) {
                $variantQuery->where('store_id', $storeId);
            }

            $variant = $variantQuery->first();

            if ($variant === null || $variant->product === null) {
                return [null, null];
            }

            return [$variant->product, $variant];
        }

        if (empty($validated['product_id'])) {
            return [null, null];
        }

        $productQuery = Product::query()
            ->with(['primaryImage', 'variants' => function ($query): void {
                $query->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")->orderBy('id');
            }])
            ->whereKey((int) $validated['product_id']);

        if ($storeId !== null) {
            $productQuery->where('store_id', $storeId);
        }

        $product = $productQuery->first();

        if ($product === null) {
            return [null, null];
        }

        $variant = $product->variants->first();

        return [$product, $variant];
    }

    /**
     * @return array{int, ?int}
     */
    private function resolveVariantAvailability(ProductVariant $variant): array
    {
        $level = InventoryLevel::query()
            ->withoutGlobalScopes()
            ->select('inventory_levels.*')
            ->join('inventory_locations', 'inventory_locations.id', '=', 'inventory_levels.location_id')
            ->where('inventory_levels.store_id', (int) $variant->store_id)
            ->where('inventory_levels.variant_id', (int) $variant->id)
            ->where('inventory_locations.is_active', true)
            ->orderBy('inventory_locations.priority')
            ->orderBy('inventory_levels.id')
            ->first();

        if ($level === null) {
            return [0, null];
        }

        return [max(0, (int) $level->available), (int) $level->location_id];
    }

    /**
     * @param array{cart_key?: mixed, variant_id?: mixed, product_id?: mixed} $validated
     */
    private function resolveCartKey(array $validated): ?string
    {
        if (!empty($validated['cart_key'])) {
            return (string) $validated['cart_key'];
        }

        if (!empty($validated['variant_id'])) {
            return $this->cartKeyForVariant((int) $validated['variant_id']);
        }

        if (!empty($validated['product_id'])) {
            $storeId = $this->tenantContext->storeId();

            $variantQuery = ProductVariant::query()
                ->where('product_id', (int) $validated['product_id'])
                ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
                ->orderBy('id');

            if ($storeId !== null) {
                $variantQuery->where('store_id', $storeId);
            }

            $variantId = $variantQuery->value('id');

            return is_numeric($variantId) ? $this->cartKeyForVariant((int) $variantId) : null;
        }

        return null;
    }

    private function cartKeyForVariant(int $variantId): string
    {
        return sprintf('v:%d', $variantId);
    }

    private function buildCartSummary(array $cart): array
    {
        $items = array_values($cart);
        $count = array_reduce($items, fn ($total, $item) => $total + (int) ($item['quantity'] ?? 0), 0);
        $subtotal = array_reduce($items, fn ($total, $item) => $total + ((float) ($item['price'] ?? 0) * (int) ($item['quantity'] ?? 0)), 0);

        return [
            'count' => $count,
            'subtotal' => $subtotal,
            'items' => $items,
        ];
    }
}
