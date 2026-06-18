'use client'

import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/components/providers/AuthProvider'

interface SectionReorderModalProps {
  order: string[]
  labels: Record<string, string>
  onClose: () => void
  onReordered: (order: string[]) => void
}

export default function SectionReorderModal({ order, labels, onClose, onReordered }: SectionReorderModalProps) {
  const { csrfToken } = useAuth()

  async function persist(next: string[]) {
    onReordered(next)
    try {
      const res = await fetch('/api/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ section_order: next.join(',') }),
      })
      const d = await res.json()
      if (!d.success) toast.error('Failed to save order')
    } catch {
      toast.error('Network error')
    }
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination || result.source.index === result.destination.index) return
    const next = Array.from(order)
    const [moved] = next.splice(result.source.index, 1)
    next.splice(result.destination.index, 0, moved)
    persist(next)
  }

  return (
    <Modal open onClose={onClose} title="Reorder Sections" size="md">
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Drag to change the order sections appear on your page. Saved automatically.
      </p>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="section-order">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {order.map((key, i) => (
                <Draggable key={key} draggableId={key} index={i}>
                  {(drag, snap) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`card p-3 flex items-center gap-3 ${snap.isDragging ? 'shadow-xl border-brand-400' : ''}`}
                    >
                      <div
                        {...drag.dragHandleProps}
                        className="cursor-grab text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 shrink-0"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {labels[key] ?? key}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono shrink-0">{i + 1}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </Modal>
  )
}
