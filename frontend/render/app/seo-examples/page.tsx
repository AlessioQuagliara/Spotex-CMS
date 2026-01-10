/**
 * SEO Component Examples
 * Demonstration of various structured data types
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StructuredDataComponent } from '@/components/seo/structured-data';
import {
  generateProductStructuredData,
  generateEventStructuredData,
  generateRecipeStructuredData,
  generateVideoStructuredData,
  generateReviewStructuredData,
  generateLocalBusinessStructuredData,
} from '@/lib/structured-data';

export default function SEOExamplesPage() {
  // Example Product
  const productData = generateProductStructuredData({
    name: 'iPhone 15 Pro',
    description: 'Lo smartphone più avanzato con chip A17 Pro',
    image: '/images/iphone-15-pro.jpg',
    price: 1299,
    currency: 'EUR',
    availability: 'InStock',
    sku: 'IPH15P-256-TIT',
    brand: 'Apple',
    ratingValue: 4.9,
    reviewCount: 567,
    url: '/products/iphone-15-pro',
  });

  // Example Event
  const eventData = generateEventStructuredData({
    name: 'Web Summit 2026',
    description: 'La più grande conferenza tech europea',
    startDate: '2026-11-01T09:00:00+00:00',
    endDate: '2026-11-04T18:00:00+00:00',
    location: 'Altice Arena',
    locationAddress: 'Rossio dos Olivais, Lisbona, Portogallo',
    image: '/images/web-summit.jpg',
    organizerName: 'Web Summit',
    price: 599,
    currency: 'EUR',
  });

  // Example Recipe
  const recipeData = generateRecipeStructuredData({
    name: 'Carbonara Classica',
    description: 'La ricetta tradizionale romana della carbonara',
    image: '/images/carbonara.jpg',
    authorName: 'Chef Mario',
    datePublished: '2026-01-10',
    prepTime: 'PT10M',
    cookTime: 'PT15M',
    totalTime: 'PT25M',
    recipeYield: '4 porzioni',
    ingredients: [
      '400g spaghetti',
      '200g guanciale',
      '4 tuorli',
      '100g pecorino romano',
      'Pepe nero',
    ],
    instructions: [
      'Cuocere la pasta in abbondante acqua salata',
      'Rosolare il guanciale fino a doratura',
      'Mescolare tuorli e pecorino',
      'Mantecare pasta con uova e guanciale',
      'Servire con pepe nero macinato',
    ],
    recipeCategory: 'Primi piatti',
    recipeCuisine: 'Italiana',
    ratingValue: 4.8,
    reviewCount: 123,
  });

  // Example Video
  const videoData = generateVideoStructuredData({
    name: 'Tutorial Next.js 15',
    description: 'Guida completa alle nuove funzionalità',
    thumbnailUrl: '/images/nextjs-tutorial-thumb.jpg',
    uploadDate: '2026-01-10T10:00:00Z',
    duration: 'PT1H30M',
    contentUrl: 'https://example.com/videos/nextjs-tutorial.mp4',
    embedUrl: 'https://example.com/embed/nextjs-tutorial',
    viewCount: 12500,
  });

  // Example Review
  const reviewData = generateReviewStructuredData({
    itemReviewedName: 'MacBook Pro M3',
    itemReviewedType: 'Product',
    ratingValue: 5,
    authorName: 'Luca Bianchi',
    datePublished: '2026-01-08',
    reviewBody:
      'Prestazioni eccezionali, batteria che dura tutto il giorno. Display spettacolare.',
  });

  // Example Local Business
  const businessData = generateLocalBusinessStructuredData({
    name: 'Ristorante Da Mario',
    address: 'Via Roma 123, Milano',
    telephone: '+39 02 1234567',
    priceRange: '$$',
    ratingValue: 4.7,
    reviewCount: 89,
    image: '/images/restaurant.jpg',
    url: 'https://example.com/ristorante-mario',
    openingHours: ['Mo-Fr 12:00-15:00', 'Mo-Fr 19:00-23:00', 'Sa-Su 12:00-23:00'],
  });

  return (
    <>
      {/* Include all structured data */}
      <StructuredDataComponent
        data={[productData, eventData, recipeData, videoData, reviewData, businessData]}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Esempi Structured Data (JSON-LD)</h1>

        <div className="grid gap-6">
          {/* Product Schema */}
          <Card>
            <CardHeader>
              <CardTitle>Product Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(productData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Event Schema */}
          <Card>
            <CardHeader>
              <CardTitle>Event Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(eventData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Recipe Schema */}
          <Card>
            <CardHeader>
              <CardTitle>Recipe Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(recipeData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Video Schema */}
          <Card>
            <CardHeader>
              <CardTitle>VideoObject Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(videoData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Review Schema */}
          <Card>
            <CardHeader>
              <CardTitle>Review Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(reviewData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* LocalBusiness Schema */}
          <Card>
            <CardHeader>
              <CardTitle>LocalBusiness Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(businessData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
