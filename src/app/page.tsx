'use client'

import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/providers/AuthProvider'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Skills from '@/components/sections/Skills'
import Timeline from '@/components/sections/Timeline'
import Projects from '@/components/sections/Projects'
import Certifications from '@/components/sections/Certifications'
import Activities from '@/components/sections/Activities'
import Contact from '@/components/sections/Contact'
import AdminBar from '@/components/admin/AdminBar'
import ProjectModal from '@/components/admin/ProjectModal'
import SkillModal from '@/components/admin/SkillModal'
import TimelineModal from '@/components/admin/TimelineModal'
import CertificationModal from '@/components/admin/CertificationModal'
import ActivityModal from '@/components/admin/ActivityModal'
import DraggableProjects from '@/components/admin/DraggableProjects'
import FloatingSavePanel from '@/components/admin/FloatingSavePanel'
import Modal from '@/components/ui/Modal'
import type { SiteContent, Skill, TimelineEntry, Project, Certification, Activity } from '@/types'

export default function Home() {
  const { isAdmin, isEditMode, csrfToken } = useAuth()

  // Data state
  const [content,        setContent]        = useState<SiteContent>({})
  const [skills,         setSkills]         = useState<Skill[]>([])
  const [timeline,       setTimeline]       = useState<TimelineEntry[]>([])
  const [projects,       setProjects]       = useState<Project[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [activities,     setActivities]     = useState<Activity[]>([])

  // Inline content edit state
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({})
  const [saving,         setSaving]         = useState(false)

  // Project modal + reorder
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingProject,   setEditingProject]   = useState<Project | null>(null)
  const [reorderOpen,      setReorderOpen]       = useState(false)

  // Skill modal
  const [skillModalOpen, setSkillModalOpen] = useState(false)
  const [editingSkill,   setEditingSkill]   = useState<Skill | null>(null)

  // Timeline modal
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)
  const [editingEntry,      setEditingEntry]      = useState<TimelineEntry | null>(null)

  // Certification modal
  const [certModalOpen,  setCertModalOpen]  = useState(false)
  const [editingCert,    setEditingCert]    = useState<Certification | null>(null)

  // Activity modal
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [editingActivity,   setEditingActivity]   = useState<Activity | null>(null)

  // ── Fetch data ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/content').then((r) => r.json()),
      fetch('/api/skills').then((r) => r.json()),
      fetch('/api/timeline').then((r) => r.json()),
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/certifications').then((r) => r.json()),
      fetch('/api/activities').then((r) => r.json()),
    ]).then(([c, s, t, p, cert, act]) => {
      if (c.success)    setContent(c.data)
      if (s.success)    setSkills(s.data)
      if (t.success)    setTimeline(t.data)
      if (p.success)    setProjects(p.data)
      if (cert.success) setCertifications(cert.data)
      if (act.success)  setActivities(act.data)
    })
  }, [])

  // ── Inline content editing ──────────────────────────────────────
  const handleContentChange = useCallback((key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }))
    setPendingChanges((prev) => ({ ...prev, [key]: value }))
  }, [])

  const hasPending = Object.keys(pendingChanges).length > 0

  async function saveContent() {
    if (!hasPending) return
    setSaving(true)
    try {
      const res = await fetch('/api/content', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify(pendingChanges),
      })
      const d = await res.json()
      if (d.success) { toast.success('Content saved!'); setPendingChanges({}) }
      else toast.error(d.error || 'Save failed')
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  function discardContent() {
    fetch('/api/content').then((r) => r.json()).then((d) => {
      if (d.success) { setContent(d.data); setPendingChanges({}) }
    })
  }

  // ── Project management ──────────────────────────────────────────
  function openNewProject() { setEditingProject(null); setProjectModalOpen(true) }
  function openEditProject(p: Project) { setEditingProject(p); setProjectModalOpen(true) }

  async function refreshProjects() {
    const res = await fetch('/api/projects')
    const d   = await res.json()
    if (d.success) setProjects(d.data)
  }

  async function deleteProject(id: number) {
    if (!confirm('Delete this project?')) return
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    const d = await res.json()
    if (d.success) { toast.success('Project deleted'); refreshProjects() }
    else toast.error('Delete failed')
  }

  // ── Skill management ────────────────────────────────────────────
  function openNewSkill() { setEditingSkill(null); setSkillModalOpen(true) }
  function openEditSkill(s: Skill) { setEditingSkill(s); setSkillModalOpen(true) }

  async function refreshSkills() {
    const res = await fetch('/api/skills')
    const d   = await res.json()
    if (d.success) setSkills(d.data)
  }

  async function deleteSkill(id: number) {
    if (!confirm('Delete this skill?')) return
    const res = await fetch(`/api/skills/${id}`, {
      method: 'DELETE',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    const d = await res.json()
    if (d.success) { toast.success('Skill deleted'); refreshSkills() }
    else toast.error('Delete failed')
  }

  // ── Timeline management ─────────────────────────────────────────
  function openNewEntry() { setEditingEntry(null); setTimelineModalOpen(true) }
  function openEditEntry(e: TimelineEntry) { setEditingEntry(e); setTimelineModalOpen(true) }

  async function refreshTimeline() {
    const res = await fetch('/api/timeline')
    const d   = await res.json()
    if (d.success) setTimeline(d.data)
  }

  async function deleteTimelineEntry(id: number) {
    if (!confirm('Delete this timeline entry?')) return
    const res = await fetch(`/api/timeline/${id}`, {
      method: 'DELETE',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    const d = await res.json()
    if (d.success) { toast.success('Entry deleted'); refreshTimeline() }
    else toast.error('Delete failed')
  }

  // ── Certification management ────────────────────────────────────
  function openNewCert() { setEditingCert(null); setCertModalOpen(true) }
  function openEditCert(c: Certification) { setEditingCert(c); setCertModalOpen(true) }

  async function refreshCertifications() {
    const res = await fetch('/api/certifications')
    const d   = await res.json()
    if (d.success) setCertifications(d.data)
  }

  async function deleteCert(id: number) {
    if (!confirm('Delete this certification?')) return
    const res = await fetch(`/api/certifications/${id}`, {
      method: 'DELETE',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    const d = await res.json()
    if (d.success) { toast.success('Deleted'); refreshCertifications() }
    else toast.error('Delete failed')
  }

  // ── Activity management ─────────────────────────────────────────
  function openNewActivity() { setEditingActivity(null); setActivityModalOpen(true) }
  function openEditActivity(a: Activity) { setEditingActivity(a); setActivityModalOpen(true) }

  async function refreshActivities() {
    const res = await fetch('/api/activities')
    const d   = await res.json()
    if (d.success) setActivities(d.data)
  }

  async function deleteActivity(id: number) {
    if (!confirm('Delete this activity?')) return
    const res = await fetch(`/api/activities/${id}`, {
      method: 'DELETE',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    })
    const d = await res.json()
    if (d.success) { toast.success('Deleted'); refreshActivities() }
    else toast.error('Delete failed')
  }

  return (
    <div className={isEditMode ? 'editing-mode' : ''}>
      {isAdmin && <AdminBar onAddProject={openNewProject} />}

      <div className={isAdmin ? 'pt-10' : ''}>
        {/* Section order: Hero → About → Certifications → Projects → Skills → Timeline → Activities → Contact */}
        <Hero    content={content} onContentChange={isEditMode ? handleContentChange : undefined} />
        <About   content={content} onContentChange={isEditMode ? handleContentChange : undefined} />

        <Certifications
          certs={certifications}
          isEditMode={isEditMode}
          onEdit={openEditCert}
          onDelete={deleteCert}
          onAdd={openNewCert}
          onReordered={setCertifications}
        />

        <Projects
          projects={projects}
          isEditMode={isEditMode}
          onEdit={openEditProject}
          onDelete={deleteProject}
          onAdd={openNewProject}
          onReorder={() => setReorderOpen(true)}
        />

        <Skills
          skills={skills}
          isEditMode={isEditMode}
          onEdit={openEditSkill}
          onDelete={deleteSkill}
          onAdd={openNewSkill}
          onReordered={setSkills}
        />

        <Timeline
          entries={timeline}
          isEditMode={isEditMode}
          onEdit={openEditEntry}
          onDelete={deleteTimelineEntry}
          onAdd={openNewEntry}
          onReordered={setTimeline}
        />

        <Activities
          activities={activities}
          isEditMode={isEditMode}
          onEdit={openEditActivity}
          onDelete={deleteActivity}
          onAdd={openNewActivity}
          onReordered={setActivities}
        />

        <Contact />
      </div>

      {/* Floating save panel */}
      {isAdmin && (
        <FloatingSavePanel
          visible={hasPending}
          saving={saving}
          onSave={saveContent}
          onDiscard={discardContent}
        />
      )}

      {/* Project CRUD modal */}
      {projectModalOpen && (
        <ProjectModal
          project={editingProject}
          onClose={() => setProjectModalOpen(false)}
          onSaved={refreshProjects}
        />
      )}

      {/* Skill CRUD modal */}
      {skillModalOpen && (
        <SkillModal
          skill={editingSkill}
          onClose={() => setSkillModalOpen(false)}
          onSaved={refreshSkills}
        />
      )}

      {/* Timeline CRUD modal */}
      {timelineModalOpen && (
        <TimelineModal
          entry={editingEntry}
          onClose={() => setTimelineModalOpen(false)}
          onSaved={refreshTimeline}
        />
      )}

      {/* Certification CRUD modal */}
      {certModalOpen && (
        <CertificationModal
          cert={editingCert}
          onClose={() => setCertModalOpen(false)}
          onSaved={refreshCertifications}
        />
      )}

      {/* Activity CRUD modal */}
      {activityModalOpen && (
        <ActivityModal
          activity={editingActivity}
          onClose={() => setActivityModalOpen(false)}
          onSaved={refreshActivities}
        />
      )}

      {/* Project reorder modal */}
      {reorderOpen && (
        <Modal open onClose={() => setReorderOpen(false)} title="Reorder Projects" size="lg">
          <DraggableProjects
            projects={projects}
            onReordered={setProjects}
            onEdit={(p) => { setReorderOpen(false); openEditProject(p) }}
            onDelete={deleteProject}
          />
        </Modal>
      )}
    </div>
  )
}
