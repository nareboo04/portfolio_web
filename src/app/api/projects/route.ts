import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { sanitizeText, sanitizeRich, sanitizeUrl, sanitizeTags } from '@/lib/sanitize'
import { getSession } from '@/lib/auth'
import type { Project } from '@/types'

function parseProject(row: Record<string, unknown>): Project {
  return {
    ...row,
    tags:     typeof row.tags   === 'string' ? JSON.parse(row.tags)   : (row.tags   ?? []),
    images:   typeof row.images === 'string' ? JSON.parse(row.images) : (row.images ?? []),
    featured: Boolean(row.featured),
    status:   (row.status as string) ?? 'public',
  } as Project
}

export async function GET(req: NextRequest) {
  try {
    const session  = await getSession()
    const isAdmin  = !!session

    const { searchParams } = req.nextUrl
    const category = searchParams.get('category')
    const search   = searchParams.get('q')

    let sql = 'SELECT * FROM `projects`'
    const params: string[] = []
    const conditions: string[] = []

    // Non-admin only sees public projects
    if (!isAdmin) {
      conditions.push('`status` = ?')
      params.push('public')
    }

    if (category && category !== 'all') {
      conditions.push('`category` = ?')
      params.push(sanitizeText(category))
    }
    if (search) {
      conditions.push('(`title` LIKE ? OR `summary` LIKE ? OR JSON_SEARCH(`tags`, "one", ?) IS NOT NULL)')
      const like = `%${sanitizeText(search)}%`
      params.push(like, like, sanitizeText(search))
    }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY `sort_order` ASC, `id` ASC'

    const rows = await query<Record<string, unknown>>(sql, params)
    return NextResponse.json({ success: true, data: rows.map(parseProject) })
  } catch (err) {
    console.error('[projects GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json()
    const title   = sanitizeText(String(body.title   || ''))
    const summary = sanitizeText(String(body.summary || ''))
    const desc    = body.description ? sanitizeRich(String(body.description)) : null
    const cat     = sanitizeText(String(body.category || 'web'))
    const tags    = sanitizeTags(body.tags)
    const images  = Array.isArray(body.images) ? body.images.map((i: string) => sanitizeText(i)) : []
    const liveUrl = body.live_url ? sanitizeUrl(String(body.live_url)) : null
    const repoUrl = body.repo_url ? sanitizeUrl(String(body.repo_url)) : null
    const pdfUrl  = body.pdf_url  ? sanitizeText(String(body.pdf_url)) : null
    const featured = Boolean(body.featured)
    const status  = ['public', 'draft', 'private'].includes(body.status) ? body.status as string : 'draft'

    if (!title || !summary) {
      return NextResponse.json({ success: false, error: 'Title and summary required' }, { status: 400 })
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const result = await execute(
      `INSERT INTO \`projects\`
       (\`title\`,\`slug\`,\`summary\`,\`description\`,\`category\`,\`tags\`,\`images\`,\`live_url\`,\`repo_url\`,\`pdf_url\`,\`featured\`,\`status\`,\`sort_order\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(p.sort_order),0)+1 FROM \`projects\` p))`,
      [title, slug, summary, desc, cat, JSON.stringify(tags), JSON.stringify(images), liveUrl, repoUrl, pdfUrl, featured, status],
    )

    return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 })
  } catch (err) {
    console.error('[projects POST]', err)
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 })
  }
}
