'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/cn'

interface InlineEditorProps {
  value: string
  fieldKey: string
  enabled: boolean
  onChange?: (key: string, value: string) => void
  tag?: keyof JSX.IntrinsicElements
  className?: string
  multiline?: boolean
}

export default function InlineEditor({
  value,
  fieldKey,
  enabled,
  onChange,
  tag: Tag = 'span',
  className,
  multiline = false,
}: InlineEditorProps) {
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState(value)

  useEffect(() => { setDraft(value) }, [value])

  if (!enabled) {
    return <Tag className={className}>{value}</Tag>
  }

  function commit() {
    setEditing(false)
    if (draft !== value) onChange?.(fieldKey, draft)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit() }
    if (e.key === 'Escape') { setDraft(value); setEditing(false) }
  }

  if (editing) {
    const sharedClass = cn(
      'bg-brand-50 dark:bg-brand-900/20 outline outline-2 outline-brand-500 rounded px-1',
      className,
    )
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          className={cn(sharedClass, 'w-full resize-none min-h-[80px]')}
          rows={3}
        />
      )
    }
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className={cn(sharedClass, 'w-full')}
      />
    )
  }

  return (
    <Tag
      tabIndex={0}
      role="button"
      aria-label={`Edit ${fieldKey}`}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditing(true) }}
      className={cn('editable-field', className)}
    >
      {value || <span className="text-zinc-400 italic">Click to edit…</span>}
    </Tag>
  )
}
