<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::where('is_active', true);

        if ($request->has('category')) {
            $category = Category::where('slug', $request->get('category'))->first();
            if ($category) {
                $query->where('category_id', $category->id);
            }
        }

        $products = $query->with('primaryImage')->paginate(12);
        $categories = Category::where('parent_id', null)->get();

        return view('products.index', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    public function show(Product $product)
    {
        $product->load(['images', 'category']);

        return view('products.show', [
            'product' => $product,
        ]);
    }
}
