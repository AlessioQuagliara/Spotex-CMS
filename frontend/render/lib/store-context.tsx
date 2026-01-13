/**
 * Store Context
 * Gestisce lo stato del negozio corrente e configurazioni multi-tenant
 */
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface StoreConfig {
  id: string
  slug: string
  name: string
  description: string
  logo?: string
  favicon?: string
  currency: string
  locale: string
  theme: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
  }
  contact: {
    email: string
    phone?: string
    address?: string
  }
  social?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
}

interface StoreContextType {
  store: StoreConfig | null
  isLoading: boolean
  error: string | null
  setStore: (store: StoreConfig) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({
  children,
  initialStore,
}: {
  children: ReactNode
  initialStore?: StoreConfig
}) {
  const [store, setStoreState] = useState<StoreConfig | null>(initialStore || null)
  const [isLoading, setIsLoading] = useState(!initialStore)
  const [error, setError] = useState<string | null>(null)

  const setStore = (newStore: StoreConfig) => {
    setStoreState(newStore)
    setIsLoading(false)
    
    // Apply theme
    if (newStore.theme) {
      document.documentElement.style.setProperty('--primary-color', newStore.theme.primaryColor)
      document.documentElement.style.setProperty('--secondary-color', newStore.theme.secondaryColor)
      document.documentElement.style.setProperty('--font-family', newStore.theme.fontFamily)
    }
    
    // Set favicon
    if (newStore.favicon) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      if (link) {
        link.href = newStore.favicon
      }
    }
    
    // Set page title
    document.title = newStore.name
  }

  return (
    <StoreContext.Provider value={{ store, isLoading, error, setStore }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
