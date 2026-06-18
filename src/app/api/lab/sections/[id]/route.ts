import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'

const VALID_STATUS = ['public', 'draft', 'private']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id   = parseInt(params.id)
    const body = await req.json()

    const fields: string[]  = []
    const values: unknown[] = []

    if (body.name !== undefined) {
      const name = sanitizeText(String(body.name ?? ''))
      if (!name) return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 })
      fields.push('`name`=?')
      values.push(name)
    }

    if (body.description !== undefined) {
      const desc = body.description === null ? null : sanitizeText(String(body.description))
      fields.push('`description`=?')
      values.push(desc || null)
    }

    if (body.image_urls !== undefined) {
      const urls = Array.isArray(body.image_urls)
        ? body.image_urls.map((u: unknown) => sanitizeText(String(u)))
        : []
      fields.push('`image_urls`=?')
      values.push(JSON.stringify(urls))
    }

    if (body.status !== undefined && VALID_STATUS.includes(body.status)) {
      fields.push('`status`=?')
      values.push(body.status)
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }

    values.push(id)
    const result = await execute(
      `UPDATE \`lab_sections\` SET ${fields.join(', ')} WHERE \`id\`=?`,
      values,
    )
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[lab section PATCH]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id     = parseInt(params.id)
    const result = await execute('DELETE FROM `lab_sections` WHERE `id`=?', [id])
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[lab section DELETE]', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
