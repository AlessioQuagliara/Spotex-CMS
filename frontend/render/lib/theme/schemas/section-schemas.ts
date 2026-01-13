/**
 * Section Schemas
 * Schema di configurazione per le sezioni del tema
 */

import { ThemeSection } from '../types'

export const heroSectionSchema: ThemeSection = {
  id: 'hero',
  name: 'Hero Section',
  description: 'Banner principale con immagine di sfondo e CTA',
  schema: {
    settings: [
      {
        type: 'text',
        id: 'heading',
        label: 'Heading',
        default: 'Welcome to our store',
      },
      {
        type: 'textarea',
        id: 'subheading',
        label: 'Subheading',
        default: 'Discover our amazing products',
      },
      {
        type: 'image',
        id: 'background_image',
        label: 'Background Image',
      },
      {
        type: 'select',
        id: 'height',
        label: 'Section Height',
        default: 'medium',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'Full Screen', value: 'full' },
        ],
      },
      {
        type: 'select',
        id: 'text_alignment',
        label: 'Text Alignment',
        default: 'center',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
      {
        type: 'text',
        id: 'button_text',
        label: 'Button Text',
        default: 'Shop Now',
      },
      {
        type: 'url',
        id: 'button_link',
        label: 'Button Link',
        default: '/products',
      },
      {
        type: 'color',
        id: 'overlay_color',
        label: 'Overlay Color',
        default: '#000000',
      },
      {
        type: 'range',
        id: 'overlay_opacity',
        label: 'Overlay Opacity',
        default: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  defaultSettings: {
    heading: 'Welcome to our store',
    subheading: 'Discover our amazing products',
    height: 'medium',
    text_alignment: 'center',
    button_text: 'Shop Now',
    button_link: '/products',
    overlay_color: '#000000',
    overlay_opacity: 0.3,
  },
  presets: [
    {
      name: 'Full Width Hero',
      settings: {
        height: 'full',
        text_alignment: 'center',
      },
    },
  ],
}

export const featuredProductsSchema: ThemeSection = {
  id: 'featured-products',
  name: 'Featured Products',
  description: 'Griglia di prodotti in evidenza',
  schema: {
    settings: [
      {
        type: 'text',
        id: 'heading',
        label: 'Heading',
        default: 'Featured Products',
      },
      {
        type: 'range',
        id: 'products_per_row',
        label: 'Products per Row',
        default: 4,
        min: 2,
        max: 6,
        step: 1,
      },
      {
        type: 'range',
        id: 'rows',
        label: 'Number of Rows',
        default: 1,
        min: 1,
        max: 3,
        step: 1,
      },
      {
        type: 'checkbox',
        id: 'show_quick_view',
        label: 'Show Quick View',
        default: true,
      },
      {
        type: 'checkbox',
        id: 'show_vendor',
        label: 'Show Vendor',
        default: false,
      },
    ],
  },
  defaultSettings: {
    heading: 'Featured Products',
    products_per_row: 4,
    rows: 1,
    show_quick_view: true,
    show_vendor: false,
  },
}

export const imageWithTextSchema: ThemeSection = {
  id: 'image-with-text',
  name: 'Image with Text',
  description: 'Sezione con immagine e testo affiancati',
  schema: {
    settings: [
      {
        type: 'image',
        id: 'image',
        label: 'Image',
      },
      {
        type: 'select',
        id: 'image_position',
        label: 'Image Position',
        default: 'left',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
        ],
      },
      {
        type: 'text',
        id: 'heading',
        label: 'Heading',
        default: 'Our Story',
      },
      {
        type: 'richtext',
        id: 'text',
        label: 'Text',
        default: 'Tell your brand story here...',
      },
      {
        type: 'text',
        id: 'button_text',
        label: 'Button Text',
      },
      {
        type: 'url',
        id: 'button_link',
        label: 'Button Link',
      },
    ],
  },
  defaultSettings: {
    image_position: 'left',
    heading: 'Our Story',
    text: 'Tell your brand story here...',
  },
}

export const collectionListSchema: ThemeSection = {
  id: 'collection-list',
  name: 'Collection List',
  description: 'Lista di collezioni con immagini',
  schema: {
    settings: [
      {
        type: 'text',
        id: 'heading',
        label: 'Heading',
        default: 'Shop by Category',
      },
      {
        type: 'range',
        id: 'collections_per_row',
        label: 'Collections per Row',
        default: 3,
        min: 2,
        max: 4,
        step: 1,
      },
    ],
    blocks: [
      {
        type: 'collection',
        name: 'Collection',
        settings: [
          {
            type: 'text',
            id: 'collection_id',
            label: 'Collection ID',
          },
          {
            type: 'image',
            id: 'image',
            label: 'Image Override',
            info: 'Optional: override collection image',
          },
        ],
      },
    ],
    max_blocks: 12,
  },
  defaultSettings: {
    heading: 'Shop by Category',
    collections_per_row: 3,
  },
}

export const testimonialSchema: ThemeSection = {
  id: 'testimonials',
  name: 'Testimonials',
  description: 'Recensioni e testimonianze clienti',
  schema: {
    settings: [
      {
        type: 'text',
        id: 'heading',
        label: 'Heading',
        default: 'What Our Customers Say',
      },
      {
        type: 'select',
        id: 'layout',
        label: 'Layout',
        default: 'grid',
        options: [
          { label: 'Grid', value: 'grid' },
          { label: 'Carousel', value: 'carousel' },
        ],
      },
    ],
    blocks: [
      {
        type: 'testimonial',
        name: 'Testimonial',
        settings: [
          {
            type: 'textarea',
            id: 'quote',
            label: 'Quote',
          },
          {
            type: 'text',
            id: 'author',
            label: 'Author',
          },
          {
            type: 'text',
            id: 'author_title',
            label: 'Author Title',
          },
          {
            type: 'image',
            id: 'author_image',
            label: 'Author Image',
          },
          {
            type: 'range',
            id: 'rating',
            label: 'Rating',
            default: 5,
            min: 1,
            max: 5,
            step: 1,
          },
        ],
        limit: 10,
      },
    ],
  },
  defaultSettings: {
    heading: 'What Our Customers Say',
    layout: 'grid',
  },
}

export const newsletterSchema: ThemeSection = {
  id: 'newsletter',
  name: 'Newsletter',
  description: 'Iscrizione newsletter',
  schema: {
    settings: [
      {
        type: 'text',
        id: 'heading',
        label: 'Heading',
        default: 'Subscribe to our newsletter',
      },
      {
        type: 'textarea',
        id: 'subheading',
        label: 'Subheading',
        default: 'Get the latest updates and offers',
      },
      {
        type: 'text',
        id: 'button_text',
        label: 'Button Text',
        default: 'Subscribe',
      },
      {
        type: 'color',
        id: 'background_color',
        label: 'Background Color',
        default: '#f9fafb',
      },
    ],
  },
  defaultSettings: {
    heading: 'Subscribe to our newsletter',
    subheading: 'Get the latest updates and offers',
    button_text: 'Subscribe',
    background_color: '#f9fafb',
  },
}

// Export all schemas
export const sectionSchemas: Record<string, ThemeSection> = {
  hero: heroSectionSchema,
  'featured-products': featuredProductsSchema,
  'image-with-text': imageWithTextSchema,
  'collection-list': collectionListSchema,
  testimonials: testimonialSchema,
  newsletter: newsletterSchema,
}
