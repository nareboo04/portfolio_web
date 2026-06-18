import { NextRequest, NextResponse } from 'next/server'
import { execute, query } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'
import type { LabItem } from '@/types'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sectionId = parseInt(params.id)
    const body = await req.json()
    const name = sanitizeText(String(body.name ?? ''))
    if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 })

    const rows = await query<{ max: number }>(
      'SELECT COALESCE(MAX(`sort_order`), -1) AS max FROM `lab_items` WHERE `section_id`=?',
      [sectionId],
    )
    const sort_order = (rows[0]?.max ?? -1) + 1

    const result = await execute(
      'INSERT INTO `lab_items` (`section_id`, `name`, `sort_order`) VALUES (?, ?, ?)',
      [sectionId, name, sort_order],
    )

    const data: LabItem = { id: result.insertId, section_id: sectionId, name, sort_order }
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    console.error('[lab items POST]', err)
    return NextResponse.json({ success: false, error: 'Failed to add item' }, { status: 500 })
  }
}
