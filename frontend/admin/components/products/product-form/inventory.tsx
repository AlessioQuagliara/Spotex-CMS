/**
 * Inventory Component
 * Gestione inventario multi-location
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'

interface Location {
  id: string
  name: string
  quantity: number
}

interface InventoryProps {
  data: {
    sku: string
    barcode?: string
    trackInventory: boolean
    stockStatus: string
    quantity: number
    lowStockThreshold?: number
    allowBackorder: boolean
    allowPreorder: boolean
    locations: Location[]
  }
  onChange: (field: string, value: any) => void
}

export function Inventory({ data, onChange }: InventoryProps) {
  const [newLocation, setNewLocation] = useState('')

  const totalStock = data.locations.reduce((sum, loc) => sum + loc.quantity, 0)

  const handleAddLocation = () => {
    if (!newLocation) return

    const location: Location = {
      id: Date.now().toString(),
      name: newLocation,
      quantity: 0,
    }

    onChange('locations', [...data.locations, location])
    setNewLocation('')
  }

  const handleRemoveLocation = (id: string) => {
    onChange(
      'locations',
      data.locations.filter((loc) => loc.id !== id)
    )
  }

  const handleLocationQuantityChange = (id: string, quantity: number) => {
    onChange(
      'locations',
      data.locations.map((loc) => (loc.id === id ? { ...loc, quantity } : loc))
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>SKU and stock management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={data.sku}
                onChange={(e) => onChange('sku', e.target.value)}
                placeholder="PRODUCT-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode (ISBN, UPC, GTIN)</Label>
              <Input
                id="barcode"
                value={data.barcode || ''}
                onChange={(e) => onChange('barcode', e.target.value || undefined)}
                placeholder="0123456789"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label>Track Inventory</Label>
              <p className="text-sm text-muted-foreground">
                Monitor stock levels for this product
              </p>
            </div>
            <Switch
              checked={data.trackInventory}
              onCheckedChange={(checked) => onChange('trackInventory', checked)}
            />
          </div>

          {!data.trackInventory && (
            <div className="space-y-2">
              <Label htmlFor="stockStatus">Stock Status</Label>
              <Select value={data.stockStatus} onValueChange={(value) => onChange('stockStatus', value)}>
                <SelectTrigger id="stockStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  <SelectItem value="on-backorder">On Backorder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {data.trackInventory && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
              <CardDescription>Manage inventory across locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.locations.length === 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={data.quantity}
                    onChange={(e) => onChange('quantity', parseInt(e.target.value))}
                    min="0"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {data.locations.map((location) => (
                    <div key={location.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-sm">{location.name}</Label>
                      </div>
                      <Input
                        type="number"
                        value={location.quantity}
                        onChange={(e) =>
                          handleLocationQuantityChange(location.id, parseInt(e.target.value))
                        }
                        className="w-24"
                        min="0"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLocation(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total Stock:</span>
                    <Badge variant="secondary">{totalStock} units</Badge>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="Location name"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
                <Button onClick={handleAddLocation} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={data.lowStockThreshold || ''}
                  onChange={(e) =>
                    onChange(
                      'lowStockThreshold',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="10"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Get notified when stock falls below this level
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Backorder</Label>
                  <p className="text-sm text-muted-foreground">
                    Continue selling when out of stock
                  </p>
                </div>
                <Switch
                  checked={data.allowBackorder}
                  onCheckedChange={(checked) => onChange('allowBackorder', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Pre-order</Label>
                  <p className="text-sm text-muted-foreground">
                    Accept orders before product is available
                  </p>
                </div>
                <Switch
                  checked={data.allowPreorder}
                  onCheckedChange={(checked) => onChange('allowPreorder', checked)}
                />
              </div>

              {(data.allowBackorder || data.allowPreorder) && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    {data.allowBackorder && 'Customers can order even when stock is 0. '}
                    {data.allowPreorder && 'Pre-orders will be fulfilled when stock arrives.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
