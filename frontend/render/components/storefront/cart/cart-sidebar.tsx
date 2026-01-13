/**
 * Cart Sidebar Component
 * Sidebar carrello con lista prodotti e riepilogo
 */
'use client'

import { useCart } from '@/lib/cart-context'
import { useStore } from '@/lib/store-context'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function CartSidebar() {
  const { store } = useStore()
  const { items, total, isOpen, closeCart, removeItem, updateQuantity } = useCart()

  if (!store) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(store.locale, {
      style: 'currency',
      currency: store.currency,
    }).format(price)
  }

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button className="mt-4" onClick={closeCart}>
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Items */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {/* Image */}
                    <div className="relative h-20 w-20 rounded overflow-hidden bg-muted flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <Link
                          href={`/${store.slug}/products/${item.slug}`}
                          className="font-medium line-clamp-2 hover:underline"
                          onClick={closeCart}
                        >
                          {item.name}
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {item.variantName && (
                        <p className="text-sm text-muted-foreground">{item.variantName}</p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity */}
                        <div className="flex items-center border rounded">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>

                        {/* Price */}
                        <span className="font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* Summary */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between text-base">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(total)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>

              <div className="space-y-2">
                <Button className="w-full" size="lg" asChild>
                  <Link href={`/${store.slug}/cart/checkout`} onClick={closeCart}>
                    Checkout
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  asChild
                >
                  <Link href={`/${store.slug}/cart`} onClick={closeCart}>
                    View Cart
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
