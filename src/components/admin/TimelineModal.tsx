'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TimelineEntry } from '@/types'

interface TimelineModalProps {
  entry?: TimelineEntry | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY = {
  type:         'experience' as TimelineEntry['type'],
  title:        '',
  organization: '',
  location:     '',
  start_date:   '',
  end_date:     '',
  current:      false,
  description:  '',
  pdf_url:      null as string | null,
}

export default function TimelineModal({ entry, onClose, onSaved }: TimelineModalProps) {
  const { csrfToken } = useAuth()
  const [form, setForm]           = useState({ ...EMPTY })
  const [saving, setSaving]       = useState(false)
  const [pdfUploading, setPdfUploading] = useState(false)

  useEffect(() => {
    if (entry) {
      setForm({
        type:         entry.type,
        title:        entry.title,
        organization: entry.organization,
        location:     entry.location ?? '',
        start_date:   entry.start_date?.slice(0, 10) ?? '',
        end_date:     entry.end_date?.slice(0, 10) ?? '',
        current:      entry.current,
        description:  entry.description ?? '',
        pdf_url:      entry.pdf_url ?? null,
      })
    } else {
      setForm({ ...EMPTY })
    }
  }, [entry])

  async function uploadPdf(file: File) {
    setPdfUploading(true)
    try {
      const fd = new FormData()
      fd.append('files', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        body: fd,
      })
      const data = await res.json()
      if (data.success) {
        setForm((p) => ({ ...p, pdf_url: data.data.urls[0] }))
        toast.success('PDF uploaded')
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setPdfUploading(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim() || !form.organization.trim() || !form.start_date) {
      toast.error('Title, organization, and start date are required')
      return
    }
    setSaving(true)
    try {
      const url    = entry ? `/api/timeline/${entry.id}` : '/api/timeline'
      const method = entry ? 'PUT' : 'POST'
      const payload = {
        ...form,
        location:    form.location    || null,
        end_date:    form.current ? null : (form.end_date || null),
        description: form.description || null,
        pdf_url:     form.pdf_url     || null,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(entry ? 'Entry updated' : 'Entry created')
        onSaved()
        onClose()
      } else {
        toast.error(data.error || 'Save failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={entry ? 'Edit Timeline Entry' : 'New Timeline Entry'} size="lg">
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Type *</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as TimelineEntry['type'] }))}
            >
              <option value="experience">Experience</option>
              <option value="education">Education</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Senior Developer"
              autoFocus
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Organization *</label>
            <input
              className="input"
              value={form.organization}
              onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Remote"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Start Date *</label>
            <input
              type="date"
              className="input"
              value={form.start_date}
              onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">End Date</label>
            <input
              type="date"
              className="input"
              value={form.end_date}
              onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              disabled={form.current}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.current}
            onChange={(e) => setForm((p) => ({ ...p, current: e.target.checked, end_date: e.target.checked ? '' : p.end_date }))}
            className="w-4 h-4 accent-brand-600"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Currently here</span>
        </label>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
          <textarea
            rows={3}
            className="input resize-none"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Brief description of your role or studies…"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Certificate / PDF</label>
          {form.pdf_url ? (
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 flex-1 truncate">{form.pdf_url.split('/').pop()}</span>
              <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">View</a>
              <button onClick={() => setForm((p) => ({ ...p, pdf_url: null }))} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-brand-400 cursor-pointer transition-colors">
              <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
              <span className="text-xs text-zinc-500">{pdfUploading ? 'Uploading…' : 'Upload PDF certificate'}</span>
              <input type="file" accept="application/pdf" className="hidden" disabled={pdfUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.target.value = '' }} />
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : entry ? 'Update Entry' : 'Add Entry'}
        </button>
      </div>
    </Modal>
  )
}
