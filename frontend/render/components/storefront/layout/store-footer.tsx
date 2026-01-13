/**
 * Store Footer Component
 * Footer con informazioni store e link utili
 */
'use client'

import { useStore } from '@/lib/store-context'
import Link from 'next/link'
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react'

export function StoreFooter() {
  const { store } = useStore()

  if (!store) return null

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{store.name}</h3>
            <p className="text-sm text-muted-foreground">{store.description}</p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${store.slug}/products`} className="text-muted-foreground hover:text-foreground">
                  All Products
                </Link>
              </li>
              <li>
                <Link href={`/${store.slug}/categories`} className="text-muted-foreground hover:text-foreground">
                  Categories
                </Link>
              </li>
              <li>
                <Link href={`/${store.slug}/deals`} className="text-muted-foreground hover:text-foreground">
                  Special Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Information</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${store.slug}/about`} className="text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={`/${store.slug}/contact`} className="text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link href={`/${store.slug}/shipping`} className="text-muted-foreground hover:text-foreground">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href={`/${store.slug}/returns`} className="text-muted-foreground hover:text-foreground">
                  Returns
                </Link>
              </li>
              <li>
                <Link href={`/${store.slug}/privacy`} className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              {store.contact.email && (
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <a href={`mailto:${store.contact.email}`} className="text-muted-foreground hover:text-foreground">
                    {store.contact.email}
                  </a>
                </li>
              )}
              {store.contact.phone && (
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <a href={`tel:${store.contact.phone}`} className="text-muted-foreground hover:text-foreground">
                    {store.contact.phone}
                  </a>
                </li>
              )}
              {store.contact.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{store.contact.address}</span>
                </li>
              )}
            </ul>

            {/* Social */}
            {store.social && (
              <div className="flex gap-2 mt-4">
                {store.social.facebook && (
                  <a
                    href={store.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-background hover:bg-accent"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {store.social.instagram && (
                  <a
                    href={store.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-background hover:bg-accent"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {store.social.twitter && (
                  <a
                    href={store.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-background hover:bg-accent"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
