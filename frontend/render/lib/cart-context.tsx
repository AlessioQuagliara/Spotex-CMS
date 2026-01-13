/**
 * Cart Context
 * Gestisce lo stato del carrello con persistenza localStorage
 */
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface CartItem {
  id: string
  productId: string
  name: string
  slug: string
  image?: string
  price: number
  quantity: number
  variantId?: string
  variantName?: string
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'spotex-cart'

export function CartProvider({ children, storeSlug }: { children: ReactNode; storeSlug: string }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`${CART_STORAGE_KEY}-${storeSlug}`)
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e)
      }
    }
    setIsHydrated(true)
  }, [storeSlug])

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(`${CART_STORAGE_KEY}-${storeSlug}`, JSON.stringify(items))
    }
  }, [items, storeSlug, isHydrated])

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prevItems) => {
      // Check if item already exists
      const existingIndex = prevItems.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      )

      if (existingIndex > -1) {
        // Update quantity if item exists
        const newItems = [...prevItems]
        newItems[existingIndex].quantity += item.quantity || 1
        return newItems
      } else {
        // Add new item
        return [...prevItems, { ...item, quantity: item.quantity || 1 }]
      }
    })
    setIsOpen(true)
  }

  const removeItem = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem(`${CART_STORAGE_KEY}-${storeSlug}`)
  }

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
