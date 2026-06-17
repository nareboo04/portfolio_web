import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const msg = await queryOne('SELECT id FROM `messages` WHERE `id`=?', [id])
    if (!msg) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await execute('UPDATE `messages` SET `read`=1 WHERE `id`=?', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[messages PATCH]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const msg = await queryOne('SELECT id FROM `messages` WHERE `id`=?', [id])
    if (!msg) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await execute('DELETE FROM `messages` WHERE `id`=?', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[messages DELETE]', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
