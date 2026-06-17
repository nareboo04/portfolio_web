import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }       = await params
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

    if (!title || !organization || !start_date || !['experience', 'education'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 })
    }

    await execute(
      'UPDATE `timeline` SET `type`=?, `title`=?, `organization`=?, `location`=?, `start_date`=?, `end_date`=?, `current`=?, `description`=?, `pdf_url`=? WHERE `id`=?',
      [type, title, organization, location, start_date, end_date, current, description, pdfUrl, id],
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[timeline PUT]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const entry  = await queryOne('SELECT id FROM `timeline` WHERE `id`=?', [id])
    if (!entry) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await execute('DELETE FROM `timeline` WHERE `id`=?', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[timeline DELETE]', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
