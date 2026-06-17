'use client'

import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    turnstile?: { reset: (id?: string) => void }
    onTurnstileSuccess?: (token: string) => void
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [cfToken, setCfToken] = useState('')
  const widgetRef = useRef<HTMLDivElement>(null)

  // Bridge global Turnstile callback → React state so the token is captured
  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => setCfToken(token)
    return () => { delete window.onTurnstileSuccess }
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())    e.name    = 'Name is required'
    if (!form.email.trim())   e.email   = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.subject.trim()) e.subject = 'Subject is required'
    if (!form.message.trim()) e.message = 'Message is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (!cfToken) {
      toast.error('Please complete the human verification first')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cf_turnstile_response: cfToken }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Message sent! I'll get back to you soon.")
        setForm({ name: '', email: '', subject: '', message: '' })
        setCfToken('')
        window.turnstile?.reset()
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form, label: string, placeholder: string, multiline = false) => (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      {multiline ? (
        <textarea
          rows={5}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          className="input resize-none"
        />
      ) : (
        <input
          type={key === 'email' ? 'email' : 'text'}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          className="input"
        />
      )}
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  )

  return (
    <section id="contact" className="py-24">
      <div className="section-container">
        <div className="max-w-2xl mx-auto">
          <p className="text-brand-500 font-mono font-medium mb-2 text-center">Get In Touch</p>
          <h2 className="section-heading mb-2 text-center">Contact Me</h2>
          <p className="section-subheading mb-10 text-center mx-auto">
            Have a project in mind or just want to say hello? I&apos;d love to hear from you.
          </p>

          <form onSubmit={handleSubmit} className="card p-8 space-y-5" noValidate>
            <div className="grid sm:grid-cols-2 gap-5">
              {field('name',    'Name',    'John Doe')}
              {field('email',   'Email',   'john@example.com')}
            </div>
            {field('subject', 'Subject', 'Project enquiry')}
            {field('message', 'Message', 'Tell me about your project…', true)}

            {/* Cloudflare Turnstile */}
            <div
              ref={widgetRef}
              className="cf-turnstile"
              data-sitekey={SITE_KEY}
              data-theme="auto"
              data-callback="onTurnstileSuccess"
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  Send Message
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Turnstile script */}
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
    </section>
  )
}
