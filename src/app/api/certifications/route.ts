import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'
import type { Certification } from '@/types'

export async function GET() {
  try {
    const rows = await query<Certification>(
      'SELECT * FROM `certifications` ORDER BY `sort_order` ASC, `issue_date` DESC'
    )
    return NextResponse.json({ success: true, data: rows })
  } catch (err) {
    console.error('[certifications GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch certifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body           = await req.json()
    const title          = sanitizeText(String(body.title      || ''))
    const issuer         = sanitizeText(String(body.issuer     || ''))
    const issue_date     = sanitizeText(String(body.issue_date || ''))
    const expiry_date    = body.expiry_date    ? sanitizeText(String(body.expiry_date))              : null
    const description    = body.description    ? sanitizeText(String(body.description))              : null
    const credential_url = body.credential_url ? sanitizeUrl(String(body.credential_url))            : null
    const pdfUrl         = body.pdf_url        ? sanitizeText(String(body.pdf_url))                  : null
    const imageUrl       = body.image_url      ? sanitizeText(String(body.image_url))                : null

    if (!title || !issuer || !issue_date) {
      return NextResponse.json({ success: false, error: 'Title, issuer, and issue date are required' }, { status: 400 })
    }

    const result = await execute(
      `INSERT INTO \`certifications\` (\`title\`, \`issuer\`, \`issue_date\`, \`expiry_date\`, \`description\`, \`credential_url\`, \`pdf_url\`, \`image_url\`, \`sort_order\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(c.sort_order), 0) + 1 FROM \`certifications\` c))`,
      [title, issuer, issue_date, expiry_date, description, credential_url, pdfUrl, imageUrl],
    )

    return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 })
  } catch (err) {
    console.error('[certifications POST]', err)
    return NextResponse.json({ success: false, error: 'Failed to create certification' }, { status: 500 })
  }
}
