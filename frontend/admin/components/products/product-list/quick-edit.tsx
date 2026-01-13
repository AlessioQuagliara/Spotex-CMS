/**
 * Quick Edit Component
 * Modifica rapida prodotto inline
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  compareAtPrice?: number
  quantity: number
  status: string
  featured: boolean
}

interface QuickEditProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Product) => void
}

export function QuickEdit({ product, open, onOpenChange, onSave }: QuickEditProps) {
  const [editedProduct, setEditedProduct] = useState<Product | null>(null)

  // Update local state when product changes
  if (product && (!editedProduct || editedProduct.id !== product.id)) {
    setEditedProduct(product)
  }

  const handleChange = (field: keyof Product, value: any) => {
    if (!editedProduct) return
    setEditedProduct({
      ...editedProduct,
      [field]: value,
    })
  }

  const handleSave = () => {
    if (!editedProduct) return
    onSave(editedProduct)
    onOpenChange(false)
  }

  if (!editedProduct) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Edit</DialogTitle>
          <DialogDescription>
            Make quick changes to product details
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quick-name">Product Name</Label>
            <Input
              id="quick-name"
              value={editedProduct.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-sku">SKU</Label>
            <Input
              id="quick-sku"
              value={editedProduct.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-price">Price</Label>
            <Input
              id="quick-price"
              type="number"
              step="0.01"
              value={editedProduct.price}
              onChange={(e) => handleChange('price', parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-compareAtPrice">Compare at Price</Label>
            <Input
              id="quick-compareAtPrice"
              type="number"
              step="0.01"
              value={editedProduct.compareAtPrice || ''}
              onChange={(e) =>
                handleChange(
                  'compareAtPrice',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-quantity">Quantity</Label>
            <Input
              id="quick-quantity"
              type="number"
              value={editedProduct.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-status">Status</Label>
            <Select
              value={editedProduct.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger id="quick-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Featured Product</Label>
              <p className="text-sm text-muted-foreground">
                Display in featured sections
              </p>
            </div>
            <Switch
              checked={editedProduct.featured}
              onCheckedChange={(checked) => handleChange('featured', checked)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
