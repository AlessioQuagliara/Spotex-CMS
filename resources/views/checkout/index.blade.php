@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-16">
        <h1 class="text-4xl font-bold text-[#010f20] mb-12">Checkout</h1>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Form Checkout -->
            <div class="lg:col-span-2">
                <form id="checkoutForm" class="space-y-8">
                    @csrf

                    <!-- Indirizzo di Spedizione -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-2xl font-bold text-[#010f20] mb-4">Indirizzo di Spedizione</h2>
                        
                        <div class="space-y-4">
                            <input type="text" name="shipping_address" placeholder="Via, numero" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#010f20]">
                            <input type="text" name="shipping_city" placeholder="Città" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#010f20]">
                            <div class="grid grid-cols-2 gap-4">
                                <input type="text" name="shipping_zip" placeholder="CAP" required
                                       class="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#010f20]">
                                <input type="text" name="shipping_country" placeholder="Paese" value="Italia" required
                                       class="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#010f20]">
                            </div>
                        </div>
                    </div>

                    <!-- Indirizzo di Fatturazione -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-2xl font-bold text-[#010f20] mb-4">Indirizzo di Fatturazione</h2>
                        
                        <label class="flex items-center mb-4">
                            <input type="checkbox" id="sameAsShipping" checked class="mr-2">
                            <span class="text-gray-700">Stesso indirizzo di spedizione</span>
                        </label>

                        <div id="billingForm" class="hidden space-y-4">
                            <input type="text" name="billing_address" placeholder="Via, numero" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#010f20]">
                            <input type="text" name="billing_city" placeholder="Città" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#010f20]">
                            <div class="grid grid-cols-2 gap-4">
                                <input type="text" name="billing_zip" placeholder="CAP" required
                                       class="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#010f20]">
                                <input type="text" name="billing_country" placeholder="Paese" value="Italia" required
                                       class="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#010f20]">
                            </div>
                        </div>
                    </div>

                    <!-- Metodo di Pagamento -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-2xl font-bold text-[#010f20] mb-4">Metodo di Pagamento</h2>
                        
                        <div class="space-y-4">
                            <label class="flex items-center p-4 border-2 border-[#010f20] rounded cursor-pointer">
                                <input type="radio" name="payment_method" value="stripe" checked class="mr-3">
                                <span class="font-semibold text-[#010f20]">Carta di Credito (Stripe)</span>
                            </label>

                            <label class="flex items-center p-4 border-2 border-gray-300 rounded cursor-pointer hover:border-blue-600">
                                <input type="radio" name="payment_method" value="paypal" class="mr-3">
                                <span class="font-semibold text-gray-700">PayPal</span>
                            </label>
                        </div>
                    </div>

                    <button type="button" onclick="proceedToPayment()" 
                            class="w-full bg-[#010f20] text-white font-bold py-3 rounded hover:bg-blue-900 transition">
                        Procedi al Pagamento
                    </button>
                </form>
            </div>

            <!-- Riepilogo Ordine -->
            <div class="bg-white p-6 rounded-lg shadow h-fit sticky top-4">
                <h2 class="text-2xl font-bold text-[#010f20] mb-6">Riepilogo</h2>

                <div id="orderSummary" class="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    <!-- Caricato dinamicamente -->
                </div>

                <div class="border-t pt-4 space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Subtotale</span>
                        <span id="subtotal" class="font-semibold">€0,00</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Spedizione</span>
                        <span id="shipping" class="font-semibold">€0,00</span>
                    </div>
                    <div class="flex justify-between text-lg font-bold text-[#010f20] border-t pt-2 mt-2">
                        <span>Totale</span>
                        <span id="total">€0,00</span>
                    </div>
                </div>

                <a href="{{ route('cart.show') }}" class="text-blue-600 text-sm mt-4 inline-block hover:underline">
                    ← Torna al Carrello
                </a>
            </div>
        </div>
    </div>

    <!-- Stripe Payment Modal -->
    <div id="stripeModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 class="text-2xl font-bold text-[#010f20] mb-4">Pagamento Stripe</h3>
            <p class="text-gray-600 mb-6">Sarai reindirizzato a Stripe per completare il pagamento.</p>
            <div id="card-element" class="border border-gray-300 p-4 rounded mb-4"></div>
            <button type="button" id="stripeSubmit" onclick="submitStripePayment()" 
                    class="w-full bg-[#010f20] text-white font-bold py-2 rounded hover:bg-blue-900 transition">
                Paga con Stripe
            </button>
            <button type="button" onclick="closeStripeModal()" 
                    class="w-full mt-2 bg-gray-300 text-gray-800 font-bold py-2 rounded hover:bg-gray-400 transition">
                Annulla
            </button>
        </div>
    </div>

    <!-- PayPal Payment Modal -->
    <div id="paypalModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 class="text-2xl font-bold text-[#010f20] mb-4">Pagamento PayPal</h3>
            <div id="paypal-button-container"></div>
            <button type="button" onclick="closePayPalModal()" 
                    class="w-full mt-4 bg-gray-300 text-gray-800 font-bold py-2 rounded hover:bg-gray-400 transition">
                Annulla
            </button>
        </div>
    </div>
</div>

<script src="https://js.stripe.com/v3/"></script>
<script src="https://www.paypal.com/sdk/js?client-id={{ env('PAYPAL_CLIENT_ID') }}"></script>

<script>
let cart = @json($cart ?? []);
let orderId = @json($order->id ?? null);
let stripeClientSecret = null;
let stripe = null;
let elements = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCartSummary();
    initializeStripe();
    
    document.getElementById('sameAsShipping').addEventListener('change', function() {
        document.getElementById('billingForm').classList.toggle('hidden');
    });
});

function loadCartSummary() {
    const summaryContainer = document.getElementById('orderSummary');
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        subtotal += itemTotal;
        
        const html = `
            <div class="flex justify-between text-sm">
                <span>${item.name} x${item.quantity}</span>
                <span>€${itemTotal.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
        summaryContainer.innerHTML += html;
    });

    const shipping = 0; // Spedizione gratuita
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = '€' + subtotal.toFixed(2).replace('.', ',');
    document.getElementById('shipping').textContent = '€' + shipping.toFixed(2).replace('.', ',');
    document.getElementById('total').textContent = '€' + total.toFixed(2).replace('.', ',');
}

function initializeStripe() {
    stripe = Stripe('{{ env("STRIPE_PUBLIC_KEY") }}');
    elements = stripe.elements();
    const cardElement = elements.create('card');
    
    const container = document.getElementById('card-element');
    if (container) {
        cardElement.mount('#card-element');
    }
}

function proceedToPayment() {
    const form = document.getElementById('checkoutForm');
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

    if (!form.checkValidity()) {
        alert('Per favore compila tutti i campi richiesti');
        return;
    }

    if (paymentMethod === 'stripe') {
        document.getElementById('stripeModal').classList.remove('hidden');
    } else if (paymentMethod === 'paypal') {
        document.getElementById('paypalModal').classList.remove('hidden');
        initializePayPal();
    }
}

function submitStripePayment() {
    const submitBtn = document.getElementById('stripeSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Elaborazione...';

    fetch('{{ route("payment.stripe.checkout") }}', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': '{{ csrf_token() }}',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
            alert('Errore: ' + data.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Paga con Stripe';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Errore durante il pagamento');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Paga con Stripe';
    });
}

function initializePayPal() {
    paypal.Buttons({
        createOrder: (data, actions) => {
            return fetch('{{ route("payment.paypal.checkout") }}', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ order_id: orderId }),
            })
            .then(response => response.json())
            .then(data => data.orderId);
        },
        onApprove: (data, actions) => {
            return fetch('{{ route("payment.paypal.capture") }}', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: data.orderID,
                    local_order_id: orderId,
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '{{ route("checkout.success", ["order" => ":order"]) }}'.replace(':order', orderId);
                } else {
                    alert('Errore nel completamento del pagamento');
                }
            });
        },
        onError: (err) => {
            console.error('PayPal Error:', err);
            alert('Errore PayPal: ' + err.message);
        },
    }).render('#paypal-button-container');
}

function closeStripeModal() {
    document.getElementById('stripeModal').classList.add('hidden');
}

function closePayPalModal() {
    document.getElementById('paypalModal').classList.add('hidden');
}
</script>
@endsection
