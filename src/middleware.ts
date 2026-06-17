import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { CSRF_COOKIE, CSRF_HEADER, generateCsrfToken } from '@/lib/auth'

const PROTECTED_PATHS = ['/api/projects', '/api/skills', '/api/timeline', '/api/content', '/api/messages', '/api/upload', '/api/certifications', '/api/activities']
const ADMIN_PAGE = '/admin'

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { method } = request
  const response = NextResponse.next()

  // ── Inject CSRF cookie on GET requests (double-submit pattern) ──
  if (method === 'GET' && !request.cookies.get(CSRF_COOKIE)) {
    const token = generateCsrfToken()
    response.cookies.set(CSRF_COOKIE, token, {
      httpOnly: false, // Must be readable by JS for the header
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path:     '/',
      maxAge:   60 * 60 * 8,
    })
  }

  // ── Auth guard for /admin page ──
  if (pathname.startsWith(ADMIN_PAGE)) {
    const token = request.cookies.get('portfolio_auth')?.value
    if (!token || !(await verifyToken(token))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── Auth guard for protected API routes (mutating methods) ──
  if (isProtectedApi(pathname) && method !== 'GET') {
    const token = request.cookies.get('portfolio_auth')?.value
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // CSRF check for state-changing calls
    const cookieCsrf = request.cookies.get(CSRF_COOKIE)?.value
    const headerCsrf = request.headers.get(CSRF_HEADER)
    if (!cookieCsrf || !headerCsrf || cookieCsrf !== headerCsrf) {
      return NextResponse.json({ success: false, error: 'Invalid CSRF token' }, { status: 403 })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/projects/:path*',
    '/api/skills/:path*',
    '/api/timeline/:path*',
    '/api/content/:path*',
    '/api/messages/:path*',
    '/api/upload/:path*',
    '/api/certifications/:path*',
    '/api/activities/:path*',
    '/((?!_next/static|_next/image|favicon.ico|uploads/).*)',
  ],
}
