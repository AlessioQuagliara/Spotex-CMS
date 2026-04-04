<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Support\Api\V1\ApiResponse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'q' => 'nullable|string|max:255',
            'sort' => 'nullable|in:id,name,price,created_at,updated_at',
            'direction' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:' . (int) config('spotex.api.v1.pagination.max_per_page', 100),
        ]);

        $sort = (string) ($validated['sort'] ?? 'id');
        $direction = (string) ($validated['direction'] ?? 'asc');
        $perPage = (int) ($validated['per_page'] ?? (int) config('spotex.api.v1.pagination.default_per_page', 20));
        $search = trim((string) ($validated['q'] ?? ''));

        $query = Product::query()->with(['category:id,name,slug']);

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%');
            });
        }

        $paginator = $query
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        $items = $paginator->getCollection()
            ->map(fn (Product $product): array => $this->transformProduct($product))
            ->values()
            ->all();

        return ApiResponse::paginated(
            paginator: $paginator,
            items: $items,
            meta: [
                'filters' => [
                    'q' => $search !== '' ? $search : null,
                    'sort' => $sort,
                    'direction' => $direction,
                ],
            ]
        );
    }

    public function show(Product $product)
    {
        return ApiResponse::success([
            'item' => $this->transformProduct($product->loadMissing('category:id,name,slug')),
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
            'name' => 'required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->where(
                    fn ($query) => $query->where('store_id', $storeId)
                ),
            ],
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'category_id' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $categoryId = $this->resolveCategoryId($validated['category_id'] ?? null);
        $slug = $this->resolveSlug(
            providedSlug: $validated['slug'] ?? null,
            fallbackName: (string) $validated['name'],
            storeId: $storeId
        );

        $product = Product::query()->create([
            'store_id' => $storeId,
            'name' => (string) $validated['name'],
            'slug' => $slug,
            'description' => array_key_exists('description', $validated)
                ? (string) ($validated['description'] ?? '')
                : '',
            'price' => (float) $validated['price'],
            'stock' => (int) ($validated['stock'] ?? 0),
            'category_id' => $categoryId,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return ApiResponse::success(
            data: ['item' => $this->transformProduct($product->loadMissing('category:id,name,slug'))],
            status: 201
        );
    }

    public function update(Request $request, Product $product)
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
            'name' => 'sometimes|string|max:255',
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')
                    ->where(fn ($query) => $query->where('store_id', $storeId))
                    ->ignore($product->id),
            ],
            'description' => 'sometimes|nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'category_id' => 'sometimes|nullable|integer',
            'is_active' => 'sometimes|boolean',
        ]);

        if (array_key_exists('category_id', $validated)) {
            $validated['category_id'] = $this->resolveCategoryId($validated['category_id']);
        }

        if (array_key_exists('description', $validated)) {
            $validated['description'] = (string) ($validated['description'] ?? '');
        }

        if (array_key_exists('slug', $validated)) {
            $validated['slug'] = $this->resolveSlug(
                providedSlug: $validated['slug'],
                fallbackName: (string) ($validated['name'] ?? $product->name),
                storeId: $storeId,
                ignoreProductId: (int) $product->id
            );
        }

        $product->fill($validated);
        $product->save();

        return ApiResponse::success([
            'item' => $this->transformProduct($product->fresh()->loadMissing('category:id,name,slug')),
        ]);
    }

    private function resolveCategoryId(mixed $categoryId): ?int
    {
        if ($categoryId === null || $categoryId === '') {
            return null;
        }

        $resolved = (int) $categoryId;
        $exists = Category::query()->whereKey($resolved)->exists();
        if (!$exists) {
            throw ValidationException::withMessages([
                'category_id' => ['Invalid category_id for current store.'],
            ]);
        }

        return $resolved;
    }

    private function resolveSlug(
        mixed $providedSlug,
        string $fallbackName,
        int $storeId,
        ?int $ignoreProductId = null
    ): string {
        $base = trim((string) $providedSlug) !== ''
            ? (string) $providedSlug
            : $fallbackName;

        $slug = Str::slug($base);
        if ($slug === '') {
            $slug = 'product-' . Str::lower(Str::random(8));
        }

        $candidate = $slug;
        $suffix = 2;

        while ($this->slugExists($candidate, $storeId, $ignoreProductId)) {
            $candidate = $slug . '-' . $suffix;
            $suffix++;
        }

        return $candidate;
    }

    private function slugExists(string $slug, int $storeId, ?int $ignoreProductId = null): bool
    {
        $query = Product::query()
            ->where('slug', $slug)
            ->where('store_id', $storeId);

        if ($ignoreProductId !== null) {
            $query->where('id', '!=', $ignoreProductId);
        }

        return $query->exists();
    }

    /**
     * @return array<string, mixed>
     */
    private function transformProduct(Product $product): array
    {
        return [
            'id' => (int) $product->id,
            'store_id' => (int) $product->store_id,
            'category_id' => $product->category_id !== null ? (int) $product->category_id : null,
            'category' => $product->relationLoaded('category') && $product->category !== null ? [
                'id' => (int) $product->category->id,
                'name' => (string) $product->category->name,
                'slug' => (string) $product->category->slug,
            ] : null,
            'tax_class_id' => $product->tax_class_id !== null ? (int) $product->tax_class_id : null,
            'name' => (string) $product->name,
            'slug' => (string) $product->slug,
            'description' => $product->description !== null ? (string) $product->description : null,
            'price' => (float) $product->price,
            'stock' => (int) $product->stock,
            'is_active' => (bool) $product->is_active,
            'created_at' => $product->created_at?->toIso8601String(),
            'updated_at' => $product->updated_at?->toIso8601String(),
        ];
    }
}
