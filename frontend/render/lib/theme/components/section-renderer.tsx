/**
 * Section Renderer
 * Renderer dinamico per le sezioni del tema
 */

'use client'

import dynamic from 'next/dynamic'
import { ThemeSection } from '../types'

interface SectionRendererProps {
  section: ThemeSection
  settings: Record<string, any>
  storeSlug: string
}

// Dynamic imports for section components
const sectionComponents: Record<string, any> = {
  hero: dynamic(() => import('./hero-section')),
  'featured-products': dynamic(() => import('./featured-products-section')),
  // 'image-with-text': dynamic(() => import('./image-with-text-section')),
  // 'collection-list': dynamic(() => import('./collection-list-section')),
  // testimonials: dynamic(() => import('./testimonials-section')),
  newsletter: dynamic(() => import('./newsletter-section')),
}

export function SectionRenderer({ section, settings, storeSlug }: SectionRendererProps) {
  const Component = sectionComponents[section.id]

  if (!Component) {
    console.warn(`Section component not found: ${section.id}`)
    return null
  }

  return <Component settings={settings} storeSlug={storeSlug} />
}
