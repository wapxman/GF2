import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      console.log('Middleware: No user found for protected route:', pathname)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (pathname === '/login' || pathname === '/register') {
    const user = await getUserFromRequest(request)
    
    if (user) {
      console.log('Middleware: User found on auth page, redirecting to dashboard:', user.login)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      console.log('Middleware: No user found on auth page:', pathname)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register']
}
