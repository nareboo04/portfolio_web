import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'
import { verifyTurnstile } from '@/lib/turnstile'
import { sendContactMail } from '@/lib/mailer'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name    = sanitizeText(String(body.name    || '')).slice(0, 200)
    const email   = sanitizeText(String(body.email   || '')).slice(0, 320)
    const subject = sanitizeText(String(body.subject || '')).slice(0, 300)
    const message = sanitizeText(String(body.message || '')).slice(0, 5000)
    const cfToken = String(body.cf_turnstile_response || '')

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined
    const turnstileOk = await verifyTurnstile(cfToken, ip)
    if (!turnstileOk) {
      return NextResponse.json({ success: false, error: 'Human verification failed' }, { status: 403 })
    }

    await execute(
      'INSERT INTO `messages` (`name`, `email`, `subject`, `body`, `ip`) VALUES (?, ?, ?, ?, ?)',
      [name, email, subject, message, ip ?? null],
    )

    // Send email notification (non-blocking — don't fail the request if mail errors)
    sendContactMail({ fromName: name, fromEmail: email, subject, body: message, ip }).catch((err) => {
      console.error('[contact] mail send failed:', err)
    })

    return NextResponse.json({ success: true, message: 'Message sent successfully' }, { status: 201 })
  } catch (err) {
    console.error('[contact POST]', err)
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}
