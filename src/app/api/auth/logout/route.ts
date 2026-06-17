import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  const { name, value, options } = clearAuthCookie()
  const response = NextResponse.json({ success: true })
  response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  return response
}
