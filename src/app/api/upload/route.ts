import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

const UPLOAD_DIR    = join(process.cwd(), 'public', 'uploads')
const MAX_IMG_SIZE  = 10 * 1024 * 1024  // 10 MB
const MAX_PDF_SIZE  = 20 * 1024 * 1024  // 20 MB
const ALLOWED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const ALLOWED_MIME  = new Set([...ALLOWED_IMAGE, 'application/pdf'])

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files    = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const urls: string[] = []

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json({ success: false, error: `Unsupported file type: ${file.type}` }, { status: 415 })
      }

      const isPdf = file.type === 'application/pdf'
      const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMG_SIZE
      if (file.size > maxSize) {
        return NextResponse.json({ success: false, error: `File too large (max ${isPdf ? '20' : '10'} MB)` }, { status: 413 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      let filename: string
      let destPath: string

      if (isPdf) {
        filename = `${uuidv4()}.pdf`
        destPath = join(UPLOAD_DIR, filename)
        await writeFile(destPath, buffer)
      } else {
        filename = `${uuidv4()}.webp`
        destPath = join(UPLOAD_DIR, filename)
        await sharp(buffer)
          .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(destPath)
      }

      urls.push(`/uploads/${filename}`)
    }

    return NextResponse.json({ success: true, data: { urls } }, { status: 201 })
  } catch (err) {
    console.error('[upload POST]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
