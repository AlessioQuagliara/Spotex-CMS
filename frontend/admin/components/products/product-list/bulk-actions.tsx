/**
 * Bulk Actions Component
 * Azioni massive sui prodotti selezionati
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, Trash2, Archive, Tag, DollarSign } from 'lucide-react'

interface BulkActionsProps {
  selectedIds: string[]
  onAction: (action: string, data?: any) => void
  onClearSelection: () => void
}

export function BulkActions({
  selectedIds,
  onAction,
  onClearSelection,
}: BulkActionsProps) {
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [priceAdjustment, setPriceAdjustment] = useState<{
    type: 'percentage' | 'fixed'
    operation: 'increase' | 'decrease'
    value: number
  }>({
    type: 'percentage',
    operation: 'increase',
    value: 0,
  })

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handlePriceUpdate = () => {
    onAction('update-price', priceAdjustment)
    setPriceDialogOpen(false)
    onClearSelection()
  }

  const handleCategoryUpdate = () => {
    onAction('update-category', selectedCategory)
    setCategoryDialogOpen(false)
    onClearSelection()
  }

  const handleDelete = () => {
    onAction('delete')
    setDeleteDialogOpen(false)
    onClearSelection()
  }

  if (selectedIds.length === 0) return null

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <span className="text-sm font-medium">
          {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Bulk Actions
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setPriceDialogOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Update Prices
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategoryDialogOpen(true)}>
              <Tag className="h-4 w-4 mr-2" />
              Change Category
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onAction('publish')
                onClearSelection()
              }}
            >
              Publish
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onAction('unpublish')
                onClearSelection()
              }}
            >
              Unpublish
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onAction('archive')
                onClearSelection()
              }}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear Selection
        </Button>
      </div>

      {/* Price Update Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Prices</DialogTitle>
            <DialogDescription>
              Adjust prices for {selectedIds.length} selected product
              {selectedIds.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select
                value={priceAdjustment.type}
                onValueChange={(value: 'percentage' | 'fixed') =>
                  setPriceAdjustment({ ...priceAdjustment, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Operation</Label>
              <Select
                value={priceAdjustment.operation}
                onValueChange={(value: 'increase' | 'decrease') =>
                  setPriceAdjustment({ ...priceAdjustment, operation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase</SelectItem>
                  <SelectItem value="decrease">Decrease</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Value</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={priceAdjustment.value}
                  onChange={(e) =>
                    setPriceAdjustment({
                      ...priceAdjustment,
                      value: parseFloat(e.target.value),
                    })
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {priceAdjustment.type === 'percentage' ? '%' : '€'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePriceUpdate}>Update Prices</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Update Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>
              Set category for {selectedIds.length} selected product
              {selectedIds.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="home">Home & Garden</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCategoryUpdate}>Update Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Products</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} product
              {selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
