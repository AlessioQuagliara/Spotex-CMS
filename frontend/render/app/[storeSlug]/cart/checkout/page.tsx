/**
 * Checkout Page
 * Multi-step checkout: Shipping → Payment → Review
 */
'use client'

import { use, useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { useStore } from '@/lib/store-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, CreditCard, Package, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type CheckoutStep = 'shipping' | 'payment' | 'review'

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = use(params)
  const router = useRouter()
  const { store } = useStore()
  const { items, total, clearCart } = useCart()
  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [guestCheckout, setGuestCheckout] = useState(true)

  // Form state
  const [shippingData, setShippingData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zip: '',
    country: 'Italy',
    phone: '',
  })

  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  })

  if (!store) return null

  if (items.length === 0) {
    router.push(`/${storeSlug}/cart`)
    return null
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(store.locale, {
      style: 'currency',
      currency: store.currency,
    }).format(price)
  }

  const shipping = total > 50 ? 0 : 5.99
  const tax = total * 0.22
  const grandTotal = total + shipping + tax

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('payment')
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('review')
  }

  const handlePlaceOrder = () => {
    // TODO: Process order via API
    console.log('Order placed:', {
      shipping: shippingData,
      payment: { method: paymentMethod },
      items,
      total: grandTotal,
    })
    clearCart()
    router.push(`/${storeSlug}/cart/checkout/success`)
  }

  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: 'shipping', label: 'Shipping', icon: Truck },
              { key: 'payment', label: 'Payment', icon: CreditCard },
              { key: 'review', label: 'Review', icon: Package },
            ].map((s, i) => {
              const Icon = s.icon
              const isActive = step === s.key
              const isCompleted =
                (s.key === 'shipping' && (step === 'payment' || step === 'review')) ||
                (s.key === 'payment' && step === 'review')

              return (
                <div key={s.key} className="flex-1 flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                        isActive || isCompleted
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`hidden sm:inline ${
                        isActive || isCompleted ? 'font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                  <CardDescription>Enter your shipping details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="guest"
                        checked={guestCheckout}
                        onCheckedChange={(checked) => setGuestCheckout(!!checked)}
                      />
                      <label htmlFor="guest" className="text-sm">
                        Continue as guest
                      </label>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={shippingData.email}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          required
                          value={shippingData.firstName}
                          onChange={(e) =>
                            setShippingData({ ...shippingData, firstName: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          required
                          value={shippingData.lastName}
                          onChange={(e) =>
                            setShippingData({ ...shippingData, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        required
                        value={shippingData.address}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, address: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          required
                          value={shippingData.city}
                          onChange={(e) =>
                            setShippingData({ ...shippingData, city: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          required
                          value={shippingData.zip}
                          onChange={(e) =>
                            setShippingData({ ...shippingData, zip: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={shippingData.phone}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button type="button" variant="outline" asChild>
                        <Link href={`/${storeSlug}/cart`}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Cart
                        </Link>
                      </Button>
                      <Button type="submit" className="flex-1">
                        Continue to Payment
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Choose your payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2 border rounded p-4">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          Credit / Debit Card
                        </Label>
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex items-center space-x-2 border rounded p-4">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                          PayPal
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded p-4">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                          Stripe
                        </Label>
                      </div>
                    </RadioGroup>

                    {paymentMethod === 'card' && (
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            required
                            value={cardData.number}
                            onChange={(e) =>
                              setCardData({ ...cardData, number: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardName">Cardholder Name</Label>
                          <Input
                            id="cardName"
                            required
                            value={cardData.name}
                            onChange={(e) =>
                              setCardData({ ...cardData, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/YY"
                              required
                              value={cardData.expiry}
                              onChange={(e) =>
                                setCardData({ ...cardData, expiry: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvc">CVC</Label>
                            <Input
                              id="cvc"
                              placeholder="123"
                              required
                              value={cardData.cvc}
                              onChange={(e) =>
                                setCardData({ ...cardData, cvc: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('shipping')}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Review Order
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 'review' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Shipping Address</h3>
                      <p className="text-sm text-muted-foreground">
                        {shippingData.firstName} {shippingData.lastName}
                        <br />
                        {shippingData.address}
                        <br />
                        {shippingData.zip} {shippingData.city}
                        <br />
                        {shippingData.country}
                        <br />
                        {shippingData.phone}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-2">Payment Method</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {paymentMethod}
                        {paymentMethod === 'card' && cardData.number && ` ending in ${cardData.number.slice(-4)}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep('payment')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handlePlaceOrder} className="flex-1">
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-16 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
