import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'
import type { TimelineEntry } from '@/types'

export async function GET() {
  try {
    const rows = await query<TimelineEntry>(
      'SELECT * FROM `timeline` ORDER BY `sort_order` ASC, `start_date` DESC'
    )
    return NextResponse.json({ success: true, data: rows.map(r => ({ ...r, current: Boolean(r.current) })) })
  } catch (err) {
    console.error('[timeline GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch timeline' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body         = await req.json()
    const type         = sanitizeText(String(body.type         || 'experience'))
    const title        = sanitizeText(String(body.title        || ''))
    const organization = sanitizeText(String(body.organization || ''))
    const location     = body.location     ? sanitizeText(String(body.location))    : null
    const start_date   = sanitizeText(String(body.start_date   || ''))
    const end_date     = body.end_date && !body.current ? sanitizeText(String(body.end_date)) : null
    const current      = body.current ? 1 : 0
    const description  = body.description  ? sanitizeText(String(body.description)) : null
    const pdfUrl       = body.pdf_url      ? sanitizeText(String(body.pdf_url))     : null

    if (!title || !organization || !start_date) {
      return NextResponse.json({ success: false, error: 'Title, organization, and start date are required' }, { status: 400 })
    }
    if (!['experience', 'education'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
    }

    const result = await execute(
      `INSERT INTO \`timeline\` (\`type\`, \`title\`, \`organization\`, \`location\`, \`start_date\`, \`end_date\`, \`current\`, \`description\`, \`pdf_url\`, \`sort_order\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(t.sort_order), 0) + 1 FROM \`timeline\` t))`,
      [type, title, organization, location, start_date, end_date, current, description, pdfUrl],
    )
    return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 })
  } catch (err) {
    console.error('[timeline POST]', err)
    return NextResponse.json({ success: false, error: 'Failed to create timeline entry' }, { status: 500 })
  }
}
