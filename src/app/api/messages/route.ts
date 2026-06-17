import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Message } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page     = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || 20)))
    const offset   = (page - 1) * pageSize

    const [countResult, rows] = await Promise.all([
      query<{ total: number }>('SELECT COUNT(*) AS total FROM `messages`'),
      query<Message>(
        'SELECT * FROM `messages` ORDER BY `created_at` DESC LIMIT ? OFFSET ?',
        [pageSize, offset],
      ),
    ])

    const total      = countResult[0]?.total ?? 0
    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: { items: rows.map(m => ({ ...m, read: Boolean(m.read) })), total, page, pageSize, totalPages },
    })
  } catch (err) {
    console.error('[messages GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
  }
}
