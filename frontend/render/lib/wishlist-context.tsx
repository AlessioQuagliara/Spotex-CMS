/**
 * Wishlist Context
 * Gestisce la wishlist con persistenza localStorage
 */
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface WishlistItem {
  id: string
  productId: string
  name: string
  slug: string
  image?: string
  price: number
  addedAt: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const WISHLIST_STORAGE_KEY = 'spotex-wishlist'

export function WishlistProvider({ children, storeSlug }: { children: ReactNode; storeSlug: string }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`${WISHLIST_STORAGE_KEY}-${storeSlug}`)
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse wishlist from localStorage', e)
      }
    }
    setIsHydrated(true)
  }, [storeSlug])

  // Save wishlist to localStorage when it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(`${WISHLIST_STORAGE_KEY}-${storeSlug}`, JSON.stringify(items))
    }
  }, [items, storeSlug, isHydrated])

  const addItem = (item: Omit<WishlistItem, 'addedAt'>) => {
    setItems((prevItems) => {
      // Check if item already exists
      const exists = prevItems.some((i) => i.productId === item.productId)
      if (exists) return prevItems

      return [...prevItems, { ...item, addedAt: new Date().toISOString() }]
    })
  }

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId))
  }

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.productId === productId)
  }

  const clearWishlist = () => {
    setItems([])
    localStorage.removeItem(`${WISHLIST_STORAGE_KEY}-${storeSlug}`)
  }

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
