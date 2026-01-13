/**
 * Main Navigation Component
 * Navigazione principale dashboard
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const routes = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/customers', label: 'Customers' },
  { href: '/dashboard/marketing', label: 'Marketing' },
  { href: '/dashboard/settings', label: 'Settings' },
]

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)}>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === route.href || pathname.startsWith(route.href + '/')
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
}
