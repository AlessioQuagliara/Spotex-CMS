/**
 * Store Layout
 * Layout dinamico per ogni store con providers
 */
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StoreProvider } from '@/lib/store-context'
import { CartProvider } from '@/lib/cart-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { StoreHeader } from '@/components/storefront/layout/store-header'
import { StoreFooter } from '@/components/storefront/layout/store-footer'
import { CartSidebar } from '@/components/storefront/cart/cart-sidebar'

// Mock function - sostituire con chiamata API reale
async function getStoreBySlug(slug: string) {
  // TODO: Fetch from API
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores/${slug}`)
  // if (!response.ok) return null
  // return response.json()

  // Mock data
  if (slug === 'demo-store') {
    return {
      id: '1',
      slug: 'demo-store',
      name: 'Demo Store',
      description: 'Your premium online store',
      logo: '/logo.png',
      favicon: '/favicon.ico',
      currency: 'EUR',
      locale: 'it-IT',
      theme: {
        primaryColor: '#000000',
        secondaryColor: '#666666',
        fontFamily: 'Inter, sans-serif',
      },
      contact: {
        email: 'info@demostore.com',
        phone: '+39 02 1234567',
        address: 'Via Roma 123, 20121 Milano, Italy',
      },
      social: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com',
      },
    }
  }

  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await getStoreBySlug(storeSlug)

  if (!store) {
    return {
      title: 'Store Not Found',
    }
  }

  return {
    title: {
      default: store.name,
      template: `%s | ${store.name}`,
    },
    description: store.description,
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const store = await getStoreBySlug(storeSlug)

  if (!store) {
    notFound()
  }

  return (
    <StoreProvider initialStore={store}>
      <CartProvider storeSlug={storeSlug}>
        <WishlistProvider storeSlug={storeSlug}>
          <div className="flex min-h-screen flex-col">
            <StoreHeader />
            <main className="flex-1">{children}</main>
            <StoreFooter />
            <CartSidebar />
          </div>
        </WishlistProvider>
      </CartProvider>
    </StoreProvider>
  )
}
