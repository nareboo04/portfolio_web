'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/providers/AuthProvider'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import type { Message, PaginatedResponse } from '@/types'

interface MessageCenterProps {
  open: boolean
  onClose: () => void
}

export default function MessageCenter({ open, onClose }: MessageCenterProps) {
  const { csrfToken } = useAuth()
  const [data, setData]       = useState<PaginatedResponse<Message> | null>(null)
  const [page, setPage]       = useState(1)
  const [selected, setSelected] = useState<Message | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/messages?page=${p}&pageSize=15`)
      const d = await res.json()
      if (d.success) { setData(d.data); setPage(p) }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (open) load(1) }, [open, load])

  async function markRead(id: number) {
    await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    setData((prev) => prev ? {
      ...prev,
      items: prev.items.map((m) => m.id === id ? { ...m, read: true } : m),
    } : prev)
  }

  async function deleteMsg(id: number) {
    const res = await fetch(`/api/messages/${id}`, {
      method: 'DELETE',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    const d = await res.json()
    if (d.success) {
      toast.success('Message deleted')
      setSelected(null)
      load(page)
    } else {
      toast.error('Delete failed')
    }
  }

  function openMessage(msg: Message) {
    setSelected(msg)
    if (!msg.read) markRead(msg.id)
  }

  return (
    <Modal open={open} onClose={onClose} title="Message Centre" size="xl">
      <div className="flex gap-4 h-[60vh]">
        {/* List */}
        <div className="w-56 shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 pr-4 overflow-y-auto">
          {loading && <p className="text-xs text-zinc-400 py-4 text-center">Loading…</p>}
          {!loading && data?.items.length === 0 && (
            <p className="text-xs text-zinc-400 py-4 text-center">No messages yet.</p>
          )}
          {data?.items.map((msg) => (
            <button
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={cn(
                'text-left px-3 py-2.5 rounded-xl mb-1 transition-colors text-sm',
                selected?.id === msg.id
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
              )}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {!msg.read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                <span className={cn('font-medium truncate', !msg.read && 'font-semibold')}>{msg.name}</span>
              </div>
              <p className="text-xs text-zinc-400 truncate">{msg.subject}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {new Date(msg.created_at).toLocaleDateString()}
              </p>
            </button>
          ))}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-between mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className="text-xs text-zinc-500 hover:text-brand-600 disabled:opacity-30"
              >← Prev</button>
              <span className="text-xs text-zinc-400">{page}/{data.totalPages}</span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => load(page + 1)}
                className="text-xs text-zinc-500 hover:text-brand-600 disabled:opacity-30"
              >Next →</button>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{selected.subject}</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    From: <span className="text-brand-600 dark:text-brand-400">{selected.name}</span>{' '}
                    &lt;{selected.email}&gt;
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => { if (confirm('Delete this message?')) deleteMsg(selected.id) }}
                  className="btn-danger text-xs shrink-0"
                >
                  Delete
                </button>
              </div>
              <div className="card p-4">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {selected.body}
                </p>
              </div>
              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                className="btn-primary text-sm"
              >
                Reply via Email
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
              Select a message to read it
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
