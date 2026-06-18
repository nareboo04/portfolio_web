'use client'

import { useState, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import InlineEditor from '@/components/admin/InlineEditor'
import type { LabSection, SiteContent } from '@/types'

interface InfrastructureProps {
  sections: LabSection[]
  onSectionsChange?: (sections: LabSection[]) => void
  isEditMode?: boolean
  content?: SiteContent
  onContentChange?: (key: string, value: string) => void
  csrfToken?: string | null
}

// ── Section detail modal (like ProjectDetailModal) ───────────────────────────
function SectionDetailModal({ section, onClose }: { section: LabSection; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0)

  return (
    <Modal open onClose={onClose} title={section.name} size="xl">
      {section.image_urls.length > 0 && (
        <div className="mb-5">
          <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-2 max-h-[55vh] overflow-y-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={section.image_urls[imgIdx]} alt={section.name} className="w-full h-auto block" />
          </div>
          {section.image_urls.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {section.image_urls.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setImgIdx(i)}
                  className={`relative h-14 w-20 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${i === imgIdx ? 'border-brand-500' : 'border-transparent'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {section.description && (
        <p className="text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed whitespace-pre-line">
          {section.description}
        </p>
      )}

      {section.items.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Items</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {section.items.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}

// ── Inline-rename text input ──────────────────────────────────────────────────
function EditableText({
  value,
  onCommit,
  className,
}: {
  value: string
  onCommit: (next: string) => Promise<void>
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  async function commit() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === value) { setEditing(false); setDraft(value); return }
    await onCommit(trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setEditing(false); setDraft(value) }
        }}
        className={`bg-transparent border-b border-brand-400 outline-none ${className ?? ''}`}
      />
    )
  }

  return (
    <span
      title="Click to rename"
      onClick={() => setEditing(true)}
      className={`cursor-text hover:text-brand-500 transition-colors ${className ?? ''}`}
    >
      {value}
    </span>
  )
}

const DragHandle = () => (
  <div className="cursor-grab text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 shrink-0 pr-1 pt-0.5">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  </div>
)

export default function Infrastructure({
  sections,
  onSectionsChange,
  isEditMode,
  content,
  onContentChange,
  csrfToken,
}: InfrastructureProps) {
  const [addingSection,   setAddingSection]   = useState(false)
  const [newSectionName,  setNewSectionName]  = useState('')
  const [addingItemTo,    setAddingItemTo]    = useState<number | null>(null)
  const [newItemName,     setNewItemName]     = useState('')
  const [savingOrder,     setSavingOrder]     = useState(false)
  const [descDrafts,      setDescDrafts]      = useState<Record<number, string>>({})
  const [uploadingFor,    setUploadingFor]    = useState<number | null>(null)
  const [selectedSection, setSelectedSection] = useState<LabSection | null>(null)

  if (!isEditMode && sections.length === 0) return null

  const jsonHeaders = (csrf: string | null | undefined) => ({
    'Content-Type': 'application/json',
    ...(csrf ? { 'x-csrf-token': csrf } : {}),
  })

  function getDescDraft(id: number): string {
    return descDrafts[id] !== undefined
      ? descDrafts[id]
      : (sections.find((s) => s.id === id)?.description ?? '')
  }

  // ── Drag end ──────────────────────────────────────────────────────────────
  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const { source, destination, type } = result

    if (type === 'SECTION') {
      if (source.index === destination.index) return
      const next = Array.from(sections)
      const [moved] = next.splice(source.index, 1)
      next.splice(destination.index, 0, moved)
      onSectionsChange?.(next)
      setSavingOrder(true)
      try {
        const res = await fetch('/api/lab/sections/reorder', {
          method: 'POST',
          headers: jsonHeaders(csrfToken),
          body: JSON.stringify({ order: next.map((s) => s.id) }),
        })
        const d = await res.json()
        if (!d.success) toast.error('Section reorder failed')
      } catch { toast.error('Network error') }
      finally { setSavingOrder(false) }
      return
    }

    if (type === 'ITEM') {
      if (source.droppableId !== destination.droppableId) return
      if (source.index === destination.index) return
      const sectionId = parseInt(source.droppableId.replace('items-', ''))
      const next = sections.map((s) => {
        if (s.id !== sectionId) return s
        const items = Array.from(s.items)
        const [moved] = items.splice(source.index, 1)
        items.splice(destination.index, 0, moved)
        return { ...s, items }
      })
      onSectionsChange?.(next)
      setSavingOrder(true)
      try {
        const section = next.find((s) => s.id === sectionId)!
        const res = await fetch(`/api/lab/sections/${sectionId}/items/reorder`, {
          method: 'POST',
          headers: jsonHeaders(csrfToken),
          body: JSON.stringify({ order: section.items.map((i) => i.id) }),
        })
        const d = await res.json()
        if (!d.success) toast.error('Item reorder failed')
      } catch { toast.error('Network error') }
      finally { setSavingOrder(false) }
    }
  }

  // ── Section CRUD ──────────────────────────────────────────────────────────
  async function addSection() {
    const name = newSectionName.trim()
    if (!name) return
    try {
      const res = await fetch('/api/lab/sections', {
        method: 'POST',
        headers: jsonHeaders(csrfToken),
        body: JSON.stringify({ name }),
      })
      const d = await res.json()
      if (d.success) {
        onSectionsChange?.([...sections, d.data])
        setNewSectionName('')
        setAddingSection(false)
      } else toast.error(d.error ?? 'Failed to create section')
    } catch { toast.error('Network error') }
  }

  async function renameSection(id: number, name: string) {
    const res = await fetch(`/api/lab/sections/${id}`, {
      method: 'PATCH',
      headers: jsonHeaders(csrfToken),
      body: JSON.stringify({ name }),
    })
    const d = await res.json()
    if (d.success) {
      onSectionsChange?.(sections.map((s) => s.id === id ? { ...s, name } : s))
    } else { toast.error(d.error ?? 'Rename failed'); throw new Error(d.error) }
  }

  async function deleteSection(id: number) {
    if (!confirm('Delete this section and all its items?')) return
    const res = await fetch(`/api/lab/sections/${id}`, {
      method: 'DELETE',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    const d = await res.json()
    if (d.success) {
      onSectionsChange?.(sections.filter((s) => s.id !== id))
      toast.success('Section deleted')
    } else toast.error(d.error ?? 'Delete failed')
  }

  async function saveDescription(sectionId: number) {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    const draft   = descDrafts[sectionId] !== undefined ? descDrafts[sectionId] : (section.description ?? '')
    const trimmed = draft.trim()
    if (trimmed === (section.description ?? '')) return
    try {
      const res = await fetch(`/api/lab/sections/${sectionId}`, {
        method: 'PATCH',
        headers: jsonHeaders(csrfToken),
        body: JSON.stringify({ description: trimmed || null }),
      })
      const d = await res.json()
      if (d.success) {
        onSectionsChange?.(sections.map((s) =>
          s.id === sectionId ? { ...s, description: trimmed || null } : s,
        ))
      } else toast.error(d.error ?? 'Failed to save description')
    } catch { toast.error('Network error') }
  }

  async function uploadImages(sectionId: number, files: File[]) {
    setUploadingFor(sectionId)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('files', file)
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
          body: fd,
        })
        const d = await res.json()
        if (d.success && d.data?.urls?.[0]) {
          uploaded.push(d.data.urls[0])
        } else {
          toast.error(`Failed to upload ${file.name}`)
        }
      }
      if (uploaded.length === 0) return

      const section = sections.find((s) => s.id === sectionId)
      if (!section) return
      const newUrls = [...section.image_urls, ...uploaded]
      const res = await fetch(`/api/lab/sections/${sectionId}`, {
        method: 'PATCH',
        headers: jsonHeaders(csrfToken),
        body: JSON.stringify({ image_urls: newUrls }),
      })
      const d = await res.json()
      if (d.success) {
        onSectionsChange?.(sections.map((s) =>
          s.id === sectionId ? { ...s, image_urls: newUrls } : s,
        ))
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`)
      } else {
        toast.error('Failed to save images')
      }
    } catch { toast.error('Network error') }
    finally { setUploadingFor(null) }
  }

  async function saveStatus(sectionId: number, status: LabSection['status']) {
    try {
      const res = await fetch(`/api/lab/sections/${sectionId}`, {
        method: 'PATCH',
        headers: jsonHeaders(csrfToken),
        body: JSON.stringify({ status }),
      })
      const d = await res.json()
      if (d.success) {
        onSectionsChange?.(sections.map((s) => s.id === sectionId ? { ...s, status } : s))
      } else toast.error(d.error ?? 'Failed to update status')
    } catch { toast.error('Network error') }
  }

  async function removeImage(sectionId: number, url: string) {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    const newUrls = section.image_urls.filter((u) => u !== url)
    try {
      const res = await fetch(`/api/lab/sections/${sectionId}`, {
        method: 'PATCH',
        headers: jsonHeaders(csrfToken),
        body: JSON.stringify({ image_urls: newUrls }),
      })
      const d = await res.json()
      if (d.success) {
        onSectionsChange?.(sections.map((s) =>
          s.id === sectionId ? { ...s, image_urls: newUrls } : s,
        ))
      } else toast.error(d.error ?? 'Failed to remove image')
    } catch { toast.error('Network error') }
  }

  // ── Item CRUD ─────────────────────────────────────────────────────────────
  async function addItem(sectionId: number) {
    const name = newItemName.trim()
    if (!name) return
    try {
      const res = await fetch(`/api/lab/sections/${sectionId}/items`, {
        method: 'POST',
        headers: jsonHeaders(csrfToken),
        body: JSON.stringify({ name }),
      })
      const d = await res.json()
      if (d.success) {
        onSectionsChange?.(sections.map((s) =>
          s.id === sectionId ? { ...s, items: [...s.items, d.data] } : s,
        ))
        setNewItemName('')
        setAddingItemTo(null)
      } else toast.error(d.error ?? 'Failed to add item')
    } catch { toast.error('Network error') }
  }

  async function renameItem(id: number, sectionId: number, name: string) {
    const res = await fetch(`/api/lab/items/${id}`, {
      method: 'PATCH',
      headers: jsonHeaders(csrfToken),
      body: JSON.stringify({ name }),
    })
    const d = await res.json()
    if (d.success) {
      onSectionsChange?.(sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((i) => i.id === id ? { ...i, name } : i) }
          : s,
      ))
    } else { toast.error(d.error ?? 'Rename failed'); throw new Error(d.error) }
  }

  async function deleteItem(id: number, sectionId: number) {
    const res = await fetch(`/api/lab/items/${id}`, {
      method: 'DELETE',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    const d = await res.json()
    if (d.success) {
      onSectionsChange?.(sections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== id) } : s,
      ))
    } else toast.error(d.error ?? 'Delete failed')
  }

  return (
    <>
      <section id="infrastructure" className="py-24 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="section-container">
          <InlineEditor
            value={content?.lab_label ?? 'My Setup'}
            fieldKey="lab_label"
            enabled={!!isEditMode}
            onChange={onContentChange}
            tag="p"
            className="text-brand-500 font-mono font-medium mb-2"
          />
          <div className="flex flex-wrap items-end gap-4 mb-2">
            <InlineEditor
              value={content?.lab_heading ?? 'Infrastructure & Lab'}
              fieldKey="lab_heading"
              enabled={!!isEditMode}
              onChange={onContentChange}
              tag="h2"
              className="section-heading"
            />
            {isEditMode && (
              <div className="ml-auto flex items-center gap-3">
                {savingOrder && <span className="text-xs text-zinc-400 animate-pulse">Saving…</span>}
                <button
                  onClick={() => { setAddingSection(true); setNewSectionName('') }}
                  className="btn-primary text-sm"
                >
                  + Add Section
                </button>
              </div>
            )}
          </div>
          <InlineEditor
            value={content?.lab_subheading ?? 'The tools, hardware, and platforms that power my work.'}
            fieldKey="lab_subheading"
            enabled={!!isEditMode}
            onChange={onContentChange}
            tag="p"
            className="section-subheading mb-10"
            multiline
          />

          {isEditMode ? (
            /* ── Edit mode ─────────────────────────────────────────── */
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections" type="SECTION">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                    {sections.map((section, si) => (
                      <Draggable key={section.id} draggableId={`sec-${section.id}`} index={si}>
                        {(drag, snap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            className={`card p-4 ${snap.isDragging ? 'shadow-xl border-brand-400' : ''}`}
                          >
                            {/* Section header */}
                            <div className="flex items-center gap-2 mb-3">
                              <div {...drag.dragHandleProps}><DragHandle /></div>
                              <EditableText
                                value={section.name}
                                onCommit={(name) => renameSection(section.id, name)}
                                className="font-semibold text-zinc-900 dark:text-white text-sm flex-1"
                              />
                              <select
                                value={section.status}
                                onChange={(e) => saveStatus(section.id, e.target.value as LabSection['status'])}
                                className="text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg px-2 py-1 cursor-pointer shrink-0"
                              >
                                <option value="public">Public</option>
                                <option value="draft">Draft</option>
                                <option value="private">Private</option>
                              </select>
                              <button
                                onClick={() => deleteSection(section.id)}
                                className="text-xs px-2 py-1 rounded-lg text-red-600 border border-zinc-200 dark:border-zinc-700 hover:border-red-400 bg-white dark:bg-zinc-800 shrink-0"
                              >
                                Delete Section
                              </button>
                            </div>

                            {/* Description */}
                            <textarea
                              value={getDescDraft(section.id)}
                              onChange={(e) => setDescDrafts((p) => ({ ...p, [section.id]: e.target.value }))}
                              onBlur={() => saveDescription(section.id)}
                              placeholder="Add a description for this section…"
                              rows={2}
                              className="input text-sm w-full resize-none mb-3"
                            />

                            {/* Images */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {section.image_urls.map((url) => (
                                <div
                                  key={url}
                                  className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
                                >
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  <button
                                    onClick={() => removeImage(section.id, url)}
                                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                                    aria-label="Remove image"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <label
                                className={`flex items-center justify-center w-16 h-16 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 cursor-pointer hover:border-brand-400 transition-colors ${uploadingFor === section.id ? 'opacity-50 pointer-events-none' : ''}`}
                                title="Upload images"
                              >
                                {uploadingFor === section.id ? (
                                  <span className="text-[10px] text-zinc-400 animate-pulse">…</span>
                                ) : (
                                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="sr-only"
                                  disabled={uploadingFor !== null}
                                  onChange={(e) => {
                                    if (e.target.files) uploadImages(section.id, Array.from(e.target.files))
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                            </div>

                            {/* Items */}
                            <Droppable droppableId={`items-${section.id}`} type="ITEM">
                              {(ip) => (
                                <div ref={ip.innerRef} {...ip.droppableProps} className="space-y-1.5 pl-5">
                                  {section.items.map((item, ii) => (
                                    <Draggable key={item.id} draggableId={`item-${item.id}`} index={ii}>
                                      {(id2, snap2) => (
                                        <div
                                          ref={id2.innerRef}
                                          {...id2.draggableProps}
                                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/50 ${snap2.isDragging ? 'shadow border-brand-400' : ''}`}
                                        >
                                          <div {...id2.dragHandleProps}><DragHandle /></div>
                                          <EditableText
                                            value={item.name}
                                            onCommit={(name) => renameItem(item.id, section.id, name)}
                                            className="flex-1 text-sm text-zinc-700 dark:text-zinc-300"
                                          />
                                          <button
                                            onClick={() => deleteItem(item.id, section.id)}
                                            className="text-zinc-400 hover:text-red-500 transition-colors text-base leading-none shrink-0"
                                            aria-label="Delete item"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {ip.placeholder}

                                  {addingItemTo === section.id ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5">
                                      <input
                                        autoFocus
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') addItem(section.id)
                                          if (e.key === 'Escape') { setAddingItemTo(null); setNewItemName('') }
                                        }}
                                        placeholder="Item name…"
                                        className="input py-1 text-sm flex-1"
                                      />
                                      <button onClick={() => addItem(section.id)} className="btn-primary text-xs px-2.5 py-1">Add</button>
                                      <button
                                        onClick={() => { setAddingItemTo(null); setNewItemName('') }}
                                        className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500"
                                      >Cancel</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setAddingItemTo(section.id); setNewItemName('') }}
                                      className="text-xs text-zinc-400 hover:text-brand-500 transition-colors pl-3 py-1"
                                    >
                                      + Add Item
                                    </button>
                                  )}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {sections.length === 0 && (
                      <div className="text-center py-12 text-zinc-400">
                        No sections yet. Click &ldquo;+ Add Section&rdquo; to get started.
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            /* ── View mode ─────────────────────────────────────────── */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section)}
                  className="card overflow-hidden text-left hover:border-brand-400 dark:hover:border-brand-600 transition-all duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {/* Preview image */}
                  {section.image_urls.length > 0 && (
                    <div className="relative overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={section.image_urls[0]}
                        alt=""
                        className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {section.image_urls.length > 1 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V9.75M3 9.75A2.25 2.25 0 015.25 7.5h13.5A2.25 2.25 0 0121 9.75" />
                          </svg>
                          +{section.image_urls.length - 1}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-700/50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {section.name}
                    </h3>
                    {section.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2 whitespace-pre-line">
                        {section.description}
                      </p>
                    )}
                    <ul className="space-y-1.5">
                      {section.items.slice(0, 5).map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                          {item.name}
                        </li>
                      ))}
                      {section.items.length > 5 && (
                        <li className="text-xs text-brand-500 font-medium">+{section.items.length - 5} more…</li>
                      )}
                      {section.items.length === 0 && (
                        <li className="text-sm text-zinc-400 italic">No items</li>
                      )}
                    </ul>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Add-section inline form */}
          {isEditMode && addingSection && (
            <div className="mt-4 flex items-center gap-3">
              <input
                autoFocus
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addSection()
                  if (e.key === 'Escape') { setAddingSection(false); setNewSectionName('') }
                }}
                placeholder="Section name…"
                className="input py-2 text-sm flex-1 max-w-xs"
              />
              <button onClick={addSection} className="btn-primary text-sm">Add</button>
              <button
                onClick={() => { setAddingSection(false); setNewSectionName('') }}
                className="text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500"
              >Cancel</button>
            </div>
          )}
        </div>
      </section>

      {selectedSection && (
        <SectionDetailModal
          section={selectedSection}
          onClose={() => setSelectedSection(null)}
        />
      )}
    </>
  )
}
