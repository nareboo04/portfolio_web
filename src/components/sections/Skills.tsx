'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'
import { cn } from '@/lib/cn'
import Modal from '@/components/ui/Modal'
import InlineEditor from '@/components/admin/InlineEditor'
import type { Skill, SiteContent } from '@/types'

interface SkillsProps {
  skills: Skill[]
  isEditMode?: boolean
  onEdit?: (skill: Skill) => void
  onDelete?: (id: number) => void
  onAdd?: () => void
  onReordered?: (items: Skill[]) => void
  content?: SiteContent
  onContentChange?: (key: string, value: string) => void
  csrfToken?: string | null
}

const CATEGORIES = ['all', 'frontend', 'backend', 'database', 'devops', 'other'] as const
type Category = typeof CATEGORIES[number]

const CAT_LABEL: Record<Category, string> = {
  all: 'All', frontend: 'Frontend', backend: 'Backend',
  database: 'Database', devops: 'DevOps', other: 'Other',
}

const CAT_COLOR: Record<string, string> = {
  frontend: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300',
  backend:  'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300',
  database: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  devops:   'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  other:    'bg-zinc-100   dark:bg-zinc-800       text-zinc-600   dark:text-zinc-300',
}

// Devicon fallback map
const DEVICON: Record<string, string> = {
  'react':          'devicon-react-original colored',
  'next.js':        'devicon-nextjs-plain',
  'nextjs':         'devicon-nextjs-plain',
  'typescript':     'devicon-typescript-plain colored',
  'javascript':     'devicon-javascript-plain colored',
  'tailwind css':   'devicon-tailwindcss-plain colored',
  'tailwindcss':    'devicon-tailwindcss-plain colored',
  'tailwind':       'devicon-tailwindcss-plain colored',
  'node.js':        'devicon-nodejs-plain colored',
  'nodejs':         'devicon-nodejs-plain colored',
  'express':        'devicon-express-original',
  'mysql':          'devicon-mysql-original colored',
  'redis':          'devicon-redis-plain colored',
  'postgresql':     'devicon-postgresql-plain colored',
  'postgres':       'devicon-postgresql-plain colored',
  'mongodb':        'devicon-mongodb-plain colored',
  'docker':         'devicon-docker-plain colored',
  'kubernetes':     'devicon-kubernetes-plain colored',
  'git':            'devicon-git-plain colored',
  'github':         'devicon-github-original',
  'gitlab':         'devicon-gitlab-plain colored',
  'python':         'devicon-python-plain colored',
  'go':             'devicon-go-plain colored',
  'golang':         'devicon-go-plain colored',
  'rust':           'devicon-rust-plain',
  'vue.js':         'devicon-vuejs-plain colored',
  'vue':            'devicon-vuejs-plain colored',
  'nuxt':           'devicon-nuxtjs-plain colored',
  'angular':        'devicon-angularjs-plain colored',
  'svelte':         'devicon-svelte-plain colored',
  'graphql':        'devicon-graphql-plain colored',
  'php':            'devicon-php-plain colored',
  'laravel':        'devicon-laravel-plain colored',
  'java':           'devicon-java-plain colored',
  'spring':         'devicon-spring-plain colored',
  'kotlin':         'devicon-kotlin-plain colored',
  'swift':          'devicon-swift-plain colored',
  'dart':           'devicon-dart-plain colored',
  'flutter':        'devicon-flutter-plain colored',
  'c++':            'devicon-cplusplus-plain colored',
  'c#':             'devicon-csharp-plain colored',
  'ruby':           'devicon-ruby-plain colored',
  'rails':          'devicon-rails-plain colored',
  'linux':          'devicon-linux-plain',
  'nginx':          'devicon-nginx-original colored',
  'aws':            'devicon-amazonwebservices-plain colored',
  'figma':          'devicon-figma-plain colored',
  'html':           'devicon-html5-plain colored',
  'html5':          'devicon-html5-plain colored',
  'css':            'devicon-css3-plain colored',
  'css3':           'devicon-css3-plain colored',
  'sass':           'devicon-sass-plain colored',
  'webpack':        'devicon-webpack-plain colored',
  'vite':           'devicon-vitejs-plain colored',
  'terraform':      'devicon-terraform-plain colored',
  'ansible':        'devicon-ansible-plain colored',
}

function SkillIcon({ skill, size = 48 }: { skill: Skill; size?: number }) {
  if (skill.icon_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={skill.icon_url}
        alt={skill.name}
        style={{ width: size, height: size }}
        className="object-contain"
      />
    )
  }
  const iconClass = DEVICON[skill.name.toLowerCase()]
  if (iconClass) {
    const isColored = iconClass.includes('colored')
    return <i className={cn(iconClass, !isColored && 'dark:invert')} style={{ fontSize: size }} aria-hidden="true" />
  }
  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold select-none"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {skill.name[0]?.toUpperCase()}
    </div>
  )
}

interface DetailPopupProps {
  skill: Skill
  onClose: () => void
}

function DetailPopup({ skill, onClose }: DetailPopupProps) {
  return (
    <Modal open onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center pt-2 pb-4">
        <div className="mb-4 flex items-center justify-center w-20 h-20">
          <SkillIcon skill={skill} size={72} />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{skill.name}</h3>
        <span className={cn('tag mb-4', CAT_COLOR[skill.category])}>
          {CAT_LABEL[skill.category as Category]}
        </span>
        {skill.description ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-xs">
            {skill.description}
          </p>
        ) : (
          <p className="text-sm text-zinc-400 italic">No description yet.</p>
        )}
      </div>
    </Modal>
  )
}

