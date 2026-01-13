/**
 * Theme Preview Component
 * Live preview del tema in diversi formati
 */

'use client'

import { useEffect, useRef } from 'react'

interface ThemePreviewProps {
  mode: 'desktop' | 'tablet' | 'mobile'
}

export function ThemePreview({ mode }: ThemePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const dimensions = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' },
  }

  useEffect(() => {
    // TODO: Load preview content in iframe
    if (iframeRef.current) {
      // Set iframe content
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(getPreviewHTML())
        doc.close()
      }
    }
  }, [mode])

  const getPreviewHTML = () => {
    // Mock preview HTML - in production, this would load actual store pages
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Preview</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            .preview-banner {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 4rem 2rem;
              text-align: center;
            }
            .preview-banner h1 {
              font-size: 3rem;
              margin-bottom: 1rem;
            }
            .preview-banner p {
              font-size: 1.25rem;
              opacity: 0.9;
            }
            .preview-products {
              padding: 3rem 2rem;
              max-width: 1200px;
              margin: 0 auto;
            }
            .preview-products h2 {
              font-size: 2rem;
              margin-bottom: 2rem;
              text-align: center;
            }
            .preview-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
              gap: 2rem;
            }
            .preview-card {
              border: 1px solid #e5e7eb;
              border-radius: 0.5rem;
              overflow: hidden;
              transition: transform 0.2s;
            }
            .preview-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .preview-card-image {
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              height: 200px;
            }
            .preview-card-content {
              padding: 1rem;
            }
            .preview-card-title {
              font-weight: 600;
              margin-bottom: 0.5rem;
            }
            .preview-card-price {
              color: #667eea;
              font-weight: 700;
              font-size: 1.25rem;
            }
          </style>
        </head>
        <body>
          <div class="preview-banner">
            <h1>Welcome to Our Store</h1>
            <p>Discover amazing products at great prices</p>
          </div>
          
          <div class="preview-products">
            <h2>Featured Products</h2>
            <div class="preview-grid">
              ${Array.from({ length: 6 }, (_, i) => `
                <div class="preview-card">
                  <div class="preview-card-image"></div>
                  <div class="preview-card-content">
                    <div class="preview-card-title">Product ${i + 1}</div>
                    <div class="preview-card-price">$${29.99 + i * 10}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </body>
      </html>
    `
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="bg-white shadow-2xl transition-all duration-300 overflow-hidden"
        style={{
          width: dimensions[mode].width,
          height: dimensions[mode].height,
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: mode !== 'desktop' ? '1rem' : '0',
        }}
      >
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Theme Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}
