<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Page;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Services\Builder\BuilderDocumentRenderer;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class ProductController extends Controller
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function index(Request $request, ?BuilderDocumentRenderer $renderer = null)
    {
        $renderer ??= app(BuilderDocumentRenderer::class);

        if (!$request->has('category')) {
            $productsPage = $this->applyStoreScope(Page::query())
                ->where('slug', 'prodotti')
                ->where('is_published', true)
                ->first();

            if ($productsPage) {
                $renderedPage = $renderer->renderPage($productsPage);
                $hasRenderableContent = trim((string) ($renderedPage['html'] ?? '')) !== ''
                    || trim((string) ($productsPage->html_content ?? '')) !== '';

                if ($hasRenderableContent) {
                    return view('pages.show', [
                        'page' => $productsPage,
                        'renderedPage' => $renderedPage,
                    ]);
                }
            }
        }

        $query = $this->applyStoreScope(Product::query())->where('is_active', true);
        $selectedCategory = null;

        if ($request->has('category')) {
            $selectedCategory = $this->applyStoreScope(Category::query())
                ->where('slug', $request->get('category'))
                ->first();
            if ($selectedCategory) {
                $query->where('category_id', $selectedCategory->id);
            }
        }

        $products = $query->with('primaryImage')->paginate(12);
        $categories = $this->applyStoreScope(Category::query())
            ->where('parent_id', null)
            ->get();

        return view('products.index', [
            'products' => $products,
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
        ]);
    }

    public function show(Product $product)
    {
        $product->load([
            'images',
            'category',
            'variants' => fn ($query) => $query
                ->where('status', ProductVariant::STATUS_ACTIVE)
                ->with(['inventoryLevels.location' => fn ($locationQuery) => $locationQuery->where('is_active', true)])
                ->orderBy('id'),
            'reviews' => fn ($query) => $query->where('is_approved', true)->latest(),
        ]);

        $alsoChosen = collect();

        if ($product->category) {
            $alsoChosen = $this->applyStoreScope(Product::query())
                ->where('is_active', true)
                ->where('category_id', $product->category->id)
                ->where('id', '!=', $product->id)
                ->with('primaryImage')
                ->take(3)
                ->get();
        }

        $reviewsCount = $product->reviews->count();
        $averageRating = $reviewsCount > 0 ? round($product->reviews->avg('rating'), 1) : null;
        $defaultVariant = $product->variants->first();
        $availableStock = $defaultVariant
            ? (int) $defaultVariant->inventoryLevels->sum('available')
            : max(0, (int) $product->stock);

        return view('products.show', [
            'product' => $product,
            'alsoChosen' => $alsoChosen,
            'reviewsCount' => $reviewsCount,
            'averageRating' => $averageRating,
            'defaultVariant' => $defaultVariant,
            'availableStock' => $availableStock,
        ]);
    }

    public function storeReview(Request $request, Product $product)
    {
        $validated = $request->validate([
            'author_name' => ['required', 'string', 'max:100'],
            'author_email' => ['nullable', 'email', 'max:255'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $validated['product_id'] = $product->id;

        Review::create($validated);

        return redirect()
            ->route('product.show', $product)
            ->with('success', 'Recensione inviata con successo.');
    }

    public function category(Category $category)
    {
        $products = $this->applyStoreScope(Product::query())
            ->where('is_active', true)
            ->where('category_id', $category->id)
            ->with('primaryImage')
            ->paginate(12);
        $categories = $this->applyStoreScope(Category::query())
            ->whereNull('parent_id')
            ->get();

        return view('products.index', [
            'products' => $products,
            'categories' => $categories,
            'selectedCategory' => $category,
        ]);
    }

    private function applyStoreScope(Builder $query): Builder
    {
        $storeId = $this->tenantContext->storeId();

        if ($storeId === null) {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($storeId): void {
            $builder
                ->where('store_id', $storeId)
                ->orWhereNull('store_id');
        });
    }
}
