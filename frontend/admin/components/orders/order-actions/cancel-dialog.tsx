/**
 * Cancel Dialog Component
 * Cancellazione ordine con motivo
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
import { XCircle, AlertTriangle } from 'lucide-react'

interface CancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderTotal: number
  paymentStatus: string
  onCancel: (data: CancelData) => Promise<void>
}

export interface CancelData {
  reason: string
  notes?: string
  refund: boolean
  restockItems: boolean
  notifyCustomer: boolean
}

export function CancelDialog({
  open,
  onOpenChange,
  orderId,
  orderTotal,
  paymentStatus,
  onCancel,
}: CancelDialogProps) {
  const [cancelData, setCancelData] = useState<CancelData>({
    reason: '',
    notes: '',
    refund: paymentStatus === 'paid',
    restockItems: true,
    notifyCustomer: true,
  })

  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await onCancel(cancelData)
      onOpenChange(false)
    } catch (error) {
      console.error('Cancel error:', error)
    } finally {
      setIsCancelling(false)
    }
  }

  const isValid = cancelData.reason !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Cancel order {orderId} and optionally refund the customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The order will be marked as cancelled.
            </AlertDescription>
          </Alert>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Select
              value={cancelData.reason}
              onValueChange={(value) => setCancelData({ ...cancelData, reason: value })}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="payment_failed">Payment Failed</SelectItem>
                <SelectItem value="fraudulent">Fraudulent Order</SelectItem>
                <SelectItem value="duplicate">Duplicate Order</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information..."
              value={cancelData.notes}
              onChange={(e) => setCancelData({ ...cancelData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Refund Option */}
          {paymentStatus === 'paid' && (
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="refund"
                    checked={cancelData.refund}
                    onCheckedChange={(checked) =>
                      setCancelData({ ...cancelData, refund: !!checked })
                    }
                  />
                  <Label htmlFor="refund" className="cursor-pointer font-medium">
                    Issue refund to customer
                  </Label>
                </div>
                <span className="font-bold">€{orderTotal.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The customer will receive a full refund via the original payment method
              </p>
            </div>
          )}

          {/* Inventory Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="restock"
              checked={cancelData.restockItems}
              onCheckedChange={(checked) =>
                setCancelData({ ...cancelData, restockItems: !!checked })
              }
            />
            <Label htmlFor="restock" className="cursor-pointer">
              Restock items to inventory
            </Label>
          </div>

          {/* Notification */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={cancelData.notifyCustomer}
              onCheckedChange={(checked) =>
                setCancelData({ ...cancelData, notifyCustomer: !!checked })
              }
            />
            <Label htmlFor="notify" className="cursor-pointer">
              Send cancellation email to customer
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!isValid || isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
