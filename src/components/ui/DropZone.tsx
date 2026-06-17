'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/cn'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
}

export default function DropZone({ onFiles, accept = 'image/*', multiple = true, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)

  const process = useCallback((files: FileList | null) => {
    if (!files) return
    onFiles(Array.from(files))
  }, [onFiles])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    process(e.dataTransfer.files)
  }, [process])

  return (
    <label
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-150',
        dragging
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-zinc-300 dark:border-zinc-700 hover:border-brand-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
        disabled && 'opacity-50 pointer-events-none',
      )}
      onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        <span className="text-brand-600 dark:text-brand-400 font-medium">Click to upload</span> or drag &amp; drop
      </span>
      <span className="text-xs text-zinc-400">PNG, JPG, GIF, WebP — max 10 MB</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => process(e.target.files)}
      />
    </label>
  )
}
