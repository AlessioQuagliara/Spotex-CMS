/**
 * Checkout Success Page
 * Conferma ordine completato
 */
'use client'

import { use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = use(params)

  // Mock order number
  const orderNumber = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase()

  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl">Order Confirmed!</CardTitle>
            <CardDescription>
              Thank you for your purchase. Your order has been successfully placed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="text-2xl font-bold">{orderNumber}</p>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              <p>A confirmation email has been sent to your email address.</p>
              <p className="mt-2">You can track your order status in your account.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link href={`/${storeSlug}/account/orders`}>View Order</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href={`/${storeSlug}/products`}>Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
