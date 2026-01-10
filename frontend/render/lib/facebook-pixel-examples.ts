/**
 * Facebook Pixel Implementation Example
 * This file demonstrates how to use Facebook Pixel in your Next.js application
 */

// ====================================
// 1. SETUP IN LAYOUT
// ====================================

/*
// app/layout.tsx
import { AnalyticsLayout } from '@/components/analytics/analytics-layout';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsLayout 
          config={{
            googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
            facebookPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
            enableTracking: true,
            enableFacebookPixel: true,
            debug: process.env.NODE_ENV === 'development',
          }}
        >
          {children}
        </AnalyticsLayout>
      </body>
    </html>
  );
}
*/

// ====================================
// 2. TRACK E-COMMERCE EVENTS
// ====================================

/*
// Product page component
'use client';

import { useFacebookPixel } from '@/hooks/use-facebook-pixel';

export default function ProductPage({ product }) {
  const { trackViewContent, trackAddToCart } = useFacebookPixel();

  useEffect(() => {
    // Track product view
    trackViewContent({
      contentName: product.name,
      contentCategory: product.category,
      contentIds: [product.id],
      value: product.price,
      currency: 'EUR',
    });
  }, [product]);

  const handleAddToCart = () => {
    // Track add to cart
    trackAddToCart({
      contentName: product.name,
      contentIds: [product.id],
      contentType: 'product',
      value: product.price,
      currency: 'EUR',
    });
    
    // ... your add to cart logic
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
*/

// ====================================
// 3. TRACK LEAD GENERATION
// ====================================

/*
// Contact form component
'use client';

import { useFacebookPixel } from '@/hooks/use-facebook-pixel';

export default function ContactForm() {
  const { trackLead } = useFacebookPixel();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Submit form...
    
    // Track lead
    trackLead({
      contentName: 'Contact Form',
      value: 10, // Estimated lead value
      currency: 'EUR',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
*/

// ====================================
// 4. TRACK PURCHASE
// ====================================

/*
// Checkout success page
'use client';

import { useFacebookPixel } from '@/hooks/use-facebook-pixel';

export default function CheckoutSuccessPage({ order }) {
  const { trackPurchase } = useFacebookPixel();

  useEffect(() => {
    // Track purchase
    trackPurchase({
      contentIds: order.items.map(item => item.id),
      contents: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price,
      })),
      value: order.total,
      currency: 'EUR',
      numItems: order.items.length,
    });
  }, [order]);

  return (
    <div>
      <h1>Order Confirmed!</h1>
      <p>Thank you for your purchase</p>
    </div>
  );
}
*/

// ====================================
// 5. TRACK CUSTOM EVENTS
// ====================================

/*
// Any component
'use client';

import { useFacebookPixel } from '@/hooks/use-facebook-pixel';

export default function CustomComponent() {
  const { trackCustomEvent } = useFacebookPixel();

  const handleCustomAction = () => {
    // Track custom event
    trackCustomEvent('CustomAction', {
      custom_param: 'value',
      another_param: 123,
    });
  };

  return (
    <button onClick={handleCustomAction}>
      Custom Action
    </button>
  );
}
*/

// ====================================
// 6. ENVIRONMENT VARIABLES
// ====================================

/*
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=123456789012345

# Backend .env (for Conversions API)
FACEBOOK_PIXEL_ID=123456789012345
FACEBOOK_CONVERSIONS_API_TOKEN=your_access_token
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
*/

// ====================================
// 7. DIRECT API USAGE (Alternative)
// ====================================

/*
// Using analytics library directly
import { getGA } from '@/lib/analytics';

const ga = getGA();

// Track Facebook Pixel events
if (ga) {
  ga.fbViewContent({
    contentName: 'Product Name',
    value: 29.99,
    currency: 'EUR',
  });

  ga.fbAddToCart({
    contentName: 'Product Name',
    contentIds: ['PROD-123'],
    value: 29.99,
    currency: 'EUR',
  });

  ga.fbPurchase({
    contentIds: ['PROD-123', 'PROD-456'],
    value: 59.98,
    currency: 'EUR',
    numItems: 2,
  });

  ga.fbLead({
    contentName: 'Newsletter Signup',
  });

  ga.fbCustomEvent('CustomEventName', {
    custom_param: 'value',
  });
}
*/

// ====================================
// 8. TESTING
// ====================================

/*
To test Facebook Pixel:

1. Install Facebook Pixel Helper Chrome Extension
2. Visit your website
3. Check the extension icon - it should show your Pixel ID
4. Perform actions (view products, add to cart, etc.)
5. Verify events are being tracked in the extension popup
6. Check events in Facebook Events Manager:
   https://business.facebook.com/events_manager

7. Use Test Events feature:
   - Go to Events Manager
   - Select your pixel
   - Click "Test Events"
   - Enter your browser's fbp cookie value
   - Perform actions on your site
   - See events appear in real-time

8. Backend Conversions API testing:
   - Check backend logs for Facebook Pixel responses
   - Verify events in Events Manager under "Server" events
*/

export {};
