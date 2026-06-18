'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'
import { cn } from '@/lib/cn'
import InlineEditor from '@/components/admin/InlineEditor'
import ExpandableText from '@/components/ui/ExpandableText'
import type { Certification, SiteContent } from '@/types'

interface CertificationsProps {
  certs: Certification[]
  isEditMode?: boolean
  onEdit?: (c: Certification) => void
  onDelete?: (id: number) => void
  onAdd?: () => void
  onReordered?: (items: Certification[]) => void
  content?: SiteContent
  onContentChange?: (key: string, value: string) => void
  csrfToken?: string | null
}

function formatDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const STATUS_BADGE: Record<string, string> = {
  draft:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  private: 'bg-zinc-200  dark:bg-zinc-700      text-zinc-500  dark:text-zinc-400',
}

export default function Certifications({ certs, isEditMode, onEdit, onDelete, onAdd, onReordered, content, onContentChange, csrfToken }: CertificationsProps) {
  const [saving, setSaving] = useState(false)

  if (!isEditMode && certs.length === 0) return null

  async function onDragEnd(result: DropResult) {
    if (!result.destination || result.source.index === result.destination.index) return

    const reordered = Array.from(certs)
    const [moved]   = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)

    onReordered?.(reordered)
    setSaving(true)
    try {
      const res = await fetch('/api/certifications/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ order: reordered.map((c) => c.id) }),
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
    <section id="certifications" className="py-24 bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="section-container">
        <InlineEditor value={content?.certifications_label ?? "What I've Earned"} fieldKey="certifications_label" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="text-brand-500 font-mono font-medium mb-2" />
        <div className="flex flex-wrap items-end gap-4 mb-2">
          <InlineEditor value={content?.certifications_heading ?? 'Certifications & Achievements'} fieldKey="certifications_heading" enabled={!!isEditMode} onChange={onContentChange} tag="h2" className="section-heading" />
          {isEditMode && (
            <div className="ml-auto flex items-center gap-3">
              {saving && <span className="text-xs text-zinc-400 animate-pulse">Saving order…</span>}
              <button onClick={onAdd} className="btn-primary text-sm pb-1">+ Add</button>
            </div>
          )}
        </div>
        <InlineEditor value={content?.certifications_subheading ?? "Certifications and credentials I've obtained."} fieldKey="certifications_subheading" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="section-subheading mb-10" multiline />

        {isEditMode ? (
          /* ── Edit mode: vertical draggable list ── */
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="certifications">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {certs.map((cert, i) => (
                    <Draggable key={cert.id} draggableId={String(cert.id)} index={i}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`card p-3 flex items-center gap-3 ${snapshot.isDragging ? 'shadow-xl border-brand-400' : ''}`}
                        >
                          <div {...drag.dragHandleProps}><DragHandle /></div>
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            {cert.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cert.image_url} alt={cert.issuer} className="w-full h-full object-contain" />
                            ) : (
                              <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                              </svg>
                            )}
                          </div>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{cert.title}</span>
                            <span className="block text-xs text-zinc-400 truncate">{cert.issuer} · {formatDate(cert.issue_date)}</span>
                          </span>
                          {cert.status !== 'public' && (
                            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0', STATUS_BADGE[cert.status])}>
                              {cert.status === 'draft' ? 'Draft' : 'Private'}
                            </span>
                          )}
                          <button onClick={() => onEdit?.(cert)} className="btn-secondary text-xs px-2 py-1 shrink-0">Edit</button>
                          <button onClick={() => onDelete?.(cert.id)} className="text-xs px-2 py-1 rounded-lg text-red-600 border border-zinc-200 dark:border-zinc-700 hover:border-red-400 bg-white dark:bg-zinc-800 shrink-0">Del</button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {certs.length === 0 && (
                    <div className="text-center py-12 text-zinc-400">No certifications yet. Click &ldquo;+ Add&rdquo; to add one.</div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          /* ── View mode: card grid ── */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {certs.map((cert) => (
              <div key={cert.id} className="card p-5 flex gap-4 hover:border-brand-400 dark:hover:border-brand-600 transition-colors">
                {/* Badge / icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  {cert.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cert.image_url} alt={cert.issuer} className="w-full h-full object-contain" />
                  ) : (
                    <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-sm leading-snug mb-0.5 truncate">{cert.title}</h3>
                  <p className="text-brand-600 dark:text-brand-400 text-xs font-medium mb-1">{cert.issuer}</p>
                  <p className="text-zinc-400 text-xs">
                    {formatDate(cert.issue_date)}
                    {cert.expiry_date && ` — ${formatDate(cert.expiry_date)}`}
                  </p>
                  {cert.description && (
                    <ExpandableText
                      text={cert.description}
                      lines={2}
                      className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed"
                    />
                  )}

                  <div className={cn('flex gap-3 mt-2', !cert.credential_url && !cert.pdf_url && 'hidden')}>
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Verify
                      </a>
                    )}
                    {cert.pdf_url && (
                      <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
