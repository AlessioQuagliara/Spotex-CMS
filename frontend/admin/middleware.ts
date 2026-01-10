import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Liste di percorsi pubblici e privati
const publicPaths = ['/login', '/register', '/forgot-password']
const privatePaths = ['/dashboard']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = request.cookies.get('access_token')?.value

  // Se l'utente è loggato e cerca di accedere a pagine pubbliche
  if (token && publicPaths.includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Se l'utente non è loggato e cerca di accedere a pagine private
  if (!token && (privatePaths.includes(path) || path.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/forgot-password',
    '/dashboard/:path*',
  ],
}