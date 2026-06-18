import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sectionId = parseInt(params.id)
    const { order } = (await req.json()) as { order: number[] }
    if (!Array.isArray(order)) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 })
    }

    await Promise.all(
      order.map((itemId, index) =>
        execute(
          'UPDATE `lab_items` SET `sort_order`=? WHERE `id`=? AND `section_id`=?',
          [index, itemId, sectionId],
        ),
      ),
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[lab items reorder]', err)
    return NextResponse.json({ success: false, error: 'Reorder failed' }, { status: 500 })
  }
}
