'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCsrf } from '@/hooks/useCsrf'
import toast from 'react-hot-toast'
import Link from 'next/link'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export default function LoginPage() {
  const router    = useRouter()
  const csrfToken = useCsrf()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [cfToken,  setCfToken]  = useState('')
  const widgetId = useRef<string | null>(null)

  // Render Turnstile widget, re-render when dark mode changes
  useEffect(() => {
    type TurnstileAPI = { render: (el: string, opts: object) => string; remove: (id: string) => void }
    const tw = () => (window as unknown as { turnstile?: TurnstileAPI }).turnstile

    function getTheme(): 'dark' | 'light' {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }

    function renderWidget() {
      const api = tw()
      if (!api) return
      if (widgetId.current) { api.remove(widgetId.current); widgetId.current = null }
      setCfToken('')
      widgetId.current = api.render('#cf-widget', {
        sitekey: SITE_KEY,
        theme: getTheme(),
        callback: (token: string) => setCfToken(token),
      })
    }

    const interval = setInterval(() => {
      if (tw()) { renderWidget(); clearInterval(interval) }
    }, 200)

    const observer = new MutationObserver(() => renderWidget())
    observer.observe(document.documentElement, { attributeFilter: ['class'] })

    return () => { clearInterval(interval); observer.disconnect() }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { toast.error('Enter credentials'); return }

    if (!cfToken) { toast.error('Complete the human verification first'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ username, password, cf_turnstile_response: cfToken }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Welcome back!')
        router.push('/')
        router.refresh()
      } else {
        toast.error(data.error || 'Login failed')
        ;(window as unknown as { turnstile?: { reset: (id: string) => void } }).turnstile?.reset(widgetId.current!)
        setCfToken('')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-mono font-bold text-2xl gradient-text">
            &lt;portfolio /&gt;
          </Link>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Admin sign-in</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Turnstile */}
          <div id="cf-widget" />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          <Link href="/" className="hover:text-brand-500 transition-colors">← Back to portfolio</Link>
        </p>
      </div>

      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
    </div>
  )
}
