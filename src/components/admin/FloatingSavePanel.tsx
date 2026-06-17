'use client'

import { cn } from '@/lib/cn'

interface FloatingSavePanelProps {
  visible: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}

export default function FloatingSavePanel({ visible, saving, onSave, onDiscard }: FloatingSavePanelProps) {
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300',
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-6 pointer-events-none',
      )}
    >
      <div className="glass border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Unsaved changes
        </div>
        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
        <button
          onClick={onDiscard}
          disabled={saving}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-primary text-sm px-4 py-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  )
}
