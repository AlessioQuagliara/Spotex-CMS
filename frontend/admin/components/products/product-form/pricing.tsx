/**
 * Pricing Component
 * Gestione prezzi e sconti
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PricingProps {
  data: {
    price: number
    compareAtPrice?: number
    costPerItem?: number
    taxable: boolean
    taxClass: string
    currency: string
  }
  onChange: (field: string, value: any) => void
}

export function Pricing({ data, onChange }: PricingProps) {
  const margin = data.costPerItem
    ? ((data.price - data.costPerItem) / data.price) * 100
    : 0

  const discount = data.compareAtPrice
    ? ((data.compareAtPrice - data.price) / data.compareAtPrice) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
        <CardDescription>Set product pricing and discounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {data.currency}
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={data.price}
                onChange={(e) => onChange('price', parseFloat(e.target.value))}
                className="pl-12"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Compare at Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {data.currency}
              </span>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                value={data.compareAtPrice || ''}
                onChange={(e) =>
                  onChange('compareAtPrice', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="pl-12"
              />
            </div>
            {discount > 0 && (
              <p className="text-xs text-green-600">
                {discount.toFixed(0)}% discount
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="costPerItem">Cost per Item</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {data.currency}
            </span>
            <Input
              id="costPerItem"
              type="number"
              step="0.01"
              value={data.costPerItem || ''}
              onChange={(e) =>
                onChange('costPerItem', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="pl-12"
            />
          </div>
          {data.costPerItem && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Margin:</span>
              <span className={margin > 0 ? 'text-green-600' : 'text-red-600'}>
                {margin.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Charge Tax</Label>
              <p className="text-sm text-muted-foreground">
                Add tax to this product
              </p>
            </div>
            <Switch
              checked={data.taxable}
              onCheckedChange={(checked) => onChange('taxable', checked)}
            />
          </div>

          {data.taxable && (
            <div className="space-y-2">
              <Label htmlFor="taxClass">Tax Class</Label>
              <Select value={data.taxClass} onValueChange={(value) => onChange('taxClass', value)}>
                <SelectTrigger id="taxClass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (22%)</SelectItem>
                  <SelectItem value="reduced">Reduced (10%)</SelectItem>
                  <SelectItem value="super-reduced">Super Reduced (4%)</SelectItem>
                  <SelectItem value="zero">Zero Rate (0%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
