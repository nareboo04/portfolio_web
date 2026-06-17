import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Message } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page     = Math.max(1, parseInt(searchParams.get('page')     || '1',  10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))
    const offset   = (page - 1) * pageSize

    const [countResult, rows] = await Promise.all([
      query<{ total: number }>('SELECT COUNT(*) AS total FROM `messages`'),
      // Inline validated integers — mysql2 rejects JS numbers as LIMIT/OFFSET params on MySQL 8
      query<Message>(`SELECT * FROM \`messages\` ORDER BY \`created_at\` DESC LIMIT ${pageSize} OFFSET ${offset}`),
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
