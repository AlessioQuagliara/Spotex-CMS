/**
 * Invoice Generator Component
 * Generazione PDF fatture con template
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
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Download, Mail, Printer, CheckCircle } from 'lucide-react'

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  notes?: string
  includeShipping: boolean
  includeTax: boolean
}

interface InvoiceGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderNumber: string
  orderDate: Date
  customer: {
    name: string
    email: string
    vatNumber?: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
  }>
  totals: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  billingAddress: {
    name: string
    address: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  onGenerate: (data: InvoiceData) => Promise<{ pdfUrl: string; invoiceId: string }>
}

export function InvoiceGenerator({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  orderDate,
  customer,
  items,
  totals,
  billingAddress,
  onGenerate,
}: InvoiceGeneratorProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    notes: '',
    includeShipping: true,
    includeTax: true,
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState<{
    pdfUrl: string
    invoiceId: string
  } | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await onGenerate(invoiceData)
      setGeneratedInvoice(result)
    } catch (error) {
      console.error('Invoice generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (generatedInvoice) {
      const link = document.createElement('a')
      link.href = generatedInvoice.pdfUrl
      link.download = `${invoiceData.invoiceNumber}.pdf`
      link.click()
    }
  }

  const handlePrint = () => {
    if (generatedInvoice) {
      window.open(generatedInvoice.pdfUrl, '_blank')
    }
  }

  const handleEmail = () => {
    if (generatedInvoice) {
      // TODO: Implement email sending
      console.log('Sending invoice to:', customer.email)
    }
  }

  const calculateTotal = () => {
    let total = totals.subtotal
    if (invoiceData.includeShipping) total += totals.shipping
    if (invoiceData.includeTax) total += totals.tax
    return total
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Invoice
          </DialogTitle>
          <DialogDescription>
            Create invoice for order {orderNumber}
          </DialogDescription>
        </DialogHeader>

        {!generatedInvoice ? (
          <div className="space-y-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceData.invoiceDate.toISOString().split('T')[0]}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      invoiceDate: new Date(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="dueDate">Payment Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceData.dueDate.toISOString().split('T')[0]}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      dueDate: new Date(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Invoice Preview */}
            <Card className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">INVOICE</h3>
                    <p className="text-sm text-muted-foreground">
                      {invoiceData.invoiceNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Your Company Name</p>
                    <p className="text-sm text-muted-foreground">Via Example 123</p>
                    <p className="text-sm text-muted-foreground">00100 Roma, Italy</p>
                    <p className="text-sm text-muted-foreground">VAT: IT12345678901</p>
                  </div>
                </div>

                <Separator />

                {/* Bill To */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Bill To:</h4>
                    <address className="text-sm not-italic">
                      <strong>{billingAddress.name}</strong>
                      <br />
                      {billingAddress.address}
                      <br />
                      {billingAddress.postalCode} {billingAddress.city} (
                      {billingAddress.province})
                      <br />
                      {billingAddress.country}
                      {customer.vatNumber && (
                        <>
                          <br />
                          VAT: {customer.vatNumber}
                        </>
                      )}
                    </address>
                  </div>
                  <div className="text-right">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoice Date:</span>
                        <span>
                          {invoiceData.invoiceDate.toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>{invoiceData.dueDate.toLocaleDateString('it-IT')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order:</span>
                        <span>{orderNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Quantity</th>
                        <th className="text-right py-2">Unit Price</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.name}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">€{item.price.toFixed(2)}</td>
                          <td className="text-right font-medium">
                            €{item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>€{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {invoiceData.includeShipping && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping:</span>
                        <span>€{totals.shipping.toFixed(2)}</span>
                      </div>
                    )}
                    {invoiceData.includeTax && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VAT (22%):</span>
                        <span>€{totals.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>€{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeShipping"
                  checked={invoiceData.includeShipping}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      includeShipping: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="includeShipping" className="cursor-pointer">
                  Include shipping cost
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeTax"
                  checked={invoiceData.includeTax}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, includeTax: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="includeTax" className="cursor-pointer">
                  Include VAT
                </Label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Invoice Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add payment terms, thank you message, etc..."
                value={invoiceData.notes}
                onChange={(e) =>
                  setInvoiceData({ ...invoiceData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        ) : (
          /* Generated Invoice */
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Invoice generated successfully!</strong>
              </AlertDescription>
            </Alert>

            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Invoice Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Invoice #{invoiceData.invoiceNumber}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" onClick={handleDownload} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handlePrint} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleEmail} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {generatedInvoice ? 'Done' : 'Cancel'}
          </Button>
          {!generatedInvoice && (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Invoice'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
