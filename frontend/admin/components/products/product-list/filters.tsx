/**
 * Product Filters Component
 * Filtri avanzati per lista prodotti
 */

'use client'

import { useState } from 'react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Filter, X } from 'lucide-react'

export interface ProductFilters {
  search?: string
  status?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  stockStatus?: string
  featured?: boolean
  productType?: string
}

interface FiltersProps {
  filters: ProductFilters
  onChange: (filters: ProductFilters) => void
  onReset: () => void
}

export function Filters({ filters, onChange, onReset }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key as keyof ProductFilters] !== undefined
  ).length

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    onChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const handleRemoveFilter = (key: keyof ProductFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onChange(newFilters)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filters</h4>
                <Button variant="ghost" size="sm" onClick={onReset}>
                  Reset All
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select
                    value={filters.productType || ''}
                    onValueChange={(value) => handleFilterChange('productType', value)}
                  >
                    <SelectTrigger id="productType">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={filters.category || ''}
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockStatus">Stock Status</Label>
                  <Select
                    value={filters.stockStatus || ''}
                    onValueChange={(value) => handleFilterChange('stockStatus', value)}
                  >
                    <SelectTrigger id="stockStatus">
                      <SelectValue placeholder="All stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All stock</SelectItem>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={(e) =>
                        handleFilterChange(
                          'minPrice',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={(e) =>
                        handleFilterChange(
                          'maxPrice',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-2">
              Search: {filters.search}
              <button onClick={() => handleRemoveFilter('search')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-2">
              Status: {filters.status}
              <button onClick={() => handleRemoveFilter('status')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary" className="gap-2">
              Category: {filters.category}
              <button onClick={() => handleRemoveFilter('category')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.productType && (
            <Badge variant="secondary" className="gap-2">
              Type: {filters.productType}
              <button onClick={() => handleRemoveFilter('productType')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.stockStatus && (
            <Badge variant="secondary" className="gap-2">
              Stock: {filters.stockStatus}
              <button onClick={() => handleRemoveFilter('stockStatus')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <Badge variant="secondary" className="gap-2">
              Price: €{filters.minPrice || 0} - €{filters.maxPrice || '∞'}
              <button
                onClick={() => {
                  handleRemoveFilter('minPrice')
                  handleRemoveFilter('maxPrice')
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
