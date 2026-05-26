import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limit store
const rateStore = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateStore.get(key)
  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count += 1
  return true
}

function getIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1'
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rate limit login/register endpoints
  if (pathname === '/api/auth/callback/credentials' || pathname === '/api/register') {
    const ip = getIp(request)
    const rlKey = `${pathname}:${ip}`
    if (!rateLimit(rlKey, 5, 60000)) {
      return NextResponse.json(
        { error: 'Qua nhieu yeu cau. Vui long thu lai sau 1 phut.' },
        { status: 429 },
      )
    }
  }

  // Rate limit checkout
  if (pathname === '/api/checkout' && request.method === 'POST') {
    const ip = getIp(request)
    if (!rateLimit(`checkout:${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Qua nhieu yeu cau thanh toan. Vui long thu lai sau.' },
        { status: 429 },
      )
    }
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isPageRoute = pathname.startsWith('/admin') && !pathname.startsWith('/api/')
  const isApiRoute = pathname.startsWith('/api/admin/')

  if (!isPageRoute && !isApiRoute) {
    return NextResponse.next()
  }

  if (!token?.id) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token.role !== 'ADMIN' && token.role !== 'STAFF') {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 },
      )
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/callback/credentials', '/api/register', '/api/checkout'],
}
