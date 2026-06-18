# Portfolio — CLAUDE.md

## Project Overview
Personal portfolio website with admin inline-editing capability.
Full-stack: Next.js 14 App Router · Tailwind CSS · MySQL 8 · Docker Compose.

## Tech Stack
- **Runtime:** Node 20, Next.js 14 (`output: 'standalone'`), TypeScript strict
- **Styling:** Tailwind CSS 3, dark/light mode via `.dark` class on `<html>`
- **Database:** MySQL 8 via `mysql2/promise` (pool in `src/lib/db.ts`)
- **Auth:** `jose` JWT in `HttpOnly`/`Secure`/`SameSite=Strict` cookie (`portfolio_auth`)
- **Security:** bcryptjs passwords · sanitize-html XSS protection · CSRF double-submit cookie
- **Spam:** Cloudflare Turnstile (server-side `siteverify`)
- **Images:** `sharp` → auto-convert uploads to WebP
- **DnD:** `@hello-pangea/dnd` for project reorder
- **Toasts:** `react-hot-toast`

## Directory Layout
```
src/
├── app/
│   ├── page.tsx          ← home (all sections + admin wiring)
│   ├── login/page.tsx    ← admin login with Turnstile
│   ├── api/              ← REST endpoints (auth, content, projects, skills, contact, messages, upload, timeline)
│   ├── layout.tsx        ← root layout with providers
│   └── globals.css       ← Tailwind base + custom components/utilities
├── components/
│   ├── admin/            ← AdminBar, InlineEditor, FloatingSavePanel, ProjectModal, MessageCenter, DraggableProjects, SectionReorderModal, Skill/Timeline/Certification/Activity modals
│   ├── layout/           ← Navbar, Footer
│   ├── providers/        ← ThemeProvider, AuthProvider, NavVisibilityProvider
│   ├── sections/         ← Hero, About, Skills, Timeline, Projects, Certifications, Infrastructure, Activities, Contact
│   └── ui/               ← Modal, Button, DropZone, ExpandableText
├── hooks/useCsrf.ts      ← reads csrf_token cookie for JS calls
├── lib/
│   ├── auth.ts           ← JWT sign/verify, cookie helpers, CSRF generator
│   ├── db.ts             ← mysql2 pool (singleton)
│   ├── sanitize.ts       ← sanitizeText / sanitizeRich / sanitizeUrl / sanitizeTags
│   ├── turnstile.ts      ← Cloudflare siteverify
│   └── csrf.ts           ← server-side CSRF validation
├── middleware.ts         ← auth guard + CSRF injection
└── types/index.ts        ← shared TypeScript interfaces
```

## Environment Variables
Copy `.env.production` → `.env`, fill in all `CHANGE_ME_*` values.
Dev uses `.env.local` with Cloudflare always-pass test keys already set.

Key variables:
- `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` — bcrypt hash, generate with `npm run hash-password <pw>`
- `JWT_SECRET` — `openssl rand -hex 64`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` — from Cloudflare dashboard
- `MYSQL_*` — matched in both app and db services

## Common Commands
```bash
npm install                       # install deps
npm run dev                       # dev server on :3000
npm run build                     # production build
npm run hash-password <password>  # generate ADMIN_PASSWORD_HASH
docker compose up --build         # full stack (app + MySQL + phpMyAdmin)
docker compose down -v            # stop + remove volumes
```

## Database
- Schema auto-loaded from `init.sql` on first `docker compose up`
- phpMyAdmin at `http://localhost:8080`
- All queries use **prepared statements** (no string interpolation)

## Security Notes
- All mutating API routes require valid JWT cookie + matching CSRF header (`x-csrf-token`)
- Middleware enforces auth on `/admin/*` and all non-GET `/api/*` routes
- User input sanitized with `sanitize-html` before DB write AND on render
- Turnstile token verified server-side on both `/api/contact` and `/api/auth/login`
- Uploaded images validated (MIME + size), converted to WebP via `sharp`

## Admin Workflow
1. Visit `/login` → sign in
2. Admin bar appears at top of page
3. Toggle **Edit Mode** → click any text on the page to edit inline
4. Floating "Save Changes" panel appears when edits are pending
5. Use **+ New Project** or **⇅ Reorder** panel for project management
6. **⇅ Sections** opens a drag-drop modal to reorder whole page sections
7. **💬 Messages** opens the message centre modal

## Content Visibility & Section Order
- Every entry (skills, timeline, certifications, activities, lab_sections) and each
  project has a `status ENUM('public','draft','private')`. `draft` and `private` are
  both hidden from visitors.
- Filtering is **server-side**: GET routes call `getSession()` and append
  `WHERE status='public'` for non-admins, so non-public rows never reach a visitor's
  browser. Admins get all rows (with a Draft/Private badge in edit lists).
- A section with zero public entries is hidden, and its Navbar link is removed via
  `NavVisibilityProvider`. Admins always see every section.
- Page/Navbar section order is stored as comma-separated slugs in
  `site_content.section_order` (safe from `sanitizeText`, unlike JSON). `page.tsx`
  renders `sectionOrder.map(...)` with Hero pinned first; `parseSectionOrder` drops
  unknown slugs and appends any newly-added sections. `section_order` is whitelisted
  in the `/api/content` PATCH `allowedKeys`.
