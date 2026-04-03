<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Page;
use App\Models\Review;
use App\Services\Builder\BuilderDocumentRenderer;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request, ?BuilderDocumentRenderer $renderer = null)
    {
        $renderer ??= app(BuilderDocumentRenderer::class);

        if (!$request->has('category')) {
            $productsPage = Page::query()
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

        $query = Product::where('is_active', true);
        $selectedCategory = null;

        if ($request->has('category')) {
            $selectedCategory = Category::where('slug', $request->get('category'))->first();
            if ($selectedCategory) {
                $query->where('category_id', $selectedCategory->id);
            }
        }

        $products = $query->with('primaryImage')->paginate(12);
        $categories = Category::where('parent_id', null)->get();

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
            'reviews' => fn ($query) => $query->where('is_approved', true)->latest(),
        ]);

        $alsoChosen = collect();

        if ($product->category) {
            $alsoChosen = Product::where('is_active', true)
                ->where('category_id', $product->category->id)
                ->where('id', '!=', $product->id)
                ->with('primaryImage')
                ->take(3)
                ->get();
        }

        $reviewsCount = $product->reviews->count();
        $averageRating = $reviewsCount > 0 ? round($product->reviews->avg('rating'), 1) : null;

        return view('products.show', [
            'product' => $product,
            'alsoChosen' => $alsoChosen,
            'reviewsCount' => $reviewsCount,
            'averageRating' => $averageRating,
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
        $products = Product::where('is_active', true)
            ->where('category_id', $category->id)
            ->with('primaryImage')
            ->paginate(12);
        $categories = Category::whereNull('parent_id')->get();

        return view('products.index', [
            'products' => $products,
            'categories' => $categories,
            'selectedCategory' => $category,
        ]);
    }
}
