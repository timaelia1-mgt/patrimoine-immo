import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Middleware désactivé temporairement pour debug
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/biens/:path*',
    '/parametres/:path*',
    '/abonnement/:path*',
  ],
}