interface SkillCardProps {
  skill: Skill
  isEditMode?: boolean
  onEdit?: (s: Skill) => void
  onDelete?: (id: number) => void
}

function SkillCard({ skill, isEditMode, onEdit, onDelete }: SkillCardProps) {
  const [showDetail, setShowDetail] = useState(false)

  function handleClick() {
    if (isEditMode) { onEdit?.(skill); return }
    setShowDetail(true)
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          'relative group card flex flex-col items-center cursor-pointer transition-all duration-200',
          'hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md hover:-translate-y-0.5',
        )}
      >
        {isEditMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(skill.id) }}
            className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            aria-label="Delete skill"
          >
            ×
          </button>
        )}
        <div className="pt-5 pb-2 h-16 flex items-center justify-center">
          <SkillIcon skill={skill} size={44} />
        </div>
        <span className="font-medium text-sm text-center text-zinc-800 dark:text-zinc-100 px-3 pb-1 leading-tight">
          {skill.name}
        </span>
        <div className="pb-4 pt-1">
          <span className={cn('tag text-[10px]', CAT_COLOR[skill.category])}>
            {CAT_LABEL[skill.category as Category]}
          </span>
        </div>
        {isEditMode && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-[10px] text-brand-500 font-medium">click to edit</span>
          </div>
        )}
      </div>
      {showDetail && <DetailPopup skill={skill} onClose={() => setShowDetail(false)} />}
    </>
  )
}

export default function Skills({ skills, isEditMode, onEdit, onDelete, onAdd, onReordered, content, onContentChange, csrfToken }: SkillsProps) {
  const [active,  setActive]  = useState<Category>('all')
  const [saving,  setSaving]  = useState(false)

  const filtered = active === 'all' ? skills : skills.filter((s) => s.category === active)

  async function onDragEnd(result: DropResult) {
    if (!result.destination || result.source.index === result.destination.index) return

    const reordered = Array.from(filtered)
    const [moved]   = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)

    // Merge back: replace filtered items in skills with their new order
    const filteredIds = new Set(filtered.map((s) => s.id))
    const others = skills.filter((s) => !filteredIds.has(s.id))
    const merged = [...reordered, ...others]
    onReordered?.(merged)

    setSaving(true)
    try {
      const res = await fetch('/api/skills/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ order: reordered.map((s) => s.id) }),
      })
      const d = await res.json()
      if (!d.success) toast.error('Reorder failed')
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="skills" className="py-24 bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="section-container">
        <InlineEditor value={content?.skills_label ?? 'What I Work With'} fieldKey="skills_label" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="text-brand-500 font-mono font-medium mb-2" />
        <InlineEditor value={content?.skills_heading ?? 'Skills & Technologies'} fieldKey="skills_heading" enabled={!!isEditMode} onChange={onContentChange} tag="h2" className="section-heading mb-2" />
        <InlineEditor value={content?.skills_subheading ?? 'A curated list of tools and technologies I use to bring ideas to life.'} fieldKey="skills_subheading" enabled={!!isEditMode} onChange={onContentChange} tag="p" className="section-subheading mb-10" multiline />

        {/* Filter bar + Add button */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150',
                active === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-brand-400',
              )}
            >
              {CAT_LABEL[cat]}
            </button>
          ))}
          {isEditMode && (
            <div className="ml-auto flex items-center gap-3">
              {saving && <span className="text-xs text-zinc-400 animate-pulse">Saving order…</span>}
              <button onClick={onAdd} className="px-4 py-1.5 rounded-full text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors">
                + Add Skill
              </button>
            </div>
          )}
        </div>

        {isEditMode ? (
          /* ── Edit mode: vertical draggable list ── */
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="skills">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {filtered.map((skill, i) => (
                    <Draggable key={skill.id} draggableId={String(skill.id)} index={i}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`card p-3 flex items-center gap-3 ${snapshot.isDragging ? 'shadow-xl border-brand-400' : ''}`}
                        >
                          <div {...drag.dragHandleProps} className="cursor-grab text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            <SkillIcon skill={skill} size={28} />
                          </div>
                          <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{skill.name}</span>
                          <span className={cn('tag text-[10px] shrink-0', CAT_COLOR[skill.category])}>
                            {CAT_LABEL[skill.category as Category]}
                          </span>
                          <button onClick={() => onEdit?.(skill)} className="btn-secondary text-xs px-2 py-1 shrink-0">Edit</button>
                          <button
                            onClick={() => { if (confirm(`Delete "${skill.name}"?`)) onDelete?.(skill.id) }}
                            className="text-xs px-2 py-1 rounded-lg text-red-600 border border-zinc-200 dark:border-zinc-700 hover:border-red-400 bg-white dark:bg-zinc-800 shrink-0"
                          >Del</button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {filtered.length === 0 && (
                    <div className="text-center py-8 text-zinc-400 text-sm">No skills in this category.</div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          /* ── View mode: icon grid ── */
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filtered.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                isEditMode={isEditMode}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
