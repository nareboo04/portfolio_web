import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'
import { getSession } from '@/lib/auth'
import type { Activity } from '@/types'

const VALID_TYPES = ['volunteer', 'award', 'publication', 'project', 'other'] as const

export async function GET() {
  try {
    const session = await getSession()
    const isAdmin = !!session
    const sql = isAdmin
      ? 'SELECT * FROM `activities` ORDER BY `sort_order` ASC, `date` DESC'
      : "SELECT * FROM `activities` WHERE `status` = 'public' ORDER BY `sort_order` ASC, `date` DESC"
    const rows = await query<Activity>(sql)
    return NextResponse.json({ success: true, data: rows })
  } catch (err) {
    console.error('[activities GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch activities' }, { status: 500 })
  }
}

const VALID_STATUS = ['public', 'draft', 'private']

export async function POST(req: NextRequest) {
  try {
    const body         = await req.json()
    const type         = VALID_TYPES.includes(body.type) ? body.type as string : 'other'
    const title        = sanitizeText(String(body.title        || ''))
    const organization = body.organization ? sanitizeText(String(body.organization)) : null
    const description  = body.description  ? sanitizeText(String(body.description))  : null
    const date         = body.date         ? sanitizeText(String(body.date))          : null
    const url          = body.url          ? sanitizeUrl(String(body.url))            : null
    const imageUrl     = body.image_url    ? sanitizeText(String(body.image_url))     : null
    const status       = VALID_STATUS.includes(body.status) ? body.status : 'public'

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const result = await execute(
      `INSERT INTO \`activities\` (\`type\`, \`title\`, \`organization\`, \`description\`, \`date\`, \`url\`, \`image_url\`, \`status\`, \`sort_order\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(a.sort_order), 0) + 1 FROM \`activities\` a))`,
      [type, title, organization, description, date, url, imageUrl, status],
    )

    return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 })
  } catch (err) {
    console.error('[activities POST]', err)
    return NextResponse.json({ success: false, error: 'Failed to create activity' }, { status: 500 })
  }
}
