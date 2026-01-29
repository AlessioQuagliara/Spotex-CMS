<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CustomerDashboardController extends Controller
{
    use AuthorizesRequests;

    /**
     * Mostra il dashboard principale del cliente
     */
    public function index()
    {
        $user = auth()->user();
        $orders = $user->orders()->latest()->paginate(10);
        $totalSpent = $user->orders()->where('payment_status', 'paid')->sum('total');
        $activeOrders = $user->orders()->whereIn('shipping_status', ['not_shipped', 'shipped'])->count();

        return view('customer.dashboard', compact('user', 'orders', 'totalSpent', 'activeOrders'));
    }

    /**
     * Mostra i dettagli di un ordine
     */
    public function showOrder(Order $order)
    {
        $this->authorize('view', $order);
        return view('customer.orders.show', compact('order'));
    }

    /**
     * Mostra il form per aggiornare un ordine
     */
    public function editOrder(Order $order)
    {
        $this->authorize('update', $order);

        if (!$order->canBeEdited()) {
            return back()->with('error', 'Non puoi modificare un ordine già pagato.');
        }

        return view('customer.orders.edit', compact('order'));
    }

    /**
     * Aggiorna i dettagli di un ordine
     */
    public function updateOrder(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        if (!$order->canBeEdited()) {
            return back()->with('error', 'Non puoi modificare un ordine già pagato.');
        }

        $validated = $request->validate([
            'billing_same_as_shipping' => 'boolean',
            'billing_name' => 'required_if:billing_same_as_shipping,false|string|max:255',
            'billing_company' => 'nullable|string|max:255',
            'billing_tax_id' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:1000',
        ]);

        $order->update($validated);

        return redirect()->route('customer.orders.show', $order)
            ->with('success', 'Ordine aggiornato con successo!');
    }

    /**
     * Mostra il profilo del cliente
     */
    public function profile()
    {
        $user = auth()->user();
        return view('customer.profile', compact('user'));
    }

    /**
     * Aggiorna il profilo del cliente
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return back()->with('success', 'Profilo aggiornato con successo!');
    }

    /**
     * Mostra gli indirizzi del cliente
     */
    public function addresses()
    {
        $user = auth()->user();
        $shippingAddresses = $user->addresses()->where('type', 'shipping')->get();
        $billingAddresses = $user->addresses()->where('type', 'billing')->get();

        return view('customer.addresses.index', compact('shippingAddresses', 'billingAddresses'));
    }

    /**
     * Mostra il form per aggiungere un nuovo indirizzo
     */
    public function createAddress()
    {
        return view('customer.addresses.create');
    }

    /**
     * Salva un nuovo indirizzo
     */
    public function storeAddress(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'type' => 'required|in:shipping,billing',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email',
            'company' => 'nullable|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'nullable|string|max:255',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:2',
            'tax_id' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default']) {
            $user->addresses()->where('type', $validated['type'])->update(['is_default' => false]);
        }

        $user->addresses()->create($validated);

        return redirect()->route('customer.addresses')
            ->with('success', ucfirst($validated['type']) . ' aggiunto con successo!');
    }

    /**
     * Mostra il form per modificare un indirizzo
     */
    public function editAddress(Address $address)
    {
        $this->authorize('view', $address);
        return view('customer.addresses.edit', compact('address'));
    }

    /**
     * Aggiorna un indirizzo
     */
    public function updateAddress(Request $request, Address $address)
    {
        $this->authorize('update', $address);

        $validated = $request->validate([
            'type' => 'required|in:shipping,billing',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email',
            'company' => 'nullable|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'nullable|string|max:255',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:2',
            'tax_id' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default']) {
            $address->user->addresses()
                ->where('type', $validated['type'])
                ->where('id', '!=', $address->id)
                ->update(['is_default' => false]);
        }

        $address->update($validated);

        return redirect()->route('customer.addresses')
            ->with('success', 'Indirizzo aggiornato con successo!');
    }

    /**
     * Elimina un indirizzo
     */
    public function destroyAddress(Address $address)
    {
        $this->authorize('delete', $address);
        $address->delete();

        return redirect()->route('customer.addresses')
            ->with('success', 'Indirizzo eliminato con successo!');
    }
}
