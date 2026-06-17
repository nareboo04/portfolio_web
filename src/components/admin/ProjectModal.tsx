'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import DropZone from '@/components/ui/DropZone'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/cn'
import type { Project } from '@/types'

interface ProjectModalProps {
  project?: Project | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
  title: '', slug: '', summary: '', description: '', category: 'web',
  tags: [], images: [], live_url: '', repo_url: '', pdf_url: null, featured: false, status: 'draft', sort_order: 0,
}

export default function ProjectModal({ project, onClose, onSaved }: ProjectModalProps) {
  const { csrfToken } = useAuth()
  const [form, setForm]         = useState({ ...EMPTY })
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading]     = useState(false)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    if (project) {
      setForm({
        title:       project.title,
        slug:        project.slug,
        summary:     project.summary,
        description: project.description ?? '',
        category:    project.category,
        tags:        project.tags,
        images:      project.images,
        live_url:    project.live_url ?? '',
        repo_url:    project.repo_url ?? '',
        pdf_url:     project.pdf_url ?? null,
        featured:    project.featured,
        status:      project.status ?? 'public',
        sort_order:  project.sort_order,
      })
    } else {
      setForm({ ...EMPTY })
    }
  }, [project])

  async function uploadFiles(files: File[]) {
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach((f) => fd.append('files', f))
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        body: fd,
      })
      const data = await res.json()
      if (data.success) {
        setForm((p) => ({ ...p, images: [...p.images, ...data.data.urls] }))
        toast.success(`${data.data.urls.length} image(s) uploaded`)
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

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
    if (!form.title.trim() || !form.summary.trim()) {
      toast.error('Title and summary are required')
      return
    }
    setSaving(true)
    try {
      const url    = project ? `/api/projects/${project.id}` : '/api/projects'
      const method = project ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(project ? 'Project updated' : 'Project created')
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

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setForm((p) => ({ ...p, tags: [...p.tags, tag] }))
    }
    setTagInput('')
  }

  return (
    <Modal open onClose={onClose} title={project ? 'Edit Project' : 'New Project'} size="xl">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Title + Category */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Project title" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Category *</label>
            <input className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="web, mobile, cli…" />
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Summary *</label>
          <textarea
            rows={2}
            className="input resize-none"
            value={form.summary}
            onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
            placeholder="One-line description"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description (HTML allowed)</label>
          <textarea
            rows={4}
            className="input resize-none font-mono text-xs"
            value={form.description ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="<p>Detailed description…</p>"
          />
        </div>

        {/* URLs */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Live URL</label>
            <input className="input" value={form.live_url ?? ''} onChange={(e) => setForm((p) => ({ ...p, live_url: e.target.value }))} placeholder="https://…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Repo URL</label>
            <input className="input" value={form.repo_url ?? ''} onChange={(e) => setForm((p) => ({ ...p, repo_url: e.target.value }))} placeholder="https://github.com/…" />
          </div>
        </div>

        {/* PDF Certificate */}
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
            <label className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
              pdfUploading ? 'border-zinc-300 opacity-50' : 'border-zinc-300 dark:border-zinc-600 hover:border-brand-400')}>
              <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
              <span className="text-xs text-zinc-500">{pdfUploading ? 'Uploading…' : 'Upload PDF certificate'}</span>
              <input type="file" accept="application/pdf" className="hidden" disabled={pdfUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.target.value = '' }} />
            </label>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              className="input flex-1"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Add tag and press Enter"
            />
            <button onClick={addTag} className="btn-secondary px-3">Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map((tag) => (
              <span key={tag} className="tag flex items-center gap-1">
                {tag}
                <button
                  onClick={() => setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }))}
                  className="ml-0.5 hover:text-red-500 transition-colors"
                >×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Images</label>
          <DropZone onFiles={uploadFiles} disabled={uploading} />
          {uploading && <p className="text-xs text-zinc-400 mt-2 animate-pulse">Uploading &amp; converting to WebP…</p>}
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.images.map((src, i) => (
                <div key={src} className="relative w-20 h-16 rounded-lg overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status + Featured row */}
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Visibility</label>
            <div className="flex gap-2">
              {(['public', 'draft', 'private'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, status: s }))}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize',
                    form.status === s
                      ? s === 'public'   ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                      : s === 'draft'    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      :                    'bg-zinc-200  dark:bg-zinc-700      text-zinc-600  dark:text-zinc-300  border-zinc-400  dark:border-zinc-600'
                      : 'bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400',
                  )}
                >
                  {s === 'public' ? '🌐 Public' : s === 'draft' ? '✏️ Draft' : '🔒 Private'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-5">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Featured</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : project ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </Modal>
  )
}
