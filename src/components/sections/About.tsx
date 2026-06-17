'use client'

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/providers/AuthProvider'
import InlineEditor from '@/components/admin/InlineEditor'
import type { SiteContent } from '@/types'

interface AboutProps {
  content: SiteContent
  onContentChange?: (key: string, value: string) => void
}

export default function About({ content, onContentChange }: AboutProps) {
  const { isEditMode, csrfToken } = useAuth()
  const fileInputRef    = useRef<HTMLInputElement>(null)
  const resumeInputRef  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [resumeUploading, setResumeUploading] = useState(false)

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeUploading(true)
    try {
      const fd = new FormData()
      fd.append('files', file)
      const uploadRes  = await fetch('/api/upload', {
        method: 'POST',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        body: fd,
      })
      const uploadData = await uploadRes.json()
      if (!uploadData.success || !uploadData.data.urls[0]) {
        toast.error(uploadData.error || 'Upload failed')
        return
      }
      const url = uploadData.data.urls[0]

      const saveRes  = await fetch('/api/content', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ about_resume_url: url }),
      })
      const saveData = await saveRes.json()
      if (saveData.success) {
        onContentChange?.('about_resume_url', url)
        toast.success('Resume uploaded!')
      } else {
        toast.error(saveData.error || 'Failed to save resume URL')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setResumeUploading(false)
      if (resumeInputRef.current) resumeInputRef.current.value = ''
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Step 1: upload image file
      const fd = new FormData()
      fd.append('files', file)
      const uploadRes  = await fetch('/api/upload', {
        method: 'POST',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        body: fd,
      })
      const uploadData = await uploadRes.json()
      if (!uploadData.success || !uploadData.data.urls[0]) {
        toast.error(uploadData.error || 'Upload failed')
        return
      }
      const url = uploadData.data.urls[0]

      // Step 2: immediately save to DB
      const saveRes  = await fetch('/api/content', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ about_avatar: url }),
      })
      const saveData = await saveRes.json()
      if (saveData.success) {
        onContentChange?.('about_avatar', url)
        toast.success('Profile photo updated!')
      } else {
        toast.error(saveData.error || 'Failed to save photo')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <section id="about" className="py-24">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Avatar */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-400 to-purple-500 rotate-6 opacity-20" />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500 to-purple-600 rotate-3 opacity-10" />

              <div
                className="relative w-full h-full rounded-3xl overflow-hidden bg-zinc-200 dark:bg-zinc-800"
                onClick={() => isEditMode && fileInputRef.current?.click()}
              >
                {content.about_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={content.about_avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 text-6xl select-none">
                    👨‍💻
                  </div>
                )}

                {/* Edit overlay */}
                {isEditMode && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors cursor-pointer flex items-center justify-center group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2 text-white">
                      {uploading ? (
                        <span className="text-sm font-medium animate-pulse">Uploading…</span>
                      ) : (
                        <>
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                          </svg>
                          <span className="text-sm font-medium">Change photo</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="text-brand-500 font-mono font-medium mb-2">About Me</p>
            <h2 className="section-heading mb-6">
              <InlineEditor
                value={content.hero_name || 'Your Name'}
                fieldKey="hero_name"
                enabled={isEditMode}
                onChange={onContentChange}
                tag="span"
              />
            </h2>

            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6 text-lg">
              <InlineEditor
                value={content.about_bio || ''}
                fieldKey="about_bio"
                enabled={isEditMode}
                onChange={onContentChange}
                tag="span"
                multiline
              />
            </p>

            {/* Meta info */}
            <ul className="space-y-3 mb-8">
              {[
                { icon: '📍', key: 'about_location', label: 'Location', value: content.about_location },
                { icon: '✉️', key: 'about_email',    label: 'Email',    value: content.about_email    },
              ].map(({ icon, key, label, value }) => (
                <li key={key} className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                  <span className="text-lg w-6 shrink-0">{icon}</span>
                  <span className="font-medium text-zinc-400 w-20 shrink-0">{label}:</span>
                  <InlineEditor
                    value={value || ''}
                    fieldKey={key}
                    enabled={isEditMode}
                    onChange={onContentChange}
                    tag="span"
                    className="text-brand-600 dark:text-brand-400"
                  />
                </li>
              ))}
            </ul>

            {/* Social links */}
            <div className="flex gap-3 flex-wrap">
              {(isEditMode || content.about_github) && (
                <a href={content.about_github || '#'} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              )}
              {(isEditMode || content.about_linkedin) && (
                <a href={content.about_linkedin || '#'} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
              {(isEditMode || content.about_resume_url) && (
                <a href={content.about_resume_url || '#'} target="_blank" rel="noopener noreferrer"
                  className="btn-primary gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resume
                </a>
              )}
            </div>

            {/* Social URL editors — edit mode only */}
            {isEditMode && (
              <div className="mt-4 space-y-2 p-3 rounded-xl border border-dashed border-brand-300 dark:border-brand-700 bg-brand-50/30 dark:bg-brand-900/10">
                <p className="text-xs font-medium text-brand-500 mb-2">Edit social link URLs</p>
                {[
                  { icon: '🐙', key: 'about_github',   label: 'GitHub URL'   },
                  { icon: '💼', key: 'about_linkedin', label: 'LinkedIn URL' },
                ].map(({ icon, key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-5 text-center shrink-0">{icon}</span>
                    <span className="text-xs text-zinc-400 w-24 shrink-0">{label}:</span>
                    <InlineEditor
                      value={content[key] || ''}
                      fieldKey={key}
                      enabled={isEditMode}
                      onChange={onContentChange}
                      tag="span"
                      className="text-xs text-brand-600 dark:text-brand-400 font-mono flex-1 min-w-0 truncate"
                    />
                  </div>
                ))}

                {/* Resume — URL field + PDF upload */}
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center shrink-0">📄</span>
                  <span className="text-xs text-zinc-400 w-24 shrink-0">Resume URL:</span>
                  <InlineEditor
                    value={content.about_resume_url || ''}
                    fieldKey="about_resume_url"
                    enabled={isEditMode}
                    onChange={onContentChange}
                    tag="span"
                    className="text-xs text-brand-600 dark:text-brand-400 font-mono flex-1 min-w-0 truncate"
                  />
                  <button
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={resumeUploading}
                    className="shrink-0 px-2 py-0.5 text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-brand-400 transition-colors disabled:opacity-50"
                  >
                    {resumeUploading ? 'Uploading…' : '⬆ Upload PDF'}
                  </button>
                </div>
                {content.about_resume_url && (
                  <div className="flex items-center gap-2 pl-7">
                    <span className="text-xs text-zinc-400 truncate flex-1">{content.about_resume_url}</span>
                    <button
                      onClick={() => {
                        onContentChange?.('about_resume_url', '')
                        fetch('/api/content', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
                          body: JSON.stringify({ about_resume_url: '' }),
                        }).then(() => toast.success('Resume removed'))
                      }}
                      className="shrink-0 text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
