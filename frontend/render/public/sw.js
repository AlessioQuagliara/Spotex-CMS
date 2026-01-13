/**
 * Service Worker for PWA
 * Handles caching, offline support, background sync, and push notifications
 */

const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `spotex-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `spotex-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `spotex-images-${CACHE_VERSION}`;
const API_CACHE = `spotex-api-${CACHE_VERSION}`;

// Resources to precache
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Cache strategies by route pattern
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: [
    /\/_next\/static\//,
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|otf)$/,
  ],
  
  // Network first for API calls
  NETWORK_FIRST: [
    /\/api\//,
  ],
  
  // Stale while revalidate for pages
  STALE_WHILE_REVALIDATE: [
    /\/products\//,
    /\/categories\//,
    /\/pages\//,
  ],
};

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  [IMAGE_CACHE]: 100,
  [API_CACHE]: 50,
  [RUNTIME_CACHE]: 100,
};

// Cache expiration times (in seconds)
const CACHE_EXPIRATION = {
  [IMAGE_CACHE]: 7 * 24 * 60 * 60, // 7 days
  [API_CACHE]: 5 * 60, // 5 minutes
  [RUNTIME_CACHE]: 24 * 60 * 60, // 1 day
};

/**
 * Install event - precache resources
 */
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Precaching resources");
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      console.log("[SW] Service worker installed");
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith("spotex-") && cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("[SW] Service worker activated");
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - handle requests with appropriate strategy
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }
  
  // Skip chrome extensions and other origins
  if (!url.origin.includes(self.location.origin)) {
    return;
  }
  
  // Determine cache strategy
  const strategy = getCacheStrategy(url.pathname);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch(() => {
        // Return offline page for navigation requests
        if (request.mode === "navigate") {
          return caches.match("/offline");
        }
        
        // Return placeholder for images
        if (request.destination === "image") {
          return caches.match("/icons/icon-192x192.png");
        }
        
        return new Response("Network error", {
          status: 408,
          headers: { "Content-Type": "text/plain" },
        });
      })
  );
});

/**
 * Get cache strategy for URL
 */
function getCacheStrategy(pathname) {
  if (CACHE_STRATEGIES.CACHE_FIRST.some((pattern) => pattern.test(pathname))) {
    return "cache-first";
  }
  
  if (CACHE_STRATEGIES.NETWORK_FIRST.some((pattern) => pattern.test(pathname))) {
    return "network-first";
  }
  
  if (CACHE_STRATEGIES.STALE_WHILE_REVALIDATE.some((pattern) => pattern.test(pathname))) {
    return "stale-while-revalidate";
  }
  
  return "network-first";
}

/**
 * Handle request with specified strategy
 */
async function handleRequest(request, strategy) {
  switch (strategy) {
    case "cache-first":
      return cacheFirst(request);
    
    case "network-first":
      return networkFirst(request);
    
    case "stale-while-revalidate":
      return staleWhileRevalidate(request);
    
    default:
      return fetch(request);
  }
}

/**
 * Cache first strategy
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch(request);
  
  if (response.ok) {
    const cache = await getCacheForRequest(request);
    await cache.put(request, response.clone());
    await limitCacheSize(cache);
  }
  
  return response;
}

/**
 * Network first strategy
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await getCacheForRequest(request);
      await cache.put(request, response.clone());
      await limitCacheSize(cache);
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request) {
  const cache = await getCacheForRequest(request);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
      await limitCacheSize(cache);
    }
    return response;
  });
  
  return cached || fetchPromise;
}

/**
 * Get appropriate cache for request
 */
async function getCacheForRequest(request) {
  const url = new URL(request.url);
  
  if (request.destination === "image") {
    return caches.open(IMAGE_CACHE);
  }
  
  if (url.pathname.startsWith("/api/")) {
    return caches.open(API_CACHE);
  }
  
  return caches.open(RUNTIME_CACHE);
}

/**
 * Limit cache size
 */
async function limitCacheSize(cache) {
  const cacheName = (await caches.keys()).find((name) => 
    cache === caches.open(name)
  );
  
  if (!cacheName || !MAX_CACHE_SIZE[cacheName]) {
    return;
  }
  
  const keys = await cache.keys();
  
  if (keys.length > MAX_CACHE_SIZE[cacheName]) {
    await cache.delete(keys[0]);
    await limitCacheSize(cache);
  }
}

/**
 * Background sync event
 */
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);
  
  if (event.tag === "sync-cart") {
    event.waitUntil(syncCart());
  }
  
  if (event.tag === "sync-orders") {
    event.waitUntil(syncOrders());
  }
  
  if (event.tag === "sync-wishlist") {
    event.waitUntil(syncWishlist());
  }
});

/**
 * Sync cart with server
 */
async function syncCart() {
  try {
    const cache = await caches.open(API_CACHE);
    const cartData = await cache.match("/api/cart");
    
    if (!cartData) {
      return;
    }
    
    const cart = await cartData.json();
    
    const response = await fetch("/api/cart/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cart),
    });
    
    if (response.ok) {
      console.log("[SW] Cart synced successfully");
      
      // Notify all clients
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "CART_SYNCED",
          data: cart,
        });
      });
    }
  } catch (error) {
    console.error("[SW] Failed to sync cart:", error);
    throw error;
  }
}

/**
 * Sync orders with server
 */
async function syncOrders() {
  try {
    // Implementation similar to syncCart
    console.log("[SW] Syncing orders...");
  } catch (error) {
    console.error("[SW] Failed to sync orders:", error);
    throw error;
  }
}

/**
 * Sync wishlist with server
 */
async function syncWishlist() {
  try {
    // Implementation similar to syncCart
    console.log("[SW] Syncing wishlist...");
  } catch (error) {
    console.error("[SW] Failed to sync wishlist:", error);
    throw error;
  }
}

/**
 * Push notification event
 */
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");
  
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || "New notification",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/icon-72x72.png",
    image: data.image,
    vibrate: [200, 100, 200],
    tag: data.tag || "notification",
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || "Spotex", options)
  );
});

/**
 * Notification click event
 */
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "/";
  
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window open
        for (const client of clients) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);
  
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith("spotex-")) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
  
  if (event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

/**
 * Periodic background sync (experimental)
 */
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "content-sync") {
    event.waitUntil(syncContent());
  }
});

/**
 * Sync content in background
 */
async function syncContent() {
  try {
    console.log("[SW] Syncing content...");
    
    // Fetch latest products, categories, etc.
    const responses = await Promise.all([
      fetch("/api/products?limit=10"),
      fetch("/api/categories"),
    ]);
    
    const cache = await caches.open(API_CACHE);
    
    responses.forEach(async (response, index) => {
      if (response.ok) {
        const url = index === 0 ? "/api/products?limit=10" : "/api/categories";
        await cache.put(url, response.clone());
      }
    });
    
    console.log("[SW] Content synced successfully");
  } catch (error) {
    console.error("[SW] Failed to sync content:", error);
  }
}
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.url,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return self.clients.claim();
      })
    );
  }
});
