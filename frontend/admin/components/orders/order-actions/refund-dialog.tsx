/**
 * Refund Dialog Component
 * Rimborso parziale o totale
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { RefreshCw, AlertCircle } from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  total: number
}

interface RefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  items: OrderItem[]
  orderTotal: number
  shippingCost: number
  refundedAmount: number
  onRefund: (data: RefundData) => Promise<void>
}

export interface RefundData {
  type: 'full' | 'partial'
  amount: number
  items: Array<{ id: string; quantity: number; amount: number }>
  refundShipping: boolean
  reason: string
  notes?: string
  restockItems: boolean
  notifyCustomer: boolean
}

export function RefundDialog({
  open,
  onOpenChange,
  orderId,
  items,
  orderTotal,
  shippingCost,
  refundedAmount,
  onRefund,
}: RefundDialogProps) {
  const availableAmount = orderTotal - refundedAmount

  const [refundData, setRefundData] = useState<RefundData>({
    type: 'full',
    amount: availableAmount,
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      amount: item.total,
    })),
    refundShipping: true,
    reason: '',
    notes: '',
    restockItems: true,
    notifyCustomer: true,
  })

  const [isRefunding, setIsRefunding] = useState(false)

  const handleTypeChange = (type: 'full' | 'partial') => {
    setRefundData({
      ...refundData,
      type,
      amount: type === 'full' ? availableAmount : 0,
      items:
        type === 'full'
          ? items.map((item) => ({
              id: item.id,
              quantity: item.quantity,
              amount: item.total,
            }))
          : items.map((item) => ({
              id: item.id,
              quantity: 0,
              amount: 0,
            })),
      refundShipping: type === 'full',
    })
  }

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const amount = (item.total / item.quantity) * quantity

    const newItems = refundData.items.map((i) =>
      i.id === itemId ? { ...i, quantity, amount } : i
    )

    const itemsTotal = newItems.reduce((sum, i) => sum + i.amount, 0)
    const totalAmount = itemsTotal + (refundData.refundShipping ? shippingCost : 0)

    setRefundData({
      ...refundData,
      items: newItems,
      amount: totalAmount,
    })
  }

  const handleShippingToggle = (checked: boolean) => {
    const itemsTotal = refundData.items.reduce((sum, i) => sum + i.amount, 0)
    const totalAmount = itemsTotal + (checked ? shippingCost : 0)

    setRefundData({
      ...refundData,
      refundShipping: checked,
      amount: totalAmount,
    })
  }

  const handleRefund = async () => {
    setIsRefunding(true)
    try {
      await onRefund(refundData)
      onOpenChange(false)
    } catch (error) {
      console.error('Refund error:', error)
    } finally {
      setIsRefunding(false)
    }
  }

  const isValid = refundData.amount > 0 && refundData.reason !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Refund Order
          </DialogTitle>
          <DialogDescription>
            Issue a full or partial refund for order {orderId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Refund Amount Summary */}
          <Alert>
            <AlertDescription>
              <div className="flex justify-between text-sm">
                <span>Order Total:</span>
                <span className="font-medium">€{orderTotal.toFixed(2)}</span>
              </div>
              {refundedAmount > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span>Already Refunded:</span>
                  <span className="font-medium text-red-600">
                    -€{refundedAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm mt-1 pt-1 border-t">
                <span>Available for Refund:</span>
                <span className="font-bold">€{availableAmount.toFixed(2)}</span>
              </div>
            </AlertDescription>
          </Alert>

          {/* Refund Type */}
          <div className="space-y-3">
            <Label>Refund Type</Label>
            <RadioGroup value={refundData.type} onValueChange={handleTypeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="cursor-pointer">
                  Full Refund (€{availableAmount.toFixed(2)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="cursor-pointer">
                  Partial Refund
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Items Selection (for partial refund) */}
          {refundData.type === 'partial' && (
            <div className="space-y-3">
              <Label>Items to Refund</Label>
              <div className="border rounded-lg divide-y">
                {items.map((item) => {
                  const refundItem = refundData.items.find((i) => i.id === item.id)

                  return (
                    <div key={item.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            €{item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-24">
                            <Input
                              type="number"
                              min={0}
                              max={item.quantity}
                              value={refundItem?.quantity || 0}
                              onChange={(e) =>
                                handleItemQuantityChange(
                                  item.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                          <div className="w-24 text-right font-medium">
                            €{(refundItem?.amount || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Shipping Refund */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="refund-shipping"
                    checked={refundData.refundShipping}
                    onCheckedChange={handleShippingToggle}
                  />
                  <Label htmlFor="refund-shipping" className="cursor-pointer">
                    Refund shipping cost
                  </Label>
                </div>
                <span className="font-medium">€{shippingCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Refund Amount */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total Refund Amount</span>
              <span className="font-bold text-2xl">€{refundData.amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Refund Reason *</Label>
            <Select
              value={refundData.reason}
              onValueChange={(value) => setRefundData({ ...refundData, reason: value })}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="defective_product">Defective Product</SelectItem>
                <SelectItem value="wrong_item">Wrong Item Sent</SelectItem>
                <SelectItem value="not_as_described">Not as Described</SelectItem>
                <SelectItem value="damaged_shipping">Damaged in Shipping</SelectItem>
                <SelectItem value="duplicate_order">Duplicate Order</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information..."
              value={refundData.notes}
              onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="restock"
                checked={refundData.restockItems}
                onCheckedChange={(checked) =>
                  setRefundData({ ...refundData, restockItems: !!checked })
                }
              />
              <Label htmlFor="restock" className="cursor-pointer">
                Restock refunded items to inventory
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify"
                checked={refundData.notifyCustomer}
                onCheckedChange={(checked) =>
                  setRefundData({ ...refundData, notifyCustomer: !!checked })
                }
              />
              <Label htmlFor="notify" className="cursor-pointer">
                Send refund confirmation email to customer
              </Label>
            </div>
          </div>

          {!isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please enter refund amount and select a reason
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRefund} disabled={!isValid || isRefunding}>
            {isRefunding ? 'Processing...' : `Refund €${refundData.amount.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
