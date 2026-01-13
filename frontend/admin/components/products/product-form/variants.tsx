/**
 * Variants Component
 * Matrix varianti con generazione SKU automatica
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Grid3x3 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface VariantOption {
  name: string
  values: string[]
}

interface Variant {
  id: string
  sku: string
  options: Record<string, string>
  price: number
  compareAtPrice?: number
  quantity: number
  enabled: boolean
}

interface VariantsProps {
  data: {
    hasVariants: boolean
    options: VariantOption[]
    variants: Variant[]
  }
  onChange: (field: string, value: any) => void
  basePrice: number
  baseSku: string
}

export function Variants({ data, onChange, basePrice, baseSku }: VariantsProps) {
  const [newOptionName, setNewOptionName] = useState('')
  const [newOptionValue, setNewOptionValue] = useState('')

  const handleAddOption = () => {
    if (!newOptionName) return

    onChange('options', [
      ...data.options,
      { name: newOptionName, values: [] },
    ])
    setNewOptionName('')
  }

  const handleRemoveOption = (index: number) => {
    onChange(
      'options',
      data.options.filter((_, i) => i !== index)
    )
    // Regenerate variants
    if (data.options.length > 1) {
      generateVariants()
    } else {
      onChange('variants', [])
    }
  }

  const handleAddOptionValue = (optionIndex: number) => {
    if (!newOptionValue) return

    const updatedOptions = [...data.options]
    updatedOptions[optionIndex].values.push(newOptionValue)
    onChange('options', updatedOptions)
    setNewOptionValue('')

    // Regenerate variants when values change
    setTimeout(generateVariants, 0)
  }

  const handleRemoveOptionValue = (optionIndex: number, valueIndex: number) => {
    const updatedOptions = [...data.options]
    updatedOptions[optionIndex].values = updatedOptions[optionIndex].values.filter(
      (_, i) => i !== valueIndex
    )
    onChange('options', updatedOptions)

    // Regenerate variants
    setTimeout(generateVariants, 0)
  }

  const generateVariants = () => {
    if (data.options.length === 0 || data.options.some((opt) => opt.values.length === 0)) {
      onChange('variants', [])
      return
    }

    // Generate all combinations
    const combinations = cartesianProduct(data.options.map((opt) => opt.values))

    const variants: Variant[] = combinations.map((combo, index) => {
      const options: Record<string, string> = {}
      data.options.forEach((opt, i) => {
        options[opt.name] = combo[i]
      })

      // Generate SKU
      const skuSuffix = combo.map((v) => v.substring(0, 3).toUpperCase()).join('-')
      const sku = `${baseSku}-${skuSuffix}-${index + 1}`

      return {
        id: Date.now().toString() + index,
        sku,
        options,
        price: basePrice,
        quantity: 0,
        enabled: true,
      }
    })

    onChange('variants', variants)
  }

  const cartesianProduct = (arrays: string[][]): string[][] => {
    return arrays.reduce(
      (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
      [[]] as string[][]
    )
  }

  const handleVariantChange = (id: string, field: string, value: any) => {
    onChange(
      'variants',
      data.variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    )
  }

  const handleBulkPriceUpdate = (percentage: number) => {
    onChange(
      'variants',
      data.variants.map((v) => ({
        ...v,
        price: Math.round(v.price * (1 + percentage / 100) * 100) / 100,
      }))
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>
            Create variants with different options (color, size, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>This product has variants</Label>
              <p className="text-sm text-muted-foreground">
                Enable multiple options for this product
              </p>
            </div>
            <Switch
              checked={data.hasVariants}
              onCheckedChange={(checked) => {
                onChange('hasVariants', checked)
                if (!checked) {
                  onChange('options', [])
                  onChange('variants', [])
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {data.hasVariants && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Variant Options</CardTitle>
              <CardDescription>Add options like Size, Color, Material</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.options.map((option, optionIndex) => (
                <div key={optionIndex} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{option.name}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(optionIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value, valueIndex) => (
                      <Badge key={valueIndex} variant="secondary" className="gap-2">
                        {value}
                        <button
                          onClick={() => handleRemoveOptionValue(optionIndex, valueIndex)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder={`Add ${option.name.toLowerCase()} value`}
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddOptionValue(optionIndex)
                        }
                      }}
                    />
                    <Button onClick={() => handleAddOptionValue(optionIndex)} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Option name (e.g., Size, Color)"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOption()
                    }
                  }}
                />
                <Button onClick={handleAddOption}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </CardContent>
          </Card>

          {data.variants.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Variant Matrix</CardTitle>
                    <CardDescription>
                      {data.variants.length} variants generated
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkPriceUpdate(10)}
                    >
                      +10% Price
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkPriceUpdate(-10)}
                    >
                      -10% Price
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Active</TableHead>
                      {data.options.map((opt) => (
                        <TableHead key={opt.name}>{opt.name}</TableHead>
                      ))}
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Compare At</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.variants.map((variant) => (
                      <TableRow key={variant.id}>
                        <TableCell>
                          <Switch
                            checked={variant.enabled}
                            onCheckedChange={(checked) =>
                              handleVariantChange(variant.id, 'enabled', checked)
                            }
                          />
                        </TableCell>
                        {data.options.map((opt) => (
                          <TableCell key={opt.name}>
                            <Badge variant="outline">{variant.options[opt.name]}</Badge>
                          </TableCell>
                        ))}
                        <TableCell>
                          <Input
                            value={variant.sku}
                            onChange={(e) =>
                              handleVariantChange(variant.id, 'sku', e.target.value)
                            }
                            className="w-32 h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) =>
                              handleVariantChange(
                                variant.id,
                                'price',
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-24 h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.compareAtPrice || ''}
                            onChange={(e) =>
                              handleVariantChange(
                                variant.id,
                                'compareAtPrice',
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                            className="w-24 h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={variant.quantity}
                            onChange={(e) =>
                              handleVariantChange(
                                variant.id,
                                'quantity',
                                parseInt(e.target.value)
                              )
                            }
                            className="w-20 h-8"
                            min="0"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
