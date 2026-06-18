import { NextRequest, NextResponse } from 'next/server'
import { execute, query } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'
import type { LabSection } from '@/types'

const VALID_STATUS = ['public', 'draft', 'private']

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const name   = sanitizeText(String(body.name ?? ''))
    const status = VALID_STATUS.includes(body.status) ? body.status : 'public'
    if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 })

    const rows = await query<{ max: number }>(
      'SELECT COALESCE(MAX(`sort_order`), -1) AS max FROM `lab_sections`',
    )
    const sort_order = (rows[0]?.max ?? -1) + 1

    const result = await execute(
      'INSERT INTO `lab_sections` (`name`, `status`, `sort_order`) VALUES (?, ?, ?)',
      [name, status, sort_order],
    )

    const data: LabSection = { id: result.insertId, name, description: null, image_urls: [], sort_order, status, items: [] }
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    console.error('[lab sections POST]', err)
    return NextResponse.json({ success: false, error: 'Failed to create section' }, { status: 500 })
  }
}
