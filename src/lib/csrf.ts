import { cookies, headers } from 'next/headers'
import { CSRF_COOKIE, CSRF_HEADER } from './auth'

export async function validateCsrf(): Promise<boolean> {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value
  const headerToken = headerStore.get(CSRF_HEADER)

  if (!cookieToken || !headerToken) return false

  // Constant-time comparison
  if (cookieToken.length !== headerToken.length) return false
  let diff = 0
  for (let i = 0; i < cookieToken.length; i++) {
    diff |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i)
  }
  return diff === 0
}
