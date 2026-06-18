'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Skill } from '@/types'

interface SkillModalProps {
  skill?: Skill | null
  onClose: () => void
  onSaved: () => void
}

const CATEGORIES = ['frontend', 'backend', 'database', 'devops', 'other'] as const
const CAT_LABEL: Record<string, string> = {
  frontend: 'Frontend', backend: 'Backend', database: 'Database', devops: 'DevOps', other: 'Other',
}

const EMPTY = { name: '', category: 'other' as Skill['category'], level: 80, icon_url: '', description: '', status: 'public' as Skill['status'] }

export default function SkillModal({ skill, onClose, onSaved }: SkillModalProps) {
  const { csrfToken } = useAuth()
  const [form, setForm]         = useState({ ...EMPTY })
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef            = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setForm(skill ? {
      name:        skill.name,
      category:    skill.category,
      level:       skill.level,
      icon_url:    skill.icon_url    ?? '',
      description: skill.description ?? '',
      status:      skill.status ?? 'public',
    } : { ...EMPTY })
  }, [skill])

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('files', file)
      const res  = await fetch('/api/upload', {
        method: 'POST',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        body: fd,
      })
      const data = await res.json()
      if (data.success && data.data.urls[0]) {
        setForm((p) => ({ ...p, icon_url: data.data.urls[0] }))
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const url    = skill ? `/api/skills/${skill.id}` : '/api/skills'
      const method = skill ? 'PUT' : 'POST'
      const payload = {
        name:        form.name,
        category:    form.category,
        level:       form.level,
        icon_url:    form.icon_url    || null,
        description: form.description || null,
        status:      form.status,
      }
      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(skill ? 'Skill updated' : 'Skill created')
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
    <Modal open onClose={onClose} title={skill ? 'Edit Skill' : 'New Skill'} size="md">
      <div className="space-y-4">
        {/* Name + Category */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. TypeScript"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Category *</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as Skill['category'] }))}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CAT_LABEL[cat]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom icon upload */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Custom Icon (optional)</label>
          <div className="flex items-center gap-3">
            {/* Preview */}
            <div className="w-14 h-14 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 shrink-0 overflow-hidden">
              {form.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.icon_url} alt="icon" className="w-10 h-10 object-contain" />
              ) : (
                <span className="text-zinc-400 text-xs text-center leading-tight px-1">No icon</span>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-secondary text-xs w-full"
              >
                {uploading ? 'Uploading…' : form.icon_url ? 'Change icon' : 'Upload icon'}
              </button>
              {form.icon_url && (
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, icon_url: '' }))}
                  className="text-xs text-red-500 hover:text-red-600 w-full text-center"
                >
                  Remove icon
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5">PNG/SVG recommended. If not set, auto-detects Devicon by name.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleIconUpload}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
          <textarea
            rows={3}
            className="input resize-none"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="What do you use this for? Any notable experience?"
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Visibility</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Skill['status'] }))}
          >
            <option value="public">Public</option>
            <option value="draft">Draft (hidden from visitors)</option>
            <option value="private">Private (hidden from visitors)</option>
          </select>
        </div>

        {/* Level (hidden from visitors, only for admin reference) */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            Proficiency (admin only) — <span className="font-mono text-brand-500">{form.level}%</span>
          </label>
          <input
            type="range"
            min={0} max={100} step={5}
            value={form.level}
            onChange={(e) => setForm((p) => ({ ...p, level: Number(e.target.value) }))}
            className="w-full accent-brand-600"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : skill ? 'Update' : 'Add Skill'}
        </button>
      </div>
    </Modal>
  )
}
