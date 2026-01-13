/**
 * Basic Info Component
 * Informazioni di base del prodotto
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface BasicInfoProps {
  data: {
    name: string
    slug: string
    description: string
    shortDescription: string
    status: string
    featured: boolean
    productType: string
  }
  onChange: (field: string, value: any) => void
}

export function BasicInfo({ data, onChange }: BasicInfoProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential product details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={data.slug}
              onChange={(e) => onChange('slug', e.target.value)}
              placeholder="product-name"
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated from product name if left empty
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              value={data.shortDescription}
              onChange={(e) => onChange('shortDescription', e.target.value)}
              placeholder="Brief product description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Detailed product description"
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productType">Product Type</Label>
            <Select value={data.productType} onValueChange={(value) => onChange('productType', value)}>
              <SelectTrigger id="productType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical Product</SelectItem>
                <SelectItem value="digital">Digital Product</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={data.status} onValueChange={(value) => onChange('status', value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Featured Product</Label>
              <p className="text-sm text-muted-foreground">
                Display in featured sections
              </p>
            </div>
            <Switch
              checked={data.featured}
              onCheckedChange={(checked) => onChange('featured', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
