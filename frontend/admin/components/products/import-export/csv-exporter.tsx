/**
 * CSV Exporter Component
 * Esportazione prodotti in CSV
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Download } from 'lucide-react'

interface ExportOptions {
  fields: string[]
  includeVariants: boolean
  includeArchived: boolean
  format: 'csv' | 'xlsx'
}

interface CSVExporterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: any[]
  totalCount: number
}

export function CSVExporter({
  open,
  onOpenChange,
  products,
  totalCount,
}: CSVExporterProps) {
  const [options, setOptions] = useState<ExportOptions>({
    fields: ['name', 'sku', 'price', 'quantity', 'status'],
    includeVariants: false,
    includeArchived: false,
    format: 'csv',
  })

  const availableFields = [
    { id: 'name', label: 'Name' },
    { id: 'sku', label: 'SKU' },
    { id: 'price', label: 'Price' },
    { id: 'compareAtPrice', label: 'Compare at Price' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'status', label: 'Status' },
    { id: 'category', label: 'Category' },
    { id: 'description', label: 'Description' },
    { id: 'weight', label: 'Weight' },
    { id: 'dimensions', label: 'Dimensions' },
    { id: 'featured', label: 'Featured' },
    { id: 'metaTitle', label: 'Meta Title' },
    { id: 'metaDescription', label: 'Meta Description' },
  ]

  const handleFieldToggle = (fieldId: string) => {
    setOptions({
      ...options,
      fields: options.fields.includes(fieldId)
        ? options.fields.filter((f) => f !== fieldId)
        : [...options.fields, fieldId],
    })
  }

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return ''

    const headers = options.fields
    const csvLines = [headers.join(',')]

    data.forEach((item) => {
      const values = headers.map((field) => {
        let value = item[field] ?? ''
        
        // Handle special cases
        if (typeof value === 'boolean') {
          value = value ? 'Yes' : 'No'
        } else if (typeof value === 'object') {
          value = JSON.stringify(value)
        }
        
        // Escape commas and quotes
        value = String(value).replace(/"/g, '""')
        if (value.includes(',') || value.includes('"')) {
          value = `"${value}"`
        }
        
        return value
      })
      
      csvLines.push(values.join(','))
    })

    return csvLines.join('\n')
  }

  const handleExport = () => {
    let dataToExport = [...products]

    // Filter archived if needed
    if (!options.includeArchived) {
      dataToExport = dataToExport.filter((p) => p.status !== 'archived')
    }

    // Generate CSV
    const csv = convertToCSV(dataToExport)

    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Products</DialogTitle>
          <DialogDescription>
            Export {totalCount} products to CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value: 'csv' | 'xlsx') =>
                setOptions({ ...options, format: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (.csv)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" disabled />
                <Label htmlFor="xlsx" className="text-muted-foreground">
                  Excel (.xlsx) - Coming soon
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Fields Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fields to Export</Label>
              <div className="space-x-2">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() =>
                    setOptions({
                      ...options,
                      fields: availableFields.map((f) => f.id),
                    })
                  }
                >
                  Select All
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setOptions({ ...options, fields: [] })}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 border rounded-lg">
              {availableFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={options.fields.includes(field.id)}
                    onCheckedChange={() => handleFieldToggle(field.id)}
                  />
                  <Label htmlFor={field.id} className="cursor-pointer">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label>Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeVariants"
                checked={options.includeVariants}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeVariants: !!checked })
                }
              />
              <Label htmlFor="includeVariants" className="cursor-pointer">
                Include product variants
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeArchived"
                checked={options.includeArchived}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeArchived: !!checked })
                }
              />
              <Label htmlFor="includeArchived" className="cursor-pointer">
                Include archived products
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={options.fields.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export {products.length} Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
