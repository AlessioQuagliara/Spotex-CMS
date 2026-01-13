/**
 * Product Edit Page
 * Pagina di editing prodotto con tabs e preview
 */

'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye, MoreVertical, Copy, Archive, Trash2, Clock } from 'lucide-react'
import Link from 'next/link'

// Import form components
import { BasicInfo } from '@/components/products/product-form/basic-info'
import { Pricing } from '@/components/products/product-form/pricing'
import { Inventory } from '@/components/products/product-form/inventory'
import { Variants } from '@/components/products/product-form/variants'
import { Shipping } from '@/components/products/product-form/shipping'
import { SEO } from '@/components/products/product-form/seo'
import { MediaUploader } from '@/components/products/product-form/media-uploader'

interface MediaFile {
  id: string
  url: string
  alt: string
  position: number
  featured: boolean
}

export default function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const isNew = id === 'new'

  // Product state
  const [productData, setProductData] = useState({
    // Basic Info
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    status: 'draft',
    featured: false,
    productType: 'physical',

    // Pricing
    price: 0,
    compareAtPrice: undefined as number | undefined,
    costPerItem: undefined as number | undefined,
    taxable: true,
    taxClass: 'standard',
    currency: '€',

    // Inventory
    sku: '',
    barcode: undefined as string | undefined,
    trackInventory: true,
    stockStatus: 'in-stock',
    quantity: 0,
    lowStockThreshold: undefined as number | undefined,
    allowBackorder: false,
    allowPreorder: false,
    locations: [] as Array<{ id: string; name: string; quantity: number }>,

    // Variants
    hasVariants: false,
    options: [] as Array<{ name: string; values: string[] }>,
    variants: [] as any[],

    // Shipping
    requiresShipping: true,
    weight: undefined as number | undefined,
    weightUnit: 'kg',
    dimensions: undefined as { length: number; width: number; height: number } | undefined,
    dimensionsUnit: 'cm',
    hsCode: undefined as string | undefined,
    countryOfOrigin: undefined as string | undefined,

    // SEO
    metaTitle: undefined as string | undefined,
    metaDescription: undefined as string | undefined,
    metaKeywords: [] as string[],
    ogTitle: undefined as string | undefined,
    ogDescription: undefined as string | undefined,
    ogImage: undefined as string | undefined,

    // Media
    images: [] as MediaFile[],
  })

  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const handleChange = (field: string, value: any) => {
    setProductData({ ...productData, [field]: value })
  }

  const handleSave = async (publish = false) => {
    setIsSaving(true)

    try {
      // TODO: Save product via API
      const dataToSave = {
        ...productData,
        status: publish ? 'active' : productData.status,
      }

      console.log('Saving product:', dataToSave)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (isNew) {
        router.push('/dashboard/products')
      }
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicate = () => {
    // TODO: Duplicate product
    console.log('Duplicating product...')
  }

  const handleArchive = () => {
    // TODO: Archive product
    console.log('Archiving product...')
  }

  const handleDelete = () => {
    // TODO: Delete product
    if (confirm('Are you sure you want to delete this product?')) {
      router.push('/dashboard/products')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Products
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isNew ? 'New Product' : productData.name || 'Edit Product'}
              </h1>
              {!isNew && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={productData.status === 'active' ? 'default' : 'secondary'}>
                    {productData.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">ID: {id}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>

            {!isNew && (
              <>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  History
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleArchive}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <Button onClick={() => handleSave(false)} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            {productData.status !== 'active' && (
              <Button onClick={() => handleSave(true)} disabled={isSaving}>
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-7xl py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <BasicInfo
                    data={productData}
                    onChange={handleChange}
                  />
                  <Pricing
                    data={productData}
                    onChange={handleChange}
                  />
                  <Variants
                    data={productData}
                    onChange={handleChange}
                    basePrice={productData.price}
                    baseSku={productData.sku}
                  />
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                  <Inventory
                    data={productData}
                    onChange={handleChange}
                  />
                </TabsContent>

                <TabsContent value="shipping" className="space-y-4">
                  <Shipping
                    data={productData}
                    onChange={handleChange}
                    productType={productData.productType}
                  />
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <SEO
                    data={productData}
                    onChange={handleChange}
                    productName={productData.name}
                    slug={productData.slug}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <MediaUploader
                images={productData.images}
                onChange={(images) => handleChange('images', images)}
              />

              {/* Collections */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Product Organization</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select className="w-full mt-1 p-2 border rounded-md">
                      <option>Select category</option>
                      <option>Electronics</option>
                      <option>Clothing</option>
                      <option>Home & Garden</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tags</label>
                    <input
                      type="text"
                      placeholder="Add tags..."
                      className="w-full mt-1 p-2 border rounded-md"
                    />
                  </div>
                </div>
              </Card>

              {/* Related Products */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Related Products</h3>
                <Button variant="outline" size="sm" className="w-full">
                  Add Related Products
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
