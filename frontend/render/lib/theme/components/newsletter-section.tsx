/**
 * Newsletter Section Component
 */

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface NewsletterSectionProps {
  settings: {
    heading?: string
    subheading?: string
    button_text?: string
    background_color?: string
  }
  storeSlug: string
}

export default function NewsletterSection({ settings }: NewsletterSectionProps) {
  const {
    heading = 'Subscribe to our newsletter',
    subheading = 'Get the latest updates and offers',
    button_text = 'Subscribe',
    background_color = '#f9fafb',
  } = settings

  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      // TODO: Call API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessage('Thank you for subscribing!')
      setEmail('')
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: background_color }}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {heading && <h2 className="text-3xl font-bold mb-4">{heading}</h2>}
          {subheading && (
            <p className="text-muted-foreground mb-6">{subheading}</p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting}>
              {button_text}
            </Button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      </div>
    </section>
  )
}
