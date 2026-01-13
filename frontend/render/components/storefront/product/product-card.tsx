/**
 * Product Card Component
 * Card per visualizzare prodotto in griglia
 */
'use client'

import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'
import { useStore } from '@/lib/store-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface ProductCardProps {
  product: {
    id: string
    slug: string
    name: string
    description?: string
    price: number
    comparePrice?: number
    image?: string
    images?: string[]
    inStock: boolean
    featured?: boolean
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { store } = useStore()
  const { addItem } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
  const [imageError, setImageError] = useState(false)

  if (!store) return null

  const isWishlisted = isInWishlist(product.id)
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: `${product.id}-default`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
    })
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isWishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist({
        id: product.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        price: product.price,
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(store.locale, {
      style: 'currency',
      currency: store.currency,
    }).format(price)
  }

  return (
    <Link href={`/${store.slug}/products/${product.slug}`} className="group">
      <div className="overflow-hidden rounded-lg border bg-background transition-all hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.image && !imageError ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.featured && <Badge>Featured</Badge>}
            {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
            {!product.inStock && <Badge variant="secondary">Out of Stock</Badge>}
          </div>

          {/* Wishlist */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full bg-background/80 hover:bg-background"
            onClick={handleToggleWishlist}
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold line-clamp-2 mb-2">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                {product.comparePrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
