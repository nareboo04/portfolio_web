import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'
import { sanitizeText, sanitizeRich, sanitizeUrl, sanitizeTags } from '@/lib/sanitize'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
    const status   = ['public', 'draft', 'private'].includes(body.status) ? body.status as string : 'public'

    if (!title || !summary) {
      return NextResponse.json({ success: false, error: 'Title and summary required' }, { status: 400 })
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    await execute(
      `UPDATE \`projects\` SET
       \`title\`=?, \`slug\`=?, \`summary\`=?, \`description\`=?,
       \`category\`=?, \`tags\`=?, \`images\`=?, \`live_url\`=?,
       \`repo_url\`=?, \`pdf_url\`=?, \`featured\`=?, \`status\`=?
       WHERE \`id\`=?`,
      [title, slug, summary, desc, cat, JSON.stringify(tags), JSON.stringify(images), liveUrl, repoUrl, pdfUrl, featured, status, id],
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[projects PUT]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await queryOne('SELECT id FROM `projects` WHERE `id`=?', [id])
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await execute('DELETE FROM `projects` WHERE `id`=?', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[projects DELETE]', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
