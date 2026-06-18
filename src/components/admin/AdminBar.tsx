'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import MessageCenter from './MessageCenter'
import { cn } from '@/lib/cn'

interface AdminBarProps {
  onAddProject?: () => void
  onReorderSections?: () => void
}

export default function AdminBar({ onAddProject, onReorderSections }: AdminBarProps) {
  const { isAdmin, isEditMode, toggleEditMode } = useAuth()
  const [msgOpen, setMsgOpen] = useState(false)

  if (!isAdmin) return null

  return (
    <>
      <div className={cn(
        'fixed top-16 inset-x-0 z-30 transition-all duration-300',
        'bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800',
      )}>
        <div className="section-container flex items-center justify-between h-10">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Admin Mode
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleEditMode}
              className={cn(
                'text-xs px-3 py-1 rounded-lg font-medium transition-colors',
                isEditMode
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:border-brand-400',
              )}
            >
              {isEditMode ? '✏️ Editing On' : '✏️ Edit Content'}
            </button>
            <button
              onClick={onAddProject}
              className="text-xs px-3 py-1 rounded-lg font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:border-brand-400 transition-colors"
            >
              + New Project
            </button>
            <button
              onClick={onReorderSections}
              className="text-xs px-3 py-1 rounded-lg font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:border-brand-400 transition-colors"
            >
              ⇅ Sections
            </button>
            <button
              onClick={() => setMsgOpen(true)}
              className="text-xs px-3 py-1 rounded-lg font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:border-brand-400 transition-colors"
            >
              💬 Messages
            </button>
          </div>
        </div>
      </div>

      <MessageCenter open={msgOpen} onClose={() => setMsgOpen(false)} />
    </>
  )
}
