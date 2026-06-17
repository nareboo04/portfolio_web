import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials, signToken, setAuthCookie } from '@/lib/auth'
import { sanitizeText } from '@/lib/sanitize'
import { verifyTurnstile } from '@/lib/turnstile'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username  = sanitizeText(String(body.username || ''))
    const password  = String(body.password || '')
    const cfToken   = String(body.cf_turnstile_response || '')

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined
    const turnstileOk = await verifyTurnstile(cfToken, ip)
    if (!turnstileOk) {
      return NextResponse.json({ success: false, error: 'Human verification failed' }, { status: 403 })
    }

    const valid = await verifyAdminCredentials(username, password)
    if (!valid) {
      // Constant-time delay to blunt timing attacks
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 200))
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await signToken(username)
    const { name, value, options } = setAuthCookie(token)
    const response = NextResponse.json({ success: true })
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    return response
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
