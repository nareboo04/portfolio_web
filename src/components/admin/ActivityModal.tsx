'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Activity } from '@/types'

interface ActivityModalProps {
  activity?: Activity | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY = {
  type:         'other' as Activity['type'],
  title:        '',
  organization: '',
  description:  '',
  date:         '',
  url:          '',
  image_url:    null as string | null,
}

export default function ActivityModal({ activity, onClose, onSaved }: ActivityModalProps) {
  const { csrfToken } = useAuth()
  const [form, setForm]         = useState({ ...EMPTY })
  const [saving, setSaving]     = useState(false)
  const [imgUploading, setImgUploading] = useState(false)

  useEffect(() => {
    if (activity) {
      setForm({
        type:         activity.type,
        title:        activity.title,
        organization: activity.organization ?? '',
        description:  activity.description  ?? '',
        date:         activity.date?.slice(0, 10) ?? '',
        url:          activity.url ?? '',
        image_url:    activity.image_url ?? null,
      })
    } else {
      setForm({ ...EMPTY })
    }
  }, [activity])

  async function uploadImage(file: File) {
    setImgUploading(true)
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
        setForm((p) => ({ ...p, image_url: data.data.urls[0] }))
        toast.success('Uploaded')
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setImgUploading(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const url    = activity ? `/api/activities/${activity.id}` : '/api/activities'
      const method = activity ? 'PUT' : 'POST'
      const payload = {
        ...form,
        organization: form.organization || null,
        description:  form.description  || null,
        date:         form.date         || null,
        url:          form.url          || null,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(activity ? 'Updated' : 'Created')
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
    <Modal open onClose={onClose} title={activity ? 'Edit Activity' : 'New Activity'} size="lg">
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Activity['type'] }))}>
              <option value="volunteer">Volunteer</option>
              <option value="award">Award</option>
              <option value="publication">Publication</option>
              <option value="project">Project</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Activity title" autoFocus />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Organization</label>
            <input className="input" value={form.organization} onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))} placeholder="e.g. IEEE, Local NGO" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
          <textarea rows={3} className="input resize-none" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description…" />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">URL</label>
          <input className="input" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://…" />
        </div>

        {/* Image */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Image (shown in detail view)</label>
          {form.image_url ? (
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.image_url} alt="preview" className="w-12 h-12 object-cover rounded" />
              <span className="text-xs text-zinc-600 dark:text-zinc-300 flex-1 truncate">{form.image_url.split('/').pop()}</span>
              <button onClick={() => setForm((p) => ({ ...p, image_url: null }))} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-brand-400 cursor-pointer transition-colors">
              <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
              <span className="text-xs text-zinc-500">{imgUploading ? 'Uploading…' : 'Upload image'}</span>
              <input type="file" accept="image/*" className="hidden" disabled={imgUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = '' }} />
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : activity ? 'Update' : 'Add Activity'}
        </button>
      </div>
    </Modal>
  )
}
