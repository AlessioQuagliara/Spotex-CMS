/**
 * Shipping Label Component
 * Generazione etichette spedizione con API carriers
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
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Printer, Download, Package, Truck, CheckCircle } from 'lucide-react'

interface ShippingLabelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  shippingAddress: {
    name: string
    address: string
    city: string
    province: string
    postalCode: string
    country: string
    phone: string
  }
  weight: number
  dimensions?: { length: number; width: number; height: number }
  onGenerate: (data: LabelData) => Promise<{ labelUrl: string; trackingNumber: string }>
}

export interface LabelData {
  carrier: string
  service: string
  packageType: string
  weight: number
  dimensions?: { length: number; width: number; height: number }
  insurance?: number
  signature: boolean
}

export function ShippingLabelDialog({
  open,
  onOpenChange,
  orderId,
  shippingAddress,
  weight,
  dimensions,
  onGenerate,
}: ShippingLabelProps) {
  const [labelData, setLabelData] = useState<LabelData>({
    carrier: '',
    service: '',
    packageType: 'parcel',
    weight,
    dimensions,
    insurance: undefined,
    signature: false,
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLabel, setGeneratedLabel] = useState<{
    labelUrl: string
    trackingNumber: string
  } | null>(null)

  // Mock carrier rates
  const [rates] = useState([
    {
      carrier: 'dhl',
      service: 'express',
      price: 15.99,
      estimatedDays: '1-2',
      logo: '📦',
    },
    {
      carrier: 'ups',
      service: 'standard',
      price: 12.49,
      estimatedDays: '3-5',
      logo: '📦',
    },
    {
      carrier: 'fedex',
      service: 'priority',
      price: 18.99,
      estimatedDays: '1-2',
      logo: '📦',
    },
    {
      carrier: 'gls',
      service: 'express',
      price: 13.99,
      estimatedDays: '2-3',
      logo: '📦',
    },
  ])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await onGenerate(labelData)
      setGeneratedLabel(result)
    } catch (error) {
      console.error('Label generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    if (generatedLabel) {
      window.open(generatedLabel.labelUrl, '_blank')
    }
  }

  const handleDownload = () => {
    if (generatedLabel) {
      const link = document.createElement('a')
      link.href = generatedLabel.labelUrl
      link.download = `shipping-label-${orderId}.pdf`
      link.click()
    }
  }

  const selectedRate = rates.find(
    (r) => r.carrier === labelData.carrier && r.service === labelData.service
  )

  const isValid = labelData.carrier && labelData.service && labelData.weight > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Generate Shipping Label
          </DialogTitle>
          <DialogDescription>Order {orderId}</DialogDescription>
        </DialogHeader>

        {!generatedLabel ? (
          <div className="space-y-6">
            {/* Shipping Address */}
            <Card className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Ship To
              </h4>
              <address className="text-sm text-muted-foreground not-italic">
                <strong>{shippingAddress.name}</strong>
                <br />
                {shippingAddress.address}
                <br />
                {shippingAddress.postalCode} {shippingAddress.city} (
                {shippingAddress.province})
                <br />
                {shippingAddress.country}
                <br />
                {shippingAddress.phone}
              </address>
            </Card>

            {/* Package Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packageType">Package Type</Label>
                <Select
                  value={labelData.packageType}
                  onValueChange={(value) =>
                    setLabelData({ ...labelData, packageType: value })
                  }
                >
                  <SelectTrigger id="packageType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parcel">Parcel</SelectItem>
                    <SelectItem value="envelope">Envelope</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="tube">Tube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={labelData.weight}
                  onChange={(e) =>
                    setLabelData({ ...labelData, weight: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label>Dimensions (cm) - Optional</Label>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Length"
                  type="number"
                  value={labelData.dimensions?.length || ''}
                  onChange={(e) =>
                    setLabelData({
                      ...labelData,
                      dimensions: {
                        ...labelData.dimensions,
                        length: parseFloat(e.target.value),
                        width: labelData.dimensions?.width || 0,
                        height: labelData.dimensions?.height || 0,
                      },
                    })
                  }
                />
                <Input
                  placeholder="Width"
                  type="number"
                  value={labelData.dimensions?.width || ''}
                  onChange={(e) =>
                    setLabelData({
                      ...labelData,
                      dimensions: {
                        ...labelData.dimensions,
                        width: parseFloat(e.target.value),
                        length: labelData.dimensions?.length || 0,
                        height: labelData.dimensions?.height || 0,
                      },
                    })
                  }
                />
                <Input
                  placeholder="Height"
                  type="number"
                  value={labelData.dimensions?.height || ''}
                  onChange={(e) =>
                    setLabelData({
                      ...labelData,
                      dimensions: {
                        ...labelData.dimensions,
                        height: parseFloat(e.target.value),
                        length: labelData.dimensions?.length || 0,
                        width: labelData.dimensions?.width || 0,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Carrier & Service Selection */}
            <div className="space-y-3">
              <Label>Select Carrier & Service</Label>
              <div className="grid grid-cols-2 gap-3">
                {rates.map((rate) => (
                  <Card
                    key={`${rate.carrier}-${rate.service}`}
                    className={`p-4 cursor-pointer transition-colors hover:border-primary ${
                      labelData.carrier === rate.carrier &&
                      labelData.service === rate.service
                        ? 'border-primary bg-primary/5'
                        : ''
                    }`}
                    onClick={() =>
                      setLabelData({
                        ...labelData,
                        carrier: rate.carrier,
                        service: rate.service,
                      })
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{rate.logo}</span>
                        <div>
                          <p className="font-medium capitalize">
                            {rate.carrier} {rate.service}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rate.estimatedDays} business days
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">€{rate.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance Value (€) - Optional</Label>
                <Input
                  id="insurance"
                  type="number"
                  placeholder="0.00"
                  value={labelData.insurance || ''}
                  onChange={(e) =>
                    setLabelData({
                      ...labelData,
                      insurance: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="signature"
                  checked={labelData.signature}
                  onChange={(e) =>
                    setLabelData({ ...labelData, signature: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="signature" className="cursor-pointer">
                  Require signature on delivery (+€2.50)
                </Label>
              </div>
            </div>

            {/* Price Summary */}
            {selectedRate && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Shipping Rate:</span>
                      <span>€{selectedRate.price.toFixed(2)}</span>
                    </div>
                    {labelData.insurance && (
                      <div className="flex justify-between text-sm">
                        <span>Insurance:</span>
                        <span>€{(labelData.insurance * 0.01).toFixed(2)}</span>
                      </div>
                    )}
                    {labelData.signature && (
                      <div className="flex justify-between text-sm">
                        <span>Signature Required:</span>
                        <span>€2.50</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1 border-t">
                      <span>Total:</span>
                      <span>
                        €
                        {(
                          selectedRate.price +
                          (labelData.insurance ? labelData.insurance * 0.01 : 0) +
                          (labelData.signature ? 2.5 : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          /* Generated Label */
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Shipping label generated successfully!</strong>
              </AlertDescription>
            </Alert>

            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Label Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Your shipping label has been created
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Carrier:</span>
                    <span className="font-medium capitalize">{labelData.carrier}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium capitalize">{labelData.service}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tracking Number:</span>
                    <Badge>{generatedLabel.trackingNumber}</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handlePrint} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Print Label
              </Button>
              <Button variant="outline" onClick={handleDownload} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {generatedLabel ? 'Done' : 'Cancel'}
          </Button>
          {!generatedLabel && (
            <Button onClick={handleGenerate} disabled={!isValid || isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Label'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
