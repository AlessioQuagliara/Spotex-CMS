/**
 * Shipping Component
 * Configurazione spedizione prodotto
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ShippingProps {
  data: {
    requiresShipping: boolean
    weight?: number
    weightUnit: string
    dimensions?: {
      length: number
      width: number
      height: number
    }
    dimensionsUnit: string
    hsCode?: string
    countryOfOrigin?: string
  }
  onChange: (field: string, value: any) => void
  productType: string
}

export function Shipping({ data, onChange, productType }: ShippingProps) {
  const isPhysicalProduct = productType === 'physical'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping</CardTitle>
        <CardDescription>Physical product shipping details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPhysicalProduct && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requires Shipping</Label>
                <p className="text-sm text-muted-foreground">
                  This product needs to be shipped
                </p>
              </div>
              <Switch
                checked={data.requiresShipping}
                onCheckedChange={(checked) => onChange('requiresShipping', checked)}
              />
            </div>

            {data.requiresShipping && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={data.weight || ''}
                      onChange={(e) =>
                        onChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      placeholder="0.00"
                    />
                    <Select
                      value={data.weightUnit}
                      onValueChange={(value) => onChange('weightUnit', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dimensions (L × W × H)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={data.dimensions?.length || ''}
                      onChange={(e) =>
                        onChange('dimensions', {
                          ...data.dimensions,
                          length: e.target.value ? parseFloat(e.target.value) : 0,
                        })
                      }
                      placeholder="Length"
                    />
                    <span className="flex items-center">×</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.dimensions?.width || ''}
                      onChange={(e) =>
                        onChange('dimensions', {
                          ...data.dimensions,
                          width: e.target.value ? parseFloat(e.target.value) : 0,
                        })
                      }
                      placeholder="Width"
                    />
                    <span className="flex items-center">×</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.dimensions?.height || ''}
                      onChange={(e) =>
                        onChange('dimensions', {
                          ...data.dimensions,
                          height: e.target.value ? parseFloat(e.target.value) : 0,
                        })
                      }
                      placeholder="Height"
                    />
                    <Select
                      value={data.dimensionsUnit}
                      onValueChange={(value) => onChange('dimensionsUnit', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="hsCode">HS Code</Label>
                  <Input
                    id="hsCode"
                    value={data.hsCode || ''}
                    onChange={(e) => onChange('hsCode', e.target.value || undefined)}
                    placeholder="1234.56.78"
                  />
                  <p className="text-xs text-muted-foreground">
                    Harmonized System code for customs
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryOfOrigin">Country of Origin</Label>
                  <Select
                    value={data.countryOfOrigin || ''}
                    onValueChange={(value) => onChange('countryOfOrigin', value || undefined)}
                  >
                    <SelectTrigger id="countryOfOrigin">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">Italy</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="ES">Spain</SelectItem>
                      <SelectItem value="CN">China</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </>
        )}

        {!isPhysicalProduct && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Shipping not required for {productType} products</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
