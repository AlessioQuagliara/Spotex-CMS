/**
 * Store Header Component
 * Header navigazione con carrello e ricerca
 */
'use client'

import { useStore } from '@/lib/store-context'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heart, Menu, Search, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export function StoreHeader() {
  const { store } = useStore()
  const { itemCount, openCart } = useCart()
  const [searchQuery, setSearchQuery] = useState('')

  if (!store) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href={`/${store.slug}`} className="mr-6 flex items-center space-x-2">
          {store.logo ? (
            <Image src={store.logo} alt={store.name} width={120} height={40} />
          ) : (
            <span className="text-xl font-bold">{store.name}</span>
          )}
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href={`/${store.slug}/products`} className="transition-colors hover:text-primary">
            Products
          </Link>
          <Link href={`/${store.slug}/categories`} className="transition-colors hover:text-primary">
            Categories
          </Link>
          <Link href={`/${store.slug}/about`} className="transition-colors hover:text-primary">
            About
          </Link>
          <Link href={`/${store.slug}/contact`} className="transition-colors hover:text-primary">
            Contact
          </Link>
        </nav>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (searchQuery.trim()) {
                window.location.href = `/${store.slug}/search?q=${encodeURIComponent(searchQuery)}`
              }
            }}
            className="relative w-full"
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-auto md:ml-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${store.slug}/account`}>
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${store.slug}/wishlist`}>
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
