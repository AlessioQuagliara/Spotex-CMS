/**
 * Hero Section Component
 * Banner principale con immagine e CTA
 */

'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

interface HeroSectionProps {
  settings: {
    heading?: string
    subheading?: string
    background_image?: string
    height?: 'small' | 'medium' | 'large' | 'full'
    text_alignment?: 'left' | 'center' | 'right'
    button_text?: string
    button_link?: string
    overlay_color?: string
    overlay_opacity?: number
  }
  storeSlug: string
}

export default function HeroSection({ settings, storeSlug }: HeroSectionProps) {
  const {
    heading = 'Welcome to our store',
    subheading = 'Discover our amazing products',
    background_image,
    height = 'medium',
    text_alignment = 'center',
    button_text = 'Shop Now',
    button_link = '/products',
    overlay_color = '#000000',
    overlay_opacity = 0.3,
  } = settings

  const heightClasses = {
    small: 'h-64 md:h-80',
    medium: 'h-96 md:h-[32rem]',
    large: 'h-[32rem] md:h-[40rem]',
    full: 'h-screen',
  }

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }

  return (
    <section className={`relative ${heightClasses[height]} overflow-hidden`}>
      {/* Background Image */}
      {background_image && (
        <Image
          src={background_image}
          alt={heading}
          fill
          className="object-cover"
          priority
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlay_color,
          opacity: overlay_opacity,
        }}
      />

      {/* Content */}
      <div className="relative h-full container mx-auto px-4">
        <div className={`h-full flex flex-col justify-center ${alignmentClasses[text_alignment]}`}>
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              {heading}
            </h1>
            {subheading && (
              <p className="text-lg md:text-xl text-white/90">
                {subheading}
              </p>
            )}
            {button_text && button_link && (
              <div>
                <Button size="lg" asChild>
                  <Link href={`/${storeSlug}${button_link}`}>
                    {button_text}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
