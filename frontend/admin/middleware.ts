import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes che richiedono autenticazione
const protectedRoutes = [
  '/dashboard',
  '/posts',
  '/pages',
  '/categories',
  '/media',
  '/settings',
  '/users',
  '/analytics',
]

// Routes pubbliche (non richiedono autenticazione)
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
]

// Routes che richiedono ruoli specifici
const roleBasedRoutes: Record<string, string[]> = {
  '/users': ['admin', 'super_admin'],
  '/settings': ['admin', 'super_admin'],
  '/analytics': ['admin', 'super_admin', 'editor'],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ottieni token e ruolo dai cookies
  const accessToken = request.cookies.get('access_token')?.value
  const userRole = request.cookies.get('user_role')?.value

  // Se la route è pubblica, permetti l'accesso
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Se l'utente è già autenticato e prova ad accedere a /auth/*, redirect a dashboard
    if (accessToken && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Redirect alla root se accede a /
  if (pathname === '/') {
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Se la route è protetta
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // Se non c'è token, redirect a login
    if (!accessToken) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verifica ruoli specifici per certe route
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!userRole || !allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
      }
    }
  }

  return NextResponse.next()
}

// Configurazione matcher per eseguire middleware solo su certe route
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}