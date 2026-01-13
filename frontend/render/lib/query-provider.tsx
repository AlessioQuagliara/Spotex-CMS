/**
 * React Query Configuration for Render/Storefront
 * Public API with optimized caching for storefront
 */
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

// Query client configuration for public storefront
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Longer stale time for public data (10 minutes)
      staleTime: 10 * 60 * 1000,
      // Longer cache time for public data (30 minutes)
      gcTime: 30 * 60 * 1000,
      // Retry failed requests
      retry: 2,
      // Don't refetch on window focus for storefront (less aggressive)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Prefetch pages in the background
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
}

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  )
}

// Export for testing
export { queryClientConfig }
