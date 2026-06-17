'use client'

import { useEffect, useState } from 'react'

export function useCsrf(): string | null {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Read from the csrf_token cookie (not HttpOnly, readable by JS)
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
    if (match) setToken(decodeURIComponent(match[1]))
  }, [])

  return token
}
