'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  FileText,
  Folder,
  Image,
  Users,
  Settings,
  LogOut,
  Globe,
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Post',
    href: '/dashboard/posts',
    icon: FileText,
  },
  {
    title: 'Categorie',
    href: '/dashboard/categories',
    icon: Folder,
  },
  {
    title: 'Media',
    href: '/dashboard/media',
    icon: Image,
  },
  {
    title: 'Pagine',
    href: '/dashboard/pages',
    icon: Globe,
  },
  {
    title: 'Utenti',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    title: 'Impostazioni',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-6 w-6" />
            <span className="">CMS Admin</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    pathname === item.href && "bg-muted text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{user?.username}</div>
              <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}