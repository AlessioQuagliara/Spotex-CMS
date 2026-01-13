/**
 * Order Detail Page
 * Dettaglio ordine con gestione stato
 */
'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Mail, MapPin, Package, Phone, Truck, User } from 'lucide-react'

// Mock data
const orderData = {
  id: '1',
  orderNumber: '#ORD-001',
  status: 'processing',
  date: '2024-01-15T10:30:00',
  customer: {
    name: 'Mario Rossi',
    email: 'mario@example.com',
    phone: '+39 333 1234567',
  },
  shipping: {
    address: 'Via Roma 123',
    city: 'Milano',
    zip: '20121',
    country: 'Italy',
  },
  billing: {
    address: 'Via Roma 123',
    city: 'Milano',
    zip: '20121',
    country: 'Italy',
  },
  items: [
    {
      id: '1',
      name: 'Wireless Headphones',
      sku: 'WH-001',
      quantity: 1,
      price: 89.99,
    },
    {
      id: '2',
      name: 'USB-C Cable',
      sku: 'USB-001',
      quantity: 2,
      price: 9.99,
    },
  ],
  subtotal: 109.97,
  shipping: 10.00,
  tax: 24.00,
  total: 143.97,
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">
            Order {orderData.orderNumber}
          </h2>
          <p className="text-muted-foreground">
            {new Date(orderData.date).toLocaleString('it-IT')}
          </p>
        </div>
        <Badge>{orderData.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded bg-muted" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        €{item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>€{orderData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>€{orderData.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>€{orderData.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>€{orderData.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{orderData.shipping.address}</p>
                  <p>
                    {orderData.shipping.zip} {orderData.shipping.city}
                  </p>
                  <p>{orderData.shipping.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select defaultValue={orderData.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full">Update Status</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{orderData.customer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{orderData.customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{orderData.customer.phone}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Package className="mr-2 h-4 w-4" />
                Mark as Packed
              </Button>
              <Button variant="outline" className="w-full">
                <Truck className="mr-2 h-4 w-4" />
                Create Shipping Label
              </Button>
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Update Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
