/**
 * Products Catalog Page
 * Griglia prodotti con filtri e sorting
 */
import { ProductCard } from '@/components/storefront/product/product-card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'

// Mock data
const products = [
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
  },
  {
    id: '4',
    slug: 'wireless-mouse',
    name: 'Wireless Mouse',
    description: 'Precision tracking with long battery life',
    price: 29.99,
    image: '/products/mouse.jpg',
    inStock: true,
  },
  {
    id: '5',
    slug: 'mechanical-keyboard',
    name: 'Mechanical Keyboard',
    description: 'RGB backlit with tactile switches',
    price: 129.99,
    image: '/products/keyboard.jpg',
    inStock: false,
  },
  {
    id: '6',
    slug: 'usb-c-hub',
    name: 'USB-C Hub',
    description: '7-in-1 adapter for laptops',
    price: 39.99,
    image: '/products/hub.jpg',
    inStock: true,
  },
]

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { storeSlug } = await params
  const search = await searchParams

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">All Products</h1>
        <p className="text-muted-foreground">
          Discover our complete collection of products
        </p>
      </div>

      {/* Filters & Sorting */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>

        <Select defaultValue="featured">
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
            <SelectItem value="name-desc">Name: Z to A</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="text-sm text-muted-foreground flex items-center">
          Showing {products.length} products
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-12">
        <Button variant="outline" disabled>
          Previous
        </Button>
        <Button variant="outline">1</Button>
        <Button variant="outline">2</Button>
        <Button variant="outline">3</Button>
        <Button variant="outline">Next</Button>
      </div>
    </div>
  )
}
