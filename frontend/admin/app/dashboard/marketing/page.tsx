/**
 * Marketing Page
 * Gestione campagne e automazioni
 */
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Tag, Zap, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

const marketingSections = [
  {
    title: 'Email Campaigns',
    description: 'Create and manage email marketing campaigns',
    icon: Mail,
    href: '/dashboard/marketing/campaigns',
    count: 12,
  },
  {
    title: 'Coupons & Discounts',
    description: 'Manage promotional codes and discounts',
    icon: Tag,
    href: '/dashboard/marketing/coupons',
    count: 8,
  },
  {
    title: 'Automations',
    description: 'Set up automated marketing workflows',
    icon: Zap,
    href: '/dashboard/marketing/automations',
    count: 5,
  },
]

export default function MarketingPage() {
  const router = useRouter()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing</h2>
          <p className="text-muted-foreground">
            Manage your marketing campaigns and automations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {marketingSections.map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.href}
              className="hover:bg-accent transition-colors cursor-pointer"
              onClick={() => router.push(section.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-2xl font-bold">{section.count}</span>
                </div>
                <CardTitle className="mt-4">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>Your latest marketing activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: 'Summer Sale 2024',
                type: 'Email',
                sent: 2450,
                opened: 1832,
                clicked: 456,
              },
              {
                name: 'Welcome Series',
                type: 'Automation',
                sent: 834,
                opened: 723,
                clicked: 234,
              },
              {
                name: 'Flash Sale Alert',
                type: 'Email',
                sent: 5234,
                opened: 4123,
                clicked: 1234,
              },
            ].map((campaign, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">{campaign.type}</p>
                </div>
                <div className="flex gap-8 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sent</p>
                    <p className="font-medium">{campaign.sent}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Opened</p>
                    <p className="font-medium">{campaign.opened}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Clicked</p>
                    <p className="font-medium">{campaign.clicked}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
