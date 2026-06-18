'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import InlineEditor from '@/components/admin/InlineEditor'
import type { Activity, SiteContent } from '@/types'

interface ActivitiesProps {
  activities: Activity[]
  isEditMode?: boolean
  onEdit?: (a: Activity) => void
  onDelete?: (id: number) => void
  onAdd?: () => void
  onReordered?: (items: Activity[]) => void
  content?: SiteContent
  onContentChange?: (key: string, value: string) => void
  csrfToken?: string | null
}

const TYPE_LABEL: Record<Activity['type'], string> = {
  volunteer:   'Volunteer',
  award:       'Award',
  publication: 'Publication',
  project:     'Project',
  other:       'Other',
}

const TYPE_COLOR: Record<Activity['type'], string> = {
  volunteer:   'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300',
  award:       'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  publication: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300',
  project:     'bg-brand-100  dark:bg-brand-900/30  text-brand-700  dark:text-brand-300',
  other:       'bg-zinc-100   dark:bg-zinc-800       text-zinc-600   dark:text-zinc-300',
}

const STATUS_BADGE: Record<string, string> = {
  draft:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  private: 'bg-zinc-200  dark:bg-zinc-700      text-zinc-500  dark:text-zinc-400',
}

function formatDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function DetailModal({ act, onClose }: { act: Activity; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={act.title} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLOR[act.type]}`}>
            {TYPE_LABEL[act.type]}
          </span>
          {act.date && <span className="text-xs text-zinc-400 font-mono">{formatDate(act.date)}</span>}
        </div>

        {act.organization && (
          <p className="text-brand-600 dark:text-brand-400 text-sm font-medium">{act.organization}</p>
        )}

        {act.image_url && (
          <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 max-h-[60vh] overflow-y-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={act.image_url} alt={act.title} className="w-full h-auto block" />
          </div>
        )}

        {act.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{act.description}</p>
        )}

        {act.url && (
          <a href={act.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Learn more
          </a>
        )}
      </div>
    </Modal>
  )
}

export default function Activities({ activities, isEditMode, onEdit, onDelete, onAdd, onReordered, content, onContentChange, csrfToken }: ActivitiesProps) {
  const [selected, setSelected] = useState<Activity | null>(null)
  const [saving, setSaving]     = useState(false)

  if (!isEditMode && activities.length === 0) return null

  async function onDragEnd(result: DropResult) {
    if (!result.destination || result.source.index === result.destination.index) return

    const reordered = Array.from(activities)
    const [moved]   = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)

    onReordered?.(reordered)
    setSaving(true)
    try {
      const res = await fetch('/api/activities/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ order: reordered.map((a) => a.id) }),
      })
      const d = await res.json()
      if (!d.success) toast.error('Reorder failed')
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const DragHandle = () => (
    <div className="cursor-grab text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 shrink-0 pr-1">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </div>
  )

  return (
    <section id="activities" className="py-24">
      <div className="section-container">
        <InlineEditor value={content?.activities_label ?? 'Beyond the Code'} fieldKey="activities_label" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="text-brand-500 font-mono font-medium mb-2" />
        <div className="flex flex-wrap items-end gap-4 mb-2">
          <InlineEditor value={content?.activities_heading ?? 'Activities'} fieldKey="activities_heading" enabled={!!isEditMode} onChange={onContentChange} tag="h2" className="section-heading" />
          {isEditMode && (
            <div className="ml-auto flex items-center gap-3">
              {saving && <span className="text-xs text-zinc-400 animate-pulse">Saving order…</span>}
              <button onClick={onAdd} className="btn-primary text-sm pb-1">+ Add</button>
            </div>
          )}
        </div>
        <InlineEditor value={content?.activities_subheading ?? 'Volunteering, awards, publications, and other activities.'} fieldKey="activities_subheading" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="section-subheading mb-10" multiline />

        {isEditMode ? (
          /* ── Edit mode: vertical draggable list ── */
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="activities">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {activities.map((act, i) => (
                    <Draggable key={act.id} draggableId={String(act.id)} index={i}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`card p-3 flex items-center gap-3 ${snapshot.isDragging ? 'shadow-xl border-brand-400' : ''}`}
                        >
                          <div {...drag.dragHandleProps}><DragHandle /></div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLOR[act.type]}`}>
                            {TYPE_LABEL[act.type]}
                          </span>
                          <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{act.title}</span>
                          {act.status !== 'public' && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[act.status]}`}>
                              {act.status === 'draft' ? 'Draft' : 'Private'}
                            </span>
                          )}
                          {act.date && <span className="text-xs text-zinc-400 font-mono shrink-0">{formatDate(act.date)}</span>}
                          {act.image_url && (
                            <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          <button onClick={() => onEdit?.(act)} className="btn-secondary text-xs px-2 py-1 shrink-0">Edit</button>
                          <button onClick={() => onDelete?.(act.id)} className="text-xs px-2 py-1 rounded-lg text-red-600 border border-zinc-200 dark:border-zinc-700 hover:border-red-400 bg-white dark:bg-zinc-800 shrink-0">Del</button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {activities.length === 0 && (
                    <div className="text-center py-12 text-zinc-400">No activities yet. Click &ldquo;+ Add&rdquo; to add one.</div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          /* ── View mode: card grid with click-to-detail ── */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activities.map((act) => (
              <button
                key={act.id}
                onClick={() => setSelected(act)}
                className="relative text-left group card p-5 hover:border-brand-400 dark:hover:border-brand-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLOR[act.type]}`}>
                    {TYPE_LABEL[act.type]}
                  </span>
                  {act.date && <span className="text-xs text-zinc-400 font-mono">{formatDate(act.date)}</span>}
                </div>

                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm leading-snug mb-1">{act.title}</h3>
                {act.organization && (
                  <p className="text-brand-600 dark:text-brand-400 text-xs font-medium mb-1">{act.organization}</p>
                )}
                {act.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1 line-clamp-3">{act.description}</p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  {act.image_url && (
                    <span className="text-xs text-zinc-400 inline-flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      has image
                    </span>
                  )}
                  {act.url && (
                    <span className="text-xs text-brand-500 ml-auto group-hover:underline">View details →</span>
                  )}
                  {!act.url && (
                    <span className="text-xs text-zinc-400 ml-auto group-hover:text-zinc-600 dark:group-hover:text-zinc-200">View details →</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && <DetailModal act={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
