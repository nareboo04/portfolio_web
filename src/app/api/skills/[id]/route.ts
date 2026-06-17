import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }      = await params
    const body        = await req.json()
    const name        = sanitizeText(String(body.name        || ''))
    const category    = sanitizeText(String(body.category    || 'other'))
    const level       = Math.min(100, Math.max(0, Number(body.level ?? 80)))
    const icon_url    = body.icon_url    ? sanitizeText(String(body.icon_url))    : null
    const description = body.description ? sanitizeText(String(body.description)) : null

    const allowed = ['frontend', 'backend', 'database', 'devops', 'other']
    if (!name || !allowed.includes(category)) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 })
    }

    await execute(
      'UPDATE `skills` SET `name`=?, `category`=?, `level`=?, `icon_url`=?, `description`=? WHERE `id`=?',
      [name, category, level, icon_url, description, id],
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[skills PUT]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const skill  = await queryOne('SELECT id FROM `skills` WHERE `id`=?', [id])
    if (!skill) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await execute('DELETE FROM `skills` WHERE `id`=?', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[skills DELETE]', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
