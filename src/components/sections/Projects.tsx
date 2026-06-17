'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import Modal from '@/components/ui/Modal'
import InlineEditor from '@/components/admin/InlineEditor'
import type { Project, SiteContent } from '@/types'

interface ProjectsProps {
  projects: Project[]
  isEditMode?: boolean
  onEdit?: (p: Project) => void
  onDelete?: (id: number) => void
  onAdd?: () => void
  onReorder?: () => void
  content?: SiteContent
  onContentChange?: (key: string, value: string) => void
}

const STATUS_BADGE: Record<string, string> = {
  draft:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  private: 'bg-zinc-200  dark:bg-zinc-700      text-zinc-600  dark:text-zinc-300',
}

function ProjectCard({
  project, onClick, isEditMode, onEdit, onDelete,
}: {
  project: Project
  onClick: () => void
  isEditMode?: boolean
  onEdit?: (p: Project) => void
  onDelete?: (id: number) => void
}) {
  const firstImage = project.images[0]

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="card text-left w-full overflow-hidden hover:border-brand-400 dark:hover:border-brand-600 transition-all duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {/* Image */}
        <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={project.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-500/20 to-purple-500/20">
              <svg className="w-12 h-12 text-brand-400/50" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          )}
          {project.featured && (
            <div className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              Featured
            </div>
          )}
          {/* Status badge (admin only) */}
          {isEditMode && project.status !== 'public' && (
            <div className={cn('absolute top-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full capitalize', STATUS_BADGE[project.status])}>
              {project.status === 'draft' ? '✏️ Draft' : '🔒 Private'}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">{project.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
            {project.tags.length > 4 && (
              <span className="tag bg-zinc-100 dark:bg-zinc-800 text-zinc-500">+{project.tags.length - 4}</span>
            )}
          </div>
        </div>
      </button>

      {/* Admin overlay buttons */}
      {isEditMode && (
        <div className="absolute top-52 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(project) }}
            className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-brand-400 transition-colors shadow-sm"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(project.id) }}
            className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-zinc-800 text-red-600 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-red-400 transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function ProjectDetailModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0)

  return (
    <Modal open onClose={onClose} title={project.title} size="xl">
      {project.images.length > 0 && (
        <div className="mb-6">
          {/* Scrollable container so tall/portrait images show fully */}
          <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-2 max-h-[60vh] overflow-y-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.images[imgIdx]}
              alt={project.title}
              className="w-full h-auto block"
            />
          </div>
          {project.images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {project.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    'relative h-14 w-20 rounded-lg overflow-hidden border-2 transition-colors',
                    i === imgIdx ? 'border-brand-500' : 'border-transparent',
                  )}
                >
                  <Image src={src} alt={`View ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">{project.summary}</p>
      {project.description && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none mb-4"
          dangerouslySetInnerHTML={{ __html: project.description }}
        />
      )}

      <div className="flex flex-wrap gap-1.5 mb-6">
        {project.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
      </div>

      <div className="flex flex-wrap gap-3">
        {project.live_url && (
          <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Live Demo
          </a>
        )}
        {project.repo_url && (
          <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Source Code
          </a>
        )}
        {project.pdf_url && (
          <a href={project.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
            </svg>
            View Certificate
          </a>
        )}
      </div>
    </Modal>
  )
}

const ALL_CATEGORIES = 'All'

export default function Projects({ projects, isEditMode, onEdit, onDelete, onAdd, onReorder, content, onContentChange }: ProjectsProps) {
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [selected, setSelected] = useState<Project | null>(null)

  const categories = useMemo(() => {
    const cats = [...new Set(projects.map((p) => p.category))]
    return [ALL_CATEGORIES, ...cats]
  }, [projects])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesCat    = category === ALL_CATEGORIES || p.category === category
      const matchesSearch = !search || [p.title, p.summary, ...p.tags].some((v) =>
        v.toLowerCase().includes(search.toLowerCase())
      )
      return matchesCat && matchesSearch
    })
  }, [projects, search, category])

  return (
    <section id="projects" className="py-24 bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="section-container">
        <div className="flex flex-wrap items-end gap-4 mb-2">
          <div>
            <InlineEditor value={content?.projects_label ?? "What I've Built"} fieldKey="projects_label" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="text-brand-500 font-mono font-medium mb-2" />
            <InlineEditor value={content?.projects_heading ?? 'Projects'} fieldKey="projects_heading" enabled={!!isEditMode} onChange={onContentChange} tag="h2" className="section-heading" />
          </div>
          {isEditMode && (
            <div className="flex gap-2 ml-auto pb-1">
              <button onClick={onReorder} className="btn-secondary text-sm">⇅ Reorder</button>
              <button onClick={onAdd}     className="btn-primary text-sm">+ New Project</button>
            </div>
          )}
        </div>
        <InlineEditor value={content?.projects_subheading ?? "A selection of projects I've worked on."} fieldKey="projects_subheading" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="section-subheading mb-10" multiline />

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize',
                  category === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-brand-400',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">No projects found.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => !isEditMode && setSelected(p)}
                isEditMode={isEditMode}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {selected && <ProjectDetailModal project={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
