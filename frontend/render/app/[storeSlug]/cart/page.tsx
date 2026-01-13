/**
 * Cart Page
 * Pagina carrello completa con riepilogo
 */
'use client'

import { use } from 'react'
import { useCart } from '@/lib/cart-context'
import { useStore } from '@/lib/store-context'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function CartPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = use(params)
  const { store } = useStore()
  const { items, total, removeItem, updateQuantity } = useCart()

  if (!store) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(store.locale, {
      style: 'currency',
      currency: store.currency,
    }).format(price)
  }

  const shipping = total > 50 ? 0 : 5.99
  const tax = total * 0.22 // 22% IVA
  const grandTotal = total + shipping + tax

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Button size="lg" asChild>
            <Link href={`/${storeSlug}/products`}>Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
              {/* Image */}
              <div className="relative h-24 w-24 rounded overflow-hidden bg-muted flex-shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-4 mb-2">
                  <Link
                    href={`/${storeSlug}/products/${item.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {item.variantName && (
                  <p className="text-sm text-muted-foreground mb-3">{item.variantName}</p>
                )}

                <div className="flex items-center justify-between">
                  {/* Quantity */}
                  <div className="flex items-center border rounded">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="font-semibold">{formatPrice(item.price * item.quantity)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(item.price)} each
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-20">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (22%)</span>
                <span>{formatPrice(tax)}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {shipping > 0 && (
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded">
                Add {formatPrice(50 - total)} more to get free shipping!
              </div>
            )}

            {/* Coupon */}
            <div className="mb-4">
              <div className="flex gap-2">
                <Input placeholder="Coupon code" />
                <Button variant="outline">Apply</Button>
              </div>
            </div>

            <Button size="lg" className="w-full" asChild>
              <Link href={`/${storeSlug}/cart/checkout`}>Proceed to Checkout</Link>
            </Button>

            <Button variant="ghost" className="w-full mt-2" asChild>
              <Link href={`/${storeSlug}/products`}>Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
