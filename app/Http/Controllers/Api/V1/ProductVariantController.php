<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Support\Api\V1\ApiResponse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductVariantController extends Controller
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'q' => 'nullable|string|max:255',
            'product_id' => 'nullable|integer',
            'status' => ['nullable', Rule::in(array_keys(ProductVariant::statusOptions()))],
            'sort' => 'nullable|in:id,sku,price,status,created_at,updated_at',
            'direction' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:' . (int) config('spotex.api.v1.pagination.max_per_page', 100),
        ]);

        $search = trim((string) ($validated['q'] ?? ''));
        $sort = (string) ($validated['sort'] ?? 'id');
        $direction = (string) ($validated['direction'] ?? 'asc');
        $perPage = (int) ($validated['per_page'] ?? (int) config('spotex.api.v1.pagination.default_per_page', 20));

        $query = ProductVariant::query()->with(['product:id,name,slug']);

        if (array_key_exists('product_id', $validated) && $validated['product_id'] !== null) {
            $query->where('product_id', (int) $validated['product_id']);
        }

        if (array_key_exists('status', $validated) && $validated['status'] !== null) {
            $query->where('status', (string) $validated['status']);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('sku', 'like', '%' . $search . '%')
                    ->orWhere('barcode', 'like', '%' . $search . '%');
            });
        }

        $paginator = $query
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        $items = $paginator->getCollection()
            ->map(fn (ProductVariant $variant): array => $this->transformVariant($variant))
            ->values()
            ->all();

        return ApiResponse::paginated(
            paginator: $paginator,
            items: $items,
            meta: [
                'filters' => [
                    'q' => $search !== '' ? $search : null,
                    'product_id' => $validated['product_id'] ?? null,
                    'status' => $validated['status'] ?? null,
                    'sort' => $sort,
                    'direction' => $direction,
                ],
            ]
        );
    }

    public function show(ProductVariant $variant)
    {
        return ApiResponse::success([
            'item' => $this->transformVariant($variant->loadMissing('product:id,name,slug')),
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
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(
                    fn ($query) => $query->where('store_id', $storeId)
                ),
            ],
            'sku' => [
                'required',
                'string',
                'max:255',
                Rule::unique('product_variants', 'sku')->where(
                    fn ($query) => $query->where('store_id', $storeId)
                ),
            ],
            'barcode' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'compare_at_price' => 'nullable|numeric|min:0',
            'status' => ['nullable', Rule::in(array_keys(ProductVariant::statusOptions()))],
            'weight' => 'nullable|numeric|min:0',
        ]);

        $variant = ProductVariant::query()->create([
            'store_id' => $storeId,
            'product_id' => (int) $validated['product_id'],
            'sku' => (string) $validated['sku'],
            'barcode' => $validated['barcode'] ?? null,
            'price' => (float) $validated['price'],
            'compare_at_price' => array_key_exists('compare_at_price', $validated) ? $validated['compare_at_price'] : null,
            'status' => (string) ($validated['status'] ?? ProductVariant::STATUS_ACTIVE),
            'weight' => array_key_exists('weight', $validated) ? $validated['weight'] : null,
        ]);

        return ApiResponse::success(
            data: ['item' => $this->transformVariant($variant->loadMissing('product:id,name,slug'))],
            status: 201
        );
    }

    public function update(Request $request, ProductVariant $variant)
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
            'product_id' => [
                'sometimes',
                'integer',
                Rule::exists('products', 'id')->where(
                    fn ($query) => $query->where('store_id', $storeId)
                ),
            ],
            'sku' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('product_variants', 'sku')
                    ->where(fn ($query) => $query->where('store_id', $storeId))
                    ->ignore($variant->id),
            ],
            'barcode' => 'sometimes|nullable|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'compare_at_price' => 'sometimes|nullable|numeric|min:0',
            'status' => ['sometimes', Rule::in(array_keys(ProductVariant::statusOptions()))],
            'weight' => 'sometimes|nullable|numeric|min:0',
        ]);

        $variant->fill($validated);
        $variant->save();

        return ApiResponse::success([
            'item' => $this->transformVariant($variant->fresh()->loadMissing('product:id,name,slug')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformVariant(ProductVariant $variant): array
    {
        return [
            'id' => (int) $variant->id,
            'store_id' => (int) $variant->store_id,
            'product_id' => (int) $variant->product_id,
            'product' => $variant->relationLoaded('product') && $variant->product !== null ? [
                'id' => (int) $variant->product->id,
                'name' => (string) $variant->product->name,
                'slug' => (string) $variant->product->slug,
            ] : null,
            'sku' => (string) $variant->sku,
            'barcode' => $variant->barcode !== null ? (string) $variant->barcode : null,
            'price' => (float) $variant->price,
            'compare_at_price' => $variant->compare_at_price !== null ? (float) $variant->compare_at_price : null,
            'status' => (string) $variant->status,
            'weight' => $variant->weight !== null ? (float) $variant->weight : null,
            'created_at' => $variant->created_at?->toIso8601String(),
            'updated_at' => $variant->updated_at?->toIso8601String(),
        ];
    }
}
