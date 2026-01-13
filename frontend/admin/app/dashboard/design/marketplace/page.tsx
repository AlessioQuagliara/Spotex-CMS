/**
 * Theme Marketplace Component
 * (Opzionale) Browse e installa temi pre-built
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Download, Eye, Star } from 'lucide-react'
import Image from 'next/image'

interface Theme {
  id: string
  name: string
  description: string
  author: string
  version: string
  price: number
  rating: number
  downloads: number
  preview: string
  category: string
  featured: boolean
}

export default function ThemeMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Mock themes
  const themes: Theme[] = [
    {
      id: '1',
      name: 'Modern Minimal',
      description: 'Clean and minimal design for modern brands',
      author: 'Spotex Team',
      version: '1.0.0',
      price: 0,
      rating: 4.8,
      downloads: 1250,
      preview: 'https://picsum.photos/seed/theme1/400/300',
      category: 'minimal',
      featured: true,
    },
    {
      id: '2',
      name: 'Fashion Pro',
      description: 'Perfect for fashion and lifestyle stores',
      author: 'ThemeCreators',
      version: '2.1.0',
      price: 49,
      rating: 4.9,
      downloads: 850,
      preview: 'https://picsum.photos/seed/theme2/400/300',
      category: 'fashion',
      featured: true,
    },
    {
      id: '3',
      name: 'Tech Store',
      description: 'Modern theme for electronics and gadgets',
      author: 'DigitalThemes',
      version: '1.5.0',
      price: 39,
      rating: 4.7,
      downloads: 620,
      preview: 'https://picsum.photos/seed/theme3/400/300',
      category: 'technology',
      featured: false,
    },
    {
      id: '4',
      name: 'Organic Green',
      description: 'Natural theme for organic and eco products',
      author: 'EcoDesigns',
      version: '1.2.0',
      price: 29,
      rating: 4.6,
      downloads: 430,
      preview: 'https://picsum.photos/seed/theme4/400/300',
      category: 'organic',
      featured: false,
    },
  ]

  const categories = [
    { value: 'all', label: 'All Themes' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'technology', label: 'Technology' },
    { value: 'organic', label: 'Organic' },
  ]

  const filteredThemes = themes.filter((theme) => {
    const matchesSearch =
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || theme.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Theme Marketplace</h1>
        <p className="text-muted-foreground">
          Browse and install professional themes for your store
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Featured Themes */}
      {selectedCategory === 'all' && themes.some((t) => t.featured) && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Themes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {themes
              .filter((t) => t.featured)
              .map((theme) => (
                <Card key={theme.id} className="overflow-hidden">
                  <div className="relative h-48 bg-muted">
                    <Image
                      src={theme.preview}
                      alt={theme.name}
                      fill
                      className="object-cover"
                    />
                    {theme.price === 0 && (
                      <Badge className="absolute top-2 right-2">Free</Badge>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{theme.name}</CardTitle>
                        <CardDescription>{theme.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {theme.price === 0 ? 'Free' : `€${theme.price}`}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{theme.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{theme.downloads}</span>
                      </div>
                      <div>by {theme.author}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Install
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* All Themes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {selectedCategory === 'all' ? 'All Themes' : categories.find(c => c.value === selectedCategory)?.label}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThemes.map((theme) => (
            <Card key={theme.id} className="overflow-hidden">
              <div className="relative h-40 bg-muted">
                <Image
                  src={theme.preview}
                  alt={theme.name}
                  fill
                  className="object-cover"
                />
                {theme.price === 0 && (
                  <Badge className="absolute top-2 right-2">Free</Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{theme.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {theme.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{theme.rating}</span>
                  </div>
                  <span className="font-semibold">
                    {theme.price === 0 ? 'Free' : `€${theme.price}`}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Preview
                </Button>
                <Button size="sm" className="flex-1">
                  Install
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredThemes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No themes found</p>
          </div>
        )}
      </div>
    </div>
  )
}
