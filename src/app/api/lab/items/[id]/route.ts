import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await req.json()
    const name = sanitizeText(String(body.name ?? ''))
    if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 })

    const result = await execute('UPDATE `lab_items` SET `name`=? WHERE `id`=?', [name, id])
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[lab item PATCH]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const result = await execute('DELETE FROM `lab_items` WHERE `id`=?', [id])
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[lab item DELETE]', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
