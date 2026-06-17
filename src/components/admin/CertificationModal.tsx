'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Certification } from '@/types'

interface CertificationModalProps {
  cert?: Certification | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY = {
  title:          '',
  issuer:         '',
  issue_date:     '',
  expiry_date:    '',
  description:    '',
  credential_url: '',
  pdf_url:        null as string | null,
  image_url:      null as string | null,
}

export default function CertificationModal({ cert, onClose, onSaved }: CertificationModalProps) {
  const { csrfToken } = useAuth()
  const [form, setForm]           = useState({ ...EMPTY })
  const [saving, setSaving]       = useState(false)
  const [pdfUploading, setPdfUploading]   = useState(false)
  const [imgUploading, setImgUploading]   = useState(false)

  useEffect(() => {
    if (cert) {
      setForm({
        title:          cert.title,
        issuer:         cert.issuer,
        issue_date:     cert.issue_date?.slice(0, 10) ?? '',
        expiry_date:    cert.expiry_date?.slice(0, 10) ?? '',
        description:    cert.description ?? '',
        credential_url: cert.credential_url ?? '',
        pdf_url:        cert.pdf_url ?? null,
        image_url:      cert.image_url ?? null,
      })
    } else {
      setForm({ ...EMPTY })
    }
  }, [cert])

  async function uploadFile(file: File, field: 'pdf_url' | 'image_url') {
    const setLoading = field === 'pdf_url' ? setPdfUploading : setImgUploading
    setLoading(true)
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
        setForm((p) => ({ ...p, [field]: data.data.urls[0] }))
        toast.success('Uploaded')
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim() || !form.issuer.trim() || !form.issue_date) {
      toast.error('Title, issuer, and issue date are required')
      return
    }
    setSaving(true)
    try {
      const url    = cert ? `/api/certifications/${cert.id}` : '/api/certifications'
      const method = cert ? 'PUT' : 'POST'
      const payload = {
        ...form,
        expiry_date:    form.expiry_date    || null,
        description:    form.description    || null,
        credential_url: form.credential_url || null,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(cert ? 'Updated' : 'Created')
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
    <Modal open onClose={onClose} title={cert ? 'Edit Certification' : 'New Certification'} size="lg">
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. AWS Solutions Architect" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Issuer *</label>
            <input className="input" value={form.issuer} onChange={(e) => setForm((p) => ({ ...p, issuer: e.target.value }))} placeholder="e.g. Amazon Web Services" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Issue Date *</label>
            <input type="date" className="input" value={form.issue_date} onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Expiry Date</label>
            <input type="date" className="input" value={form.expiry_date} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Credential URL</label>
          <input className="input" value={form.credential_url} onChange={(e) => setForm((p) => ({ ...p, credential_url: e.target.value }))} placeholder="https://…" />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
          <textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short note about this certification…" />
        </div>

        {/* PDF */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">PDF Certificate</label>
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
              <span className="text-xs text-zinc-500">{pdfUploading ? 'Uploading…' : 'Upload PDF'}</span>
              <input type="file" accept="application/pdf" className="hidden" disabled={pdfUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'pdf_url'); e.target.value = '' }} />
            </label>
          )}
        </div>

        {/* Image preview */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Badge / Image</label>
          {form.image_url ? (
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.image_url} alt="badge" className="w-10 h-10 object-contain rounded" />
              <span className="text-xs text-zinc-600 dark:text-zinc-300 flex-1 truncate">{form.image_url.split('/').pop()}</span>
              <button onClick={() => setForm((p) => ({ ...p, image_url: null }))} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-brand-400 cursor-pointer transition-colors">
              <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
              <span className="text-xs text-zinc-500">{imgUploading ? 'Uploading…' : 'Upload badge image'}</span>
              <input type="file" accept="image/*" className="hidden" disabled={imgUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'image_url'); e.target.value = '' }} />
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : cert ? 'Update' : 'Add Certification'}
        </button>
      </div>
    </Modal>
  )
}
