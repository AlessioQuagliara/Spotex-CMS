/**
 * Product Page with SEO optimization
 * Example showing Product structured data and OG tags
 */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateMetadata as genMeta } from '@/lib/seo';
import { generateProductStructuredData } from '@/lib/structured-data';
import { StructuredDataComponent } from '@/components/seo/structured-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart, Heart } from 'lucide-react';

// Mock data
async function getProduct(slug: string) {
  return {
    id: 1,
    name: 'MacBook Pro 14" M3',
    slug: 'macbook-pro-14-m3',
    description: 'Il notebook professionale più potente con chip M3 Apple Silicon',
    image: '/images/macbook-pro.jpg',
    price: 2299,
    currency: 'EUR',
    availability: 'InStock' as const,
    sku: 'MBP14-M3-512',
    brand: 'Apple',
    rating: 4.8,
    reviewCount: 234,
    features: [
      'Chip Apple M3 con CPU 8-core',
      'GPU 10-core',
      '16GB RAM unificata',
      '512GB SSD',
      'Display Liquid Retina XDR 14.2"',
    ],
  };
}

// Generate metadata
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return { title: 'Prodotto non trovato' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  return genMeta({
    title: product.name,
    description: product.description,
    canonical: `/products/${product.slug}`,
    image: product.image,
    ogType: 'product',
  });
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  // Generate Product structured data
  const productStructuredData = generateProductStructuredData({
    name: product.name,
    description: product.description,
    image: `${baseUrl}${product.image}`,
    price: product.price,
    currency: product.currency,
    availability: product.availability,
    sku: product.sku,
    brand: product.brand,
    ratingValue: product.rating,
    reviewCount: product.reviewCount,
    url: `${baseUrl}/products/${product.slug}`,
  });

  return (
    <>
      <StructuredDataComponent data={productStructuredData} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <img
              src={product.image}
              alt={product.name}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge>{product.brand}</Badge>
              <h1 className="text-4xl font-bold mt-2">{product.name}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount} recensioni)
              </span>
            </div>

            <p className="text-lg text-muted-foreground">{product.description}</p>

            {/* Features */}
            <div>
              <h3 className="font-semibold mb-2">Caratteristiche principali:</h3>
              <ul className="space-y-2">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Price */}
            <div className="border-t pt-6">
              <div className="text-3xl font-bold">
                €{product.price.toLocaleString('it-IT')}
              </div>
              <Badge variant="secondary" className="mt-2">
                {product.availability === 'InStock' ? 'Disponibile' : 'Non disponibile'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Aggiungi al carrello
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* SKU */}
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
      </div>
    </>
  );
}
