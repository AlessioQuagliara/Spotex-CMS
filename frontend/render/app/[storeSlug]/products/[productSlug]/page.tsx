/**
 * Product Detail Page
 * Dettaglio prodotto con galleria, varianti, reviews
 */
'use client'

import { use, useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'
import { useStore } from '@/lib/store-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Minus, Plus, ShoppingCart, Star, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Mock data
const productData = {
  id: '1',
  slug: 'wireless-headphones',
  name: 'Wireless Headphones Premium',
  description: 'Experience superior sound quality with our premium wireless headphones featuring active noise cancellation, 30-hour battery life, and ultra-comfortable design.',
  price: 89.99,
  comparePrice: 129.99,
  images: [
    '/products/headphones-1.jpg',
    '/products/headphones-2.jpg',
    '/products/headphones-3.jpg',
  ],
  inStock: true,
  sku: 'WH-PREM-001',
  category: 'Electronics',
  variants: [
    { id: 'v1', name: 'Black', price: 89.99, inStock: true },
    { id: 'v2', name: 'White', price: 89.99, inStock: true },
    { id: 'v3', name: 'Blue', price: 94.99, inStock: false },
  ],
  features: [
    'Active Noise Cancellation',
    '30-hour battery life',
    'Premium sound quality',
    'Comfortable over-ear design',
    'Bluetooth 5.0',
    'Built-in microphone',
  ],
  reviews: [
    {
      id: '1',
      author: 'Mario R.',
      rating: 5,
      date: '2024-01-10',
      comment: 'Excellent sound quality and very comfortable!',
    },
    {
      id: '2',
      author: 'Laura B.',
      rating: 4,
      date: '2024-01-08',
      comment: 'Great headphones, battery lasts forever.',
    },
  ],
  averageRating: 4.5,
  reviewCount: 128,
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productSlug: string }>
}) {
  const { storeSlug } = use(params)
  const { store } = useStore()
  const { addItem } = useCart()
  const { addItem: addToWishlist, isInWishlist } = useWishlist()

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(productData.variants[0])
  const [quantity, setQuantity] = useState(1)

  if (!store) return null

  const isWishlisted = isInWishlist(productData.id)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(store.locale, {
      style: 'currency',
      currency: store.currency,
    }).format(price)
  }

  const handleAddToCart = () => {
    addItem({
      id: `${productData.id}-${selectedVariant.id}`,
      productId: productData.id,
      name: productData.name,
      slug: productData.slug,
      image: productData.images[0],
      price: selectedVariant.price,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      quantity,
    })
  }

  const discount = productData.comparePrice
    ? Math.round(((productData.comparePrice - productData.price) / productData.comparePrice) * 100)
    : 0

  return (
    <div className="container py-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 text-sm">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li>
            <Link href={`/${storeSlug}`} className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/${storeSlug}/products`} className="hover:text-foreground">
              Products
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground">{productData.name}</li>
        </ol>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            <div className="relative w-full h-full">
              <Image
                src={productData.images[selectedImage]}
                alt={productData.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-4">
            {productData.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                  selectedImage === index ? 'border-primary' : 'border-transparent'
                }`}
              >
                <div className="relative w-full h-full bg-muted">
                  <Image src={image} alt={`${productData.name} ${index + 1}`} fill className="object-cover" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{productData.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(productData.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {productData.averageRating} ({productData.reviewCount} reviews)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">{formatPrice(selectedVariant.price)}</span>
            {productData.comparePrice && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(productData.comparePrice)}
                </span>
                <Badge variant="destructive">Save {discount}%</Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground">{productData.description}</p>

          <Separator />

          {/* Variants */}
          <div>
            <label className="text-sm font-medium mb-3 block">Color</label>
            <div className="flex gap-2">
              {productData.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  disabled={!variant.inStock}
                  className={`px-4 py-2 border-2 rounded transition ${
                    selectedVariant.id === variant.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  } ${!variant.inStock && 'opacity-50 cursor-not-allowed'}`}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-medium mb-3 block">Quantity</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button variant="ghost" size="sm" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedVariant.inStock ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  Out of Stock
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={!selectedVariant.inStock}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                addToWishlist({
                  id: productData.id,
                  productId: productData.id,
                  name: productData.name,
                  slug: productData.slug,
                  image: productData.images[0],
                  price: productData.price,
                })
              }
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          {/* Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Free shipping on orders over €50</span>
            </div>
            <div className="text-muted-foreground">SKU: {productData.sku}</div>
            <div className="text-muted-foreground">Category: {productData.category}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mt-12">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({productData.reviewCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose max-w-none">
            <p>{productData.description}</p>
          </div>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <ul className="grid md:grid-cols-2 gap-3">
            {productData.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-6">
            {productData.reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium">{review.author}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.date).toLocaleDateString(store.locale)}
                  </span>
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
