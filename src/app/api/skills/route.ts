import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'
import type { Skill } from '@/types'

export async function GET() {
  try {
    const skills = await query<Skill>('SELECT * FROM `skills` ORDER BY `sort_order` ASC, `id` ASC')
    return NextResponse.json({ success: true, data: skills })
  } catch (err) {
    console.error('[skills GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch skills' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body        = await req.json()
    const name        = sanitizeText(String(body.name        || ''))
    const category    = sanitizeText(String(body.category    || 'other'))
    const level       = Math.min(100, Math.max(0, Number(body.level ?? 80)))
    const icon_url    = body.icon_url    ? sanitizeText(String(body.icon_url))    : null
    const description = body.description ? sanitizeText(String(body.description)) : null

    if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 })

    const allowed = ['frontend', 'backend', 'database', 'devops', 'other']
    if (!allowed.includes(category)) {
      return NextResponse.json({ success: false, error: 'Invalid category' }, { status: 400 })
    }

    const result = await execute(
      'INSERT INTO `skills` (`name`, `category`, `level`, `icon_url`, `description`, `sort_order`) VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(s.sort_order),0)+1 FROM `skills` s))',
      [name, category, level, icon_url, description],
    )

    return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 })
  } catch (err) {
    console.error('[skills POST]', err)
    return NextResponse.json({ success: false, error: 'Failed to create skill' }, { status: 500 })
  }
}
