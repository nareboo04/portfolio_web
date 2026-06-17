'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useCsrf } from '@/hooks/useCsrf'

interface AuthContextType {
  isAdmin: boolean
  isEditMode: boolean
  username: string | null
  toggleEditMode: () => void
  logout: () => Promise<void>
  csrfToken: string | null
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  isEditMode: false,
  username: null,
  toggleEditMode: () => {},
  logout: async () => {},
  csrfToken: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin]       = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [username, setUsername]     = useState<string | null>(null)
  const csrfToken = useCsrf()

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setIsAdmin(true)
          setUsername(d.username)
        }
      })
      .catch(() => {})
  }, [])

  const toggleEditMode = useCallback(() => setIsEditMode((p) => !p), [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    setIsAdmin(false)
    setIsEditMode(false)
    setUsername(null)
    window.location.href = '/'
  }, [csrfToken])

  return (
    <AuthContext.Provider value={{ isAdmin, isEditMode, username, toggleEditMode, logout, csrfToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
