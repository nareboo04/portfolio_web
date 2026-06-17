import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json() as { order: number[] }
    if (!Array.isArray(order) || order.some((id) => typeof id !== 'number')) {
      return NextResponse.json({ success: false, error: 'Invalid order array' }, { status: 400 })
    }

    await Promise.all(
      order.map((id, index) =>
        execute('UPDATE `activities` SET `sort_order`=? WHERE `id`=?', [index, id])
      )
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[activities reorder]', err)
    return NextResponse.json({ success: false, error: 'Reorder failed' }, { status: 500 })
  }
}
