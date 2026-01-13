/**
 * Settings Page
 * Impostazioni negozio e configurazioni
 */
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Globe, Package, Receipt, Settings as SettingsIcon, Zap } from 'lucide-react'
import Link from 'next/link'

const settingSections = [
  {
    title: 'Store Settings',
    description: 'Manage your store information and preferences',
    icon: Globe,
    href: '/dashboard/settings/store',
  },
  {
    title: 'Payment Gateways',
    description: 'Configure payment methods and providers',
    icon: CreditCard,
    href: '/dashboard/settings/payment',
  },
  {
    title: 'Shipping & Delivery',
    description: 'Set up shipping zones, rates, and carriers',
    icon: Package,
    href: '/dashboard/settings/shipping',
  },
  {
    title: 'Taxes',
    description: 'Configure tax rates and rules',
    icon: Receipt,
    href: '/dashboard/settings/taxes',
  },
  {
    title: 'Integrations',
    description: 'Connect third-party services and APIs',
    icon: Zap,
    href: '/dashboard/settings/integrations',
  },
  {
    title: 'General Settings',
    description: 'General application settings',
    icon: SettingsIcon,
    href: '/dashboard/settings/general',
  },
]

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your store settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="mt-4">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
