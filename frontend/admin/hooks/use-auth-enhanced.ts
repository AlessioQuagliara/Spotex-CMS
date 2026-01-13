/**
 * Enhanced Auth Hook for Admin Dashboard
 * Provides authentication state and functions
 * Re-exports from auth-provider for convenience
 */
export { useAuth } from '@/components/auth/auth-provider'

// Additional auth-related hooks
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth as useAuthContext } from '@/components/auth/auth-provider'

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}

/**
 * Hook to require specific role(s)
 * Redirects to unauthorized page if user doesn't have required role
 */
export function useRequireRole(roles: string | string[]) {
  const { user, hasRole, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !hasRole(roles)) {
      router.push('/unauthorized')
    }
  }, [user, hasRole, roles, isLoading, router])

  return { user, hasRole: hasRole(roles), isLoading }
}

/**
 * Hook to check permissions
 */
export function usePermission(permission: string) {
  const { hasPermission } = useAuthContext()
  return hasPermission(permission)
}
