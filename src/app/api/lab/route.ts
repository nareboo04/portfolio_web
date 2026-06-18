import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { LabItem, LabSection } from '@/types'

export async function GET() {
  try {
    const session = await getSession()
    const isAdmin = !!session
    const sql = isAdmin
      ? 'SELECT `id`, `name`, `description`, `image_urls`, `sort_order`, `status` FROM `lab_sections` ORDER BY `sort_order` ASC, `id` ASC'
      : "SELECT `id`, `name`, `description`, `image_urls`, `sort_order`, `status` FROM `lab_sections` WHERE `status` = 'public' ORDER BY `sort_order` ASC, `id` ASC"

    const sections = await query<{
      id: number
      name: string
      description: string | null
      image_urls: unknown
      sort_order: number
      status: 'public' | 'draft' | 'private'
    }>(sql)

    const items = await query<LabItem>(
      'SELECT `id`, `section_id`, `name`, `sort_order` FROM `lab_items` ORDER BY `sort_order` ASC, `id` ASC',
    )

    const data: LabSection[] = sections.map((s) => ({
      ...s,
      image_urls: typeof s.image_urls === 'string' ? JSON.parse(s.image_urls) : (s.image_urls ?? []),
      items: items.filter((i) => i.section_id === s.id),
    }))

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[lab GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch lab data' }, { status: 500 })
  }
}
