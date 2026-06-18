import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'

const VALID_STATUS = ['public', 'draft', 'private']

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }         = await params
    const body           = await req.json()
    const title          = sanitizeText(String(body.title      || ''))
    const issuer         = sanitizeText(String(body.issuer     || ''))
    const issue_date     = sanitizeText(String(body.issue_date || ''))
    const expiry_date    = body.expiry_date    ? sanitizeText(String(body.expiry_date))   : null
    const description    = body.description    ? sanitizeText(String(body.description))   : null
    const credential_url = body.credential_url ? sanitizeUrl(String(body.credential_url)) : null
    const pdfUrl         = body.pdf_url        ? sanitizeText(String(body.pdf_url))       : null
    const imageUrl       = body.image_url      ? sanitizeText(String(body.image_url))     : null
    const status         = VALID_STATUS.includes(body.status) ? body.status : 'public'

    if (!title || !issuer || !issue_date) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 })
    }

    await execute(
      `UPDATE \`certifications\` SET
       \`title\`=?, \`issuer\`=?, \`issue_date\`=?, \`expiry_date\`=?, \`description\`=?,
       \`credential_url\`=?, \`pdf_url\`=?, \`image_url\`=?, \`status\`=?
       WHERE \`id\`=?`,
      [title, issuer, issue_date, expiry_date, description, credential_url, pdfUrl, imageUrl, status, id],
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[certifications PUT]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }  = await params
    const row     = await queryOne('SELECT id FROM `certifications` WHERE `id`=?', [id])
    if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await execute('DELETE FROM `certifications` WHERE `id`=?', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[certifications DELETE]', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
