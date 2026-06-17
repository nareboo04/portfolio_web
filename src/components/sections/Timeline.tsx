'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'
import { cn } from '@/lib/cn'
import InlineEditor from '@/components/admin/InlineEditor'
import type { TimelineEntry, SiteContent } from '@/types'

interface TimelineProps {
  entries: TimelineEntry[]
  isEditMode?: boolean
  onEdit?: (entry: TimelineEntry) => void
  onDelete?: (id: number) => void
  onAdd?: () => void
  onReordered?: (items: TimelineEntry[]) => void
  content?: SiteContent
  onContentChange?: (key: string, value: string) => void
  csrfToken?: string | null
}

function formatDate(date: string | null, _current: boolean): string {
  if (!date) return 'Present'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function Timeline({ entries, isEditMode, onEdit, onDelete, onAdd, onReordered, content, onContentChange, csrfToken }: TimelineProps) {
  const [active,  setActive]  = useState<'all' | 'experience' | 'education'>('all')
  const [saving,  setSaving]  = useState(false)

  const filtered = active === 'all' ? entries : entries.filter((e) => e.type === active)

  async function onDragEnd(result: DropResult) {
    if (!result.destination || result.source.index === result.destination.index) return

    const reordered = Array.from(filtered)
    const [moved]   = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)

    // Merge back into full entries list
    const filteredIds = new Set(filtered.map((e) => e.id))
    const others = entries.filter((e) => !filteredIds.has(e.id))
    onReordered?.([...reordered, ...others])

    setSaving(true)
    try {
      const res = await fetch('/api/timeline/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ order: reordered.map((e) => e.id) }),
      })
      const d = await res.json()
      if (!d.success) toast.error('Reorder failed')
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="timeline" className="py-24">
      <div className="section-container">
        <InlineEditor value={content?.timeline_label ?? 'My Journey'} fieldKey="timeline_label" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="text-brand-500 font-mono font-medium mb-2" />
        <InlineEditor value={content?.timeline_heading ?? 'Experience & Education'} fieldKey="timeline_heading" enabled={!!isEditMode} onChange={onContentChange} tag="h2" className="section-heading mb-2" />
        <InlineEditor value={content?.timeline_subheading ?? 'The milestones that shaped my career.'} fieldKey="timeline_subheading" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="section-subheading mb-10" multiline />

        {/* Filter tabs + Add button */}
        <div className="flex flex-wrap items-center gap-2 mb-12">
          {(['all', 'experience', 'education'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors',
                active === tab
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-brand-400',
              )}
            >
              {tab}
            </button>
          ))}
          {isEditMode && (
            <div className="ml-auto flex items-center gap-3">
              {saving && <span className="text-xs text-zinc-400 animate-pulse">Saving order…</span>}
              <button onClick={onAdd} className="px-4 py-1.5 rounded-full text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors">
                + Add Entry
              </button>
            </div>
          )}
        </div>

        {isEditMode ? (
          /* ── Edit mode: draggable list ── */
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="timeline">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {filtered.map((entry, i) => (
                    <Draggable key={entry.id} draggableId={String(entry.id)} index={i}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`card p-3 flex items-center gap-3 ${snapshot.isDragging ? 'shadow-xl border-brand-400' : ''}`}
                        >
                          <div {...drag.dragHandleProps} className="cursor-grab text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full shrink-0',
                              entry.type === 'experience' ? 'bg-brand-500' : 'bg-purple-500',
                            )}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{entry.title}</span>
                            <span className="block text-xs text-zinc-400 truncate">
                              {entry.organization} · {formatDate(entry.start_date, false)} — {entry.current ? 'Present' : formatDate(entry.end_date, false)}
                            </span>
                          </span>
                          {entry.current && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Current
                            </span>
                          )}
                          {entry.pdf_url && (
                            <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>
                          )}
                          <button onClick={() => onEdit?.(entry)} className="btn-secondary text-xs px-2 py-1 shrink-0">Edit</button>
                          <button onClick={() => onDelete?.(entry.id)} className="text-xs px-2 py-1 rounded-lg text-red-600 border border-zinc-200 dark:border-zinc-700 hover:border-red-400 bg-white dark:bg-zinc-800 shrink-0">Del</button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {filtered.length === 0 && (
                    <div className="text-center py-8 text-zinc-400 text-sm">No entries in this category.</div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          /* ── View mode: timeline with vertical line ── */
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
            <div className="space-y-8">
              {filtered.map((entry) => (
                <div key={entry.id} className="relative pl-16">
                  <div
                    className={cn(
                      'absolute left-4 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950',
                      entry.type === 'experience' ? 'bg-brand-500' : 'bg-purple-500',
                    )}
                  />
                  <div className="relative group card p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{entry.title}</h3>
                      <span className="text-xs text-zinc-400 font-mono whitespace-nowrap">
                        {formatDate(entry.start_date, false)} — {entry.current ? 'Present' : formatDate(entry.end_date, false)}
                      </span>
                    </div>
                    <p className="text-brand-600 dark:text-brand-400 font-medium text-sm mb-1">
                      {entry.organization}
                      {entry.location && <span className="text-zinc-400 dark:text-zinc-500 font-normal"> · {entry.location}</span>}
                    </p>
                    {entry.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">{entry.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {entry.current && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Current
                        </span>
                      )}
                      {entry.pdf_url && (
                        <a
                          href={entry.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 font-medium transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
                          Certificate
                        </a>
                      )}
                    </div>
                    {/* Admin overlay */}
                    {isEditMode && (
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit?.(entry)}
                          className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-brand-400 transition-colors shadow-sm"
                        >Edit</button>
                        <button
                          onClick={() => onDelete?.(entry.id)}
                          className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-zinc-800 text-red-600 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-red-400 transition-colors shadow-sm"
                        >Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
