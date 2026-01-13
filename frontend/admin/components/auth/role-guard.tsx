/**
 * Role Guard Component
 * Protects content based on user roles and permissions
 */
'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { UserRole } from '@/lib/types'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  requiredPermissions?: string[]
  fallback?: ReactNode
  requireAll?: boolean // Se true, richiede tutti i permessi; altrimenti almeno uno
  redirectTo?: string
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredPermissions,
  fallback,
  requireAll = false,
  redirectTo = '/unauthorized',
}: RoleGuardProps) {
  const { user, isAuthenticated, isLoading, hasRole, hasPermission } = useAuth()
  const router = useRouter()

  const hasRequiredRole = !allowedRoles || allowedRoles.some((role) => hasRole(role))

  const hasRequiredPermissions = !requiredPermissions || (
    requireAll
      ? requiredPermissions.every((perm) => hasPermission(perm))
      : requiredPermissions.some((perm) => hasPermission(perm))
  )

  const canAccess = hasRequiredRole && hasRequiredPermissions

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccess) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, canAccess, router, redirectTo])

  if (isLoading) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Verifying permissions...</p>
          </div>
        </div>
      )
    )
  }

  if (!isAuthenticated || !canAccess) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              You don&apos;t have permission to access this resource.
            </p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}

/**
 * Higher-order component version
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RoleGuardProps, 'children'>
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard {...options}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}
