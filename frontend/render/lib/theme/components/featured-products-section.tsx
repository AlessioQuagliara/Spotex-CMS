/**
 * Featured Products Section Component
 */

'use client'

import { ProductCard } from '@/components/storefront/product/product-card'

interface FeaturedProductsSectionProps {
  settings: {
    heading?: string
    products_per_row?: number
    rows?: number
    show_quick_view?: boolean
    show_vendor?: boolean
  }
  storeSlug: string
}

export default function FeaturedProductsSection({
  settings,
  storeSlug,
}: FeaturedProductsSectionProps) {
  const {
    heading = 'Featured Products',
    products_per_row = 4,
    rows = 1,
  } = settings

  // Mock products - TODO: Load from API
  const products = Array.from({ length: products_per_row * rows }, (_, i) => ({
    id: `product-${i + 1}`,
    name: `Product ${i + 1}`,
    slug: `product-${i + 1}`,
    price: 29.99 + i * 10,
    compareAtPrice: i % 2 === 0 ? 39.99 + i * 10 : undefined,
    image: `https://picsum.photos/seed/${i}/400/400`,
    featured: i < 2,
    inStock: i % 3 !== 0,
  }))

  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6',
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {heading && (
          <h2 className="text-3xl font-bold text-center mb-8">{heading}</h2>
        )}

        <div className={`grid ${gridClasses[products_per_row as keyof typeof gridClasses]} gap-6`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
