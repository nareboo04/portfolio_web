import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'
import type { SiteContent } from '@/types'

const URL_KEYS = new Set(['about_github', 'about_linkedin'])

export async function GET() {
  try {
    const rows = await query<{ key: string; value: string }>('SELECT `key`, `value` FROM `site_content`')
    const content: SiteContent = {}
    for (const row of rows) content[row.key] = row.value
    return NextResponse.json({ success: true, data: content })
  } catch (err) {
    console.error('[content GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch content' }, { status: 500 })
  }
}

// Protected by middleware (auth + CSRF)
export async function PATCH(req: NextRequest) {
  try {
    const updates = await req.json() as Record<string, string>
    if (typeof updates !== 'object' || Array.isArray(updates)) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const allowedKeys = new Set([
      'hero_name', 'hero_subtitle', 'hero_description',
      'about_bio', 'about_location', 'about_email',
      'about_github', 'about_linkedin', 'about_resume_url', 'about_avatar',
      'meta_title', 'meta_description',
    ])

    for (const [key, rawValue] of Object.entries(updates)) {
      if (!allowedKeys.has(key)) continue
      const value = URL_KEYS.has(key) ? sanitizeUrl(rawValue) : sanitizeText(rawValue)
      await execute(
        'INSERT INTO `site_content` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, value],
      )
    }

    return NextResponse.json({ success: true, message: 'Content updated' })
  } catch (err) {
    console.error('[content PATCH]', err)
    return NextResponse.json({ success: false, error: 'Failed to update content' }, { status: 500 })
  }
}
