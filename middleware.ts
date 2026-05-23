import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const pathname = request.nextUrl.pathname
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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
