/**
 * Store Homepage
 * Homepage con featured products e categorie
 */
import { ProductCard } from '@/components/storefront/product/product-card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Mock data
const featuredProducts = [
  {
    id: '1',
    slug: 'wireless-headphones',
    name: 'Wireless Headphones',
    description: 'Premium sound quality with active noise cancellation',
    price: 89.99,
    comparePrice: 129.99,
    image: '/products/headphones.jpg',
    inStock: true,
    featured: true,
  },
  {
    id: '2',
    slug: 'smart-watch',
    name: 'Smart Watch Pro',
    description: 'Track your fitness and stay connected',
    price: 199.99,
    image: '/products/watch.jpg',
    inStock: true,
    featured: true,
  },
  {
    id: '3',
    slug: 'laptop-stand',
    name: 'Aluminum Laptop Stand',
    description: 'Ergonomic design for better posture',
    price: 49.99,
    comparePrice: 69.99,
    image: '/products/stand.jpg',
    inStock: true,
    featured: true,
  },
  {
    id: '4',
    slug: 'wireless-mouse',
    name: 'Wireless Mouse',
    description: 'Precision tracking with long battery life',
    price: 29.99,
    image: '/products/mouse.jpg',
    inStock: true,
    featured: true,
  },
]

const categories = [
  { name: 'Electronics', slug: 'electronics', image: '/categories/electronics.jpg' },
  { name: 'Fashion', slug: 'fashion', image: '/categories/fashion.jpg' },
  { name: 'Home & Living', slug: 'home-living', image: '/categories/home.jpg' },
  { name: 'Sports', slug: 'sports', image: '/categories/sports.jpg' },
]

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params

  return (
    <div className="flex flex-col gap-12 py-8">
      {/* Hero Section */}
      <section className="relative h-[500px] bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">Welcome to Our Store</h1>
            <p className="text-xl mb-8 opacity-90">
              Discover amazing products at great prices. Shop now and enjoy free shipping on orders over €50.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href={`/${storeSlug}/products`}>
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Shop by Category</h2>
          <Button variant="ghost" asChild>
            <Link href={`/${storeSlug}/categories`}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/${storeSlug}/categories/${category.slug}`}
              className="group relative aspect-square rounded-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute inset-0 flex items-end p-6 z-20">
                <h3 className="text-white font-semibold text-xl">{category.name}</h3>
              </div>
              <div className="absolute inset-0 bg-muted transition-transform group-hover:scale-105" />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Button variant="ghost" asChild>
            <Link href={`/${storeSlug}/products`}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-accent">
        <div className="container py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Special Offer</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get 20% off on your first order. Use code: WELCOME20
          </p>
          <Button size="lg" asChild>
            <Link href={`/${storeSlug}/products`}>Start Shopping</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
