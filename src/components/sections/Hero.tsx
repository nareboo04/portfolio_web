'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import InlineEditor from '@/components/admin/InlineEditor'
import type { SiteContent } from '@/types'

interface HeroProps {
  content: SiteContent
  onContentChange?: (key: string, value: string) => void
}

function useTypingEffect(phrases: string[], speed = 80, pause = 1800) {
  const [displayed, setDisplayed]   = useState('')
  const [phraseIdx, setPhraseIdx]   = useState(0)
  const [charIdx, setCharIdx]       = useState(0)
  const [deleting, setDeleting]     = useState(false)

  useEffect(() => {
    const current = phrases[phraseIdx] ?? ''
    const delay = deleting ? 40 : charIdx === current.length ? pause : speed

    const t = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setDisplayed(current.slice(0, charIdx + 1))
        setCharIdx((c) => c + 1)
      } else if (deleting && charIdx > 0) {
        setDisplayed(current.slice(0, charIdx - 1))
        setCharIdx((c) => c - 1)
      } else if (!deleting && charIdx === current.length) {
        setDeleting(true)
      } else {
        setDeleting(false)
        setPhraseIdx((p) => (p + 1) % phrases.length)
        setCharIdx(0)
      }
    }, delay)

    return () => clearTimeout(t)
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause])

  return displayed
}

export default function Hero({ content, onContentChange }: HeroProps) {
  const { isEditMode } = useAuth()
  const phrases = (content.hero_subtitle || '').split('|').filter(Boolean)
  const typed   = useTypingEffect(phrases)

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden pt-16">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float [animation-delay:3s]" />
      </div>

      <div className="section-container relative z-10 py-24">
        <div className="max-w-3xl">
          {/* Greeting */}
          <p className="text-brand-500 font-mono font-medium mb-4 animate-fade-in">
            Hello, I&apos;m
          </p>

          {/* Name */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 animate-slide-up">
            <InlineEditor
              value={content.hero_name || 'Your Name'}
              fieldKey="hero_name"
              enabled={isEditMode}
              onChange={onContentChange}
              tag="span"
              className="text-zinc-900 dark:text-white"
            />
          </h1>

          {/* Typing subtitle */}
          {isEditMode ? (
            <div className="mb-6">
              <p className="text-[11px] font-mono text-brand-400 mb-1">Typing phrases — separate with |</p>
              <InlineEditor
                value={content.hero_subtitle || ''}
                fieldKey="hero_subtitle"
                enabled={isEditMode}
                onChange={onContentChange}
                tag="span"
                className="text-xl font-semibold text-zinc-600 dark:text-zinc-300 font-mono"
              />
            </div>
          ) : (
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-600 dark:text-zinc-300 mb-6 h-10">
              <span className="gradient-text">{typed}</span>
              <span className="animate-blink ml-0.5 text-brand-500">|</span>
            </h2>
          )}

          {/* Description */}
          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed max-w-xl animate-fade-in">
            <InlineEditor
              value={content.hero_description || ''}
              fieldKey="hero_description"
              enabled={isEditMode}
              onChange={onContentChange}
              tag="span"
            />
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4 animate-slide-up">
            <a href="#projects" className="btn-primary text-base px-7 py-3">
              View Projects
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a href="#contact" className="btn-secondary text-base px-7 py-3">
              Get In Touch
            </a>
            {content.about_resume_url && (
              <a
                href={content.about_resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-base px-7 py-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Resume
              </a>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-50">
          <span className="text-xs text-zinc-400">Scroll</span>
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  )
}
