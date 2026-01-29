<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Coupon;
use App\Models\ShippingRule;
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

        $subtotal = $this->calculateSubtotal($cart);
        $shippingCost = 0;
        $discountAmount = 0;
        $total = max(0, $subtotal + $shippingCost - $discountAmount);

        // Crea un ordine temporaneo (user_id nullable per guest)
        $order = Order::create([
            'user_id' => Auth::id() ?? null,
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_status' => 'not_shipped',
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'discount_amount' => $discountAmount,
            'discount_code' => null,
            'shipping_method' => null,
            'total' => $total,
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

        // Converte il carrello da array associativo a array sequenziale per il JSON
        $cartArray = array_values($cart);

        return view('checkout.index', [
            'order' => $order,
            'cart' => $cartArray,
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

        // Verifica che l'ordine appartenga all'utente
        if ($order->user_id !== Auth::id()) {
            return response()->json(['success' => false], 403);
        }

        $cart = session()->get('cart', []);
        if (empty($cart)) {
            return response()->json(['success' => false, 'message' => 'Carrello vuoto'], 400);
        }

        $shippingAddress = "{$validated['shipping_address']}, {$validated['shipping_city']}, {$validated['shipping_zip']}, {$validated['shipping_country']}";
        
        $billingAddress = $shippingAddress;
        if (!empty($validated['billing_address'])) {
            $billingAddress = "{$validated['billing_address']}, {$validated['billing_city']}, {$validated['billing_zip']}, {$validated['billing_country']}";
        }

        $subtotal = $this->calculateSubtotal($cart);
        $shippingCost = $this->calculateShipping($validated['shipping_method'], $subtotal);
        $discountAmount = $this->calculateDiscount($validated['discount_code'] ?? null, $subtotal);
        $total = max(0, $subtotal + $shippingCost - $discountAmount);

        $order->update([
            'shipping_address' => $shippingAddress,
            'billing_address' => $billingAddress,
            'shipping_method' => $validated['shipping_method'],
            'discount_code' => $validated['discount_code'] ?? null,
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'discount_amount' => $discountAmount,
            'total' => $total,
        ]);

        return response()->json([
            'success' => true,
            'order_id' => $order->id,
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'discount_amount' => $discountAmount,
            'total' => $total,
        ]);
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
}
