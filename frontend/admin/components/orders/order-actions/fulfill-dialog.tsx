/**
 * Fulfill Dialog Component
 * Workflow fulfillment ordine con tracking
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, Truck, AlertCircle } from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  quantityFulfilled: number
}

interface FulfillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  items: OrderItem[]
  onFulfill: (data: FulfillmentData) => Promise<void>
}

export interface FulfillmentData {
  items: Array<{ id: string; quantity: number }>
  carrier: string
  service: string
  trackingNumber?: string
  notifyCustomer: boolean
}

export function FulfillDialog({
  open,
  onOpenChange,
  orderId,
  items,
  onFulfill,
}: FulfillDialogProps) {
  const [fulfillmentData, setFulfillmentData] = useState<FulfillmentData>({
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity - item.quantityFulfilled,
    })),
    carrier: '',
    service: '',
    trackingNumber: '',
    notifyCustomer: true,
  })

  const [isFulfilling, setIsFulfilling] = useState(false)

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setFulfillmentData({
      ...fulfillmentData,
      items: fulfillmentData.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    })
  }

  const handleFulfill = async () => {
    setIsFulfilling(true)
    try {
      await onFulfill(fulfillmentData)
      onOpenChange(false)
    } catch (error) {
      console.error('Fulfillment error:', error)
    } finally {
      setIsFulfilling(false)
    }
  }

  const totalItems = fulfillmentData.items.reduce((sum, item) => sum + item.quantity, 0)
  const isValid = totalItems > 0 && fulfillmentData.carrier && fulfillmentData.service

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Fulfill Order Items
          </DialogTitle>
          <DialogDescription>
            Select items to fulfill and add shipping details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Items Selection */}
          <div className="space-y-3">
            <Label>Items to Fulfill</Label>
            <div className="border rounded-lg divide-y">
              {items.map((item) => {
                const fulfillItem = fulfillmentData.items.find((i) => i.id === item.id)
                const availableQty = item.quantity - item.quantityFulfilled

                return (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Available: {availableQty} / {item.quantity}
                        </p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min={0}
                          max={availableQty}
                          value={fulfillItem?.quantity || 0}
                          onChange={(e) =>
                            handleQuantityChange(item.id, parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              Total items to fulfill: <strong>{totalItems}</strong>
            </p>
          </div>

          {/* Shipping Details */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipping Details
            </Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier *</Label>
                <Select
                  value={fulfillmentData.carrier}
                  onValueChange={(value) =>
                    setFulfillmentData({ ...fulfillmentData, carrier: value })
                  }
                >
                  <SelectTrigger id="carrier">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dhl">DHL</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="gls">GLS</SelectItem>
                    <SelectItem value="bartolini">Bartolini</SelectItem>
                    <SelectItem value="poste">Poste Italiane</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select
                  value={fulfillmentData.service}
                  onValueChange={(value) =>
                    setFulfillmentData({ ...fulfillmentData, service: value })
                  }
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="overnight">Overnight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number (optional)</Label>
              <Input
                id="tracking"
                placeholder="Enter tracking number"
                value={fulfillmentData.trackingNumber}
                onChange={(e) =>
                  setFulfillmentData({
                    ...fulfillmentData,
                    trackingNumber: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Notification */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={fulfillmentData.notifyCustomer}
              onCheckedChange={(checked) =>
                setFulfillmentData({
                  ...fulfillmentData,
                  notifyCustomer: !!checked,
                })
              }
            />
            <Label htmlFor="notify" className="cursor-pointer">
              Send shipping confirmation email to customer
            </Label>
          </div>

          {!isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select items to fulfill and choose carrier and service
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleFulfill} disabled={!isValid || isFulfilling}>
            {isFulfilling ? 'Fulfilling...' : 'Fulfill Items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
