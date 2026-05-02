import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth(async (req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  const isProtected = nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/api/messages/') ||
    nextUrl.pathname.startsWith('/api/user/')

  const isAdminRoute = nextUrl.pathname.startsWith('/admin') ||
    nextUrl.pathname.startsWith('/api/admin/')

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    // Full admin check happens in assertAdmin() per-route
    // Middleware only blocks unauthenticated users here
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
