import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'

const VALID_TYPES = ['volunteer', 'award', 'publication', 'project', 'other']
const VALID_STATUS = ['public', 'draft', 'private']

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }       = await params
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

    await execute(
      'UPDATE `activities` SET `type`=?, `title`=?, `organization`=?, `description`=?, `date`=?, `url`=?, `image_url`=?, `status`=? WHERE `id`=?',
      [type, title, organization, description, date, url, imageUrl, status, id],
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[activities PUT]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const row    = await queryOne('SELECT id FROM `activities` WHERE `id`=?', [id])
    if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await execute('DELETE FROM `activities` WHERE `id`=?', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[activities DELETE]', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
