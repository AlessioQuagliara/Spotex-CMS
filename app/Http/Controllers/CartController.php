<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CartController extends Controller
{
    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = session()->get('cart', []);
        $productId = $validated['product_id'];

        if (isset($cart[$productId])) {
            $cart[$productId]['quantity'] += $validated['quantity'];
        } else {
            $product = \App\Models\Product::find($productId);
            $cart[$productId] = [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'quantity' => $validated['quantity'],
                'image' => $product->primaryImage?->image_path,
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

    public function update(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:0',
        ]);

        $cart = session()->get('cart', []);
        $productId = $validated['product_id'];

        if ($validated['quantity'] <= 0) {
            unset($cart[$productId]);
        } else {
            $cart[$productId]['quantity'] = $validated['quantity'];
        }

        session()->put('cart', $cart);

        return response()->json([
            'success' => true,
            'cart' => $this->buildCartSummary($cart),
        ]);
    }

    public function remove(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $cart = session()->get('cart', []);
        unset($cart[$validated['product_id']]);

        session()->put('cart', $cart);

        return response()->json([
            'success' => true,
            'cart' => $this->buildCartSummary($cart),
        ]);
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
