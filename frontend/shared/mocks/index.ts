/**
 * MSW Initialization Script
 * Enable MSW in development mode
 * Import this at the top of your app entry point
 */

export async function initMocks() {
  if (typeof window === 'undefined') {
    // Server-side (Node.js)
    const { server } = await import('./server')
    server.listen()
  } else {
    // Client-side (Browser)
    const { worker } = await import('./browser')
    await worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    })
  }
}

// Auto-initialize in development mode
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
  initMocks()
}
