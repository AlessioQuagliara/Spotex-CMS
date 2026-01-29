<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckoutController extends Controller
{
    public function index(Request $request)
    {
        $cart = session()->get('cart', []);

        if (empty($cart)) {
            return redirect()->route('cart.show');
        }

        // Crea un ordine temporaneo
        $order = Order::create([
            'user_id' => Auth::id(),
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_status' => 'not_shipped',
            'total' => $this->calculateTotal($cart),
            'shipping_address' => '',
            'billing_address' => '',
        ]);

        // Aggiungi gli articoli all'ordine
        foreach ($cart as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['price'],
                'subtotal' => $item['price'] * $item['quantity'],
            ]);
        }

        return view('checkout.index', [
            'order' => $order,
            'cart' => $cart,
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
            'billing_address' => 'nullable|string',
            'billing_city' => 'nullable|string',
            'billing_zip' => 'nullable|string',
            'billing_country' => 'nullable|string',
        ]);

        $order = Order::findOrFail($validated['order_id']);

        // Verifica che l'ordine appartenga all'utente
        if ($order->user_id !== Auth::id()) {
            return response()->json(['success' => false], 403);
        }

        $shippingAddress = "{$validated['shipping_address']}, {$validated['shipping_city']}, {$validated['shipping_zip']}, {$validated['shipping_country']}";
        
        $billingAddress = $shippingAddress;
        if ($validated['billing_address']) {
            $billingAddress = "{$validated['billing_address']}, {$validated['billing_city']}, {$validated['billing_zip']}, {$validated['billing_country']}";
        }

        $order->update([
            'shipping_address' => $shippingAddress,
            'billing_address' => $billingAddress,
        ]);

        return response()->json(['success' => true, 'order_id' => $order->id]);
    }

    private function calculateTotal(array $cart): float
    {
        return array_reduce($cart, function ($total, $item) {
            return $total + ($item['price'] * $item['quantity']);
        }, 0);
    }
}
