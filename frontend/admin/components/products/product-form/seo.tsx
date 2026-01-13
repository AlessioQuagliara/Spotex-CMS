/**
 * SEO Component
 * Ottimizzazione SEO prodotto
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface SEOProps {
  data: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string[]
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
  }
  onChange: (field: string, value: any) => void
  productName: string
  slug: string
}

export function SEO({ data, onChange, productName, slug }: SEOProps) {
  const metaTitle = data.metaTitle || productName
  const metaDescription = data.metaDescription || ''

  const titleLength = metaTitle.length
  const descriptionLength = metaDescription.length

  const handleKeywordAdd = (keyword: string) => {
    if (keyword && !data.metaKeywords?.includes(keyword)) {
      onChange('metaKeywords', [...(data.metaKeywords || []), keyword])
    }
  }

  const handleKeywordRemove = (keyword: string) => {
    onChange(
      'metaKeywords',
      data.metaKeywords?.filter((k) => k !== keyword) || []
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Search Engine Optimization</CardTitle>
          <CardDescription>
            Optimize how this product appears in search results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={data.metaTitle || ''}
              onChange={(e) => onChange('metaTitle', e.target.value || undefined)}
              placeholder={productName}
              maxLength={60}
            />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Recommended: 50-60 characters
              </span>
              <span
                className={
                  titleLength > 60
                    ? 'text-red-600'
                    : titleLength > 50
                    ? 'text-amber-600'
                    : 'text-green-600'
                }
              >
                {titleLength}/60
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={data.metaDescription || ''}
              onChange={(e) => onChange('metaDescription', e.target.value || undefined)}
              placeholder="Brief description of the product for search results"
              rows={3}
              maxLength={160}
            />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Recommended: 150-160 characters
              </span>
              <span
                className={
                  descriptionLength > 160
                    ? 'text-red-600'
                    : descriptionLength > 150
                    ? 'text-amber-600'
                    : 'text-green-600'
                }
              >
                {descriptionLength}/160
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {data.metaKeywords?.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-2">
                  {keyword}
                  <button
                    onClick={() => handleKeywordRemove(keyword)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add keyword and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleKeywordAdd(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>URL Preview</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-blue-600">
                https://yourstore.com/products/{slug || 'product-name'}
              </p>
              <p className="text-sm font-medium mt-1">{metaTitle}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {metaDescription || 'Add a meta description...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            How this product appears when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ogTitle">Social Title</Label>
            <Input
              id="ogTitle"
              value={data.ogTitle || ''}
              onChange={(e) => onChange('ogTitle', e.target.value || undefined)}
              placeholder={productName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogDescription">Social Description</Label>
            <Textarea
              id="ogDescription"
              value={data.ogDescription || ''}
              onChange={(e) => onChange('ogDescription', e.target.value || undefined)}
              placeholder="Description for social media shares"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogImage">Social Image URL</Label>
            <Input
              id="ogImage"
              value={data.ogImage || ''}
              onChange={(e) => onChange('ogImage', e.target.value || undefined)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x630px
            </p>
          </div>

          {data.ogImage && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={data.ogImage}
                  alt="Social preview"
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-muted">
                  <p className="text-sm font-medium">
                    {data.ogTitle || productName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.ogDescription || metaDescription || 'Product description'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
