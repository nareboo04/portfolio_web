export interface SiteContent {
  [key: string]: string
}

export interface Skill {
  id: number
  name: string
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'other'
  level: number
  sort_order: number
  icon_url: string | null
  description: string | null
  status: 'public' | 'draft' | 'private'
}

export interface TimelineEntry {
  id: number
  type: 'experience' | 'education'
  title: string
  organization: string
  location: string | null
  start_date: string
  end_date: string | null
  current: boolean
  description: string | null
  pdf_url: string | null
  sort_order: number
  status: 'public' | 'draft' | 'private'
}

export interface Project {
  id: number
  title: string
  slug: string
  summary: string
  description: string | null
  category: string
  tags: string[]
  images: string[]
  live_url: string | null
  repo_url: string | null
  pdf_url: string | null
  featured: boolean
  status: 'public' | 'draft' | 'private'
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Certification {
  id: number
  title: string
  issuer: string
  issue_date: string
  expiry_date: string | null
  description: string | null
  credential_url: string | null
  pdf_url: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  status: 'public' | 'draft' | 'private'
}

export interface Activity {
  id: number
  type: 'volunteer' | 'award' | 'publication' | 'project' | 'other'
  title: string
  organization: string | null
  description: string | null
  date: string | null
  url: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  status: 'public' | 'draft' | 'private'
}

export interface LabItem {
  id: number
  section_id: number
  name: string
  sort_order: number
}

export interface LabSection {
  id: number
  name: string
  description: string | null
  image_urls: string[]
  sort_order: number
  items: LabItem[]
  status: 'public' | 'draft' | 'private'
}

export interface Message {
  id: number
  name: string
  email: string
  subject: string
  body: string
  read: boolean
  ip: string | null
  created_at: string
}

export interface AdminUser {
  username: string
}

export interface JWTPayload {
  sub: string
  iat: number
  exp: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
