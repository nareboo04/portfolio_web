import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

const MIME: Record<string, string> = {
  webp: 'image/webp',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  pdf:  'application/pdf',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const filename = path.join('/')

  // Prevent path traversal
  if (filename.includes('..') || filename.startsWith('/')) {
    return new NextResponse(null, { status: 403 })
  }

  const filePath = join(UPLOAD_DIR, filename)

  try {
    await access(filePath)
  } catch {
    return new NextResponse(null, { status: 404 })
  }

  const buffer = await readFile(filePath)
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const isPdf = ext === 'pdf'

  const headers: Record<string, string> = {
    'Content-Type':  MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Length': String(buffer.length),
  }
  if (isPdf) {
    headers['Content-Disposition'] = `inline; filename="${filename.split('/').pop()}"`
  }

  return new NextResponse(buffer, { status: 200, headers })
}
