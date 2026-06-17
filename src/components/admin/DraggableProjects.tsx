'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Project } from '@/types'

interface DraggableProjectsProps {
  projects: Project[]
  onReordered: (projects: Project[]) => void
  onEdit: (project: Project) => void
  onDelete: (id: number) => void
}

export default function DraggableProjects({
  projects,
  onReordered,
  onEdit,
  onDelete,
}: DraggableProjectsProps) {
  const { csrfToken } = useAuth()
  const [items, setItems] = useState(projects)
  const [saving, setSaving] = useState(false)

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return

    const reordered = Array.from(items)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    setItems(reordered)

    setSaving(true)
    try {
      const res = await fetch('/api/projects/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ order: reordered.map((p) => p.id) }),
      })
      const d = await res.json()
      if (d.success) {
        onReordered(reordered)
        toast.success('Order saved')
      } else {
        toast.error('Reorder failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Drag to reorder projects</h3>
        {saving && <span className="text-xs text-zinc-400 animate-pulse">Saving…</span>}
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="projects">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {items.map((p, i) => (
                <Draggable key={p.id} draggableId={String(p.id)} index={i}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`card p-3 flex items-center gap-3 ${snapshot.isDragging ? 'shadow-xl border-brand-400' : ''}`}
                    >
                      <div {...drag.dragHandleProps} className="cursor-grab text-zinc-400 hover:text-zinc-600 shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{p.title}</span>
                      <span className="text-xs text-zinc-400">{p.category}</span>
                      <button onClick={() => onEdit(p)} className="btn-secondary text-xs px-2 py-1">Edit</button>
                      <button
                        onClick={() => { if (confirm(`Delete "${p.title}"?`)) onDelete(p.id) }}
                        className="btn-danger text-xs px-2 py-1"
                      >
                        Del
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
