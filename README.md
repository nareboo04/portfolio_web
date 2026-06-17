# Personal Portfolio

Full-stack personal portfolio with inline admin editing.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · MySQL 8 · Docker Compose

---

## Quick Start

```bash
# 1. Copy the env template and fill in your values
cp .env .env.local          # for local dev
# (production uses .env and .env.secrets — see below)

# 2. Install dependencies
npm install

# 3. Start full stack (app + MySQL + phpMyAdmin)
docker compose up --build -d

# App:        http://localhost:3000
# phpMyAdmin: http://localhost:8088
```

First run automatically creates the database schema from `init.sql`.

---

## Environment Files

| File | Purpose |
|------|---------|
| `.env` | Main config (MySQL, SMTP, Turnstile, admin username, ports) |
| `.env.secrets` | Password hash only — loaded separately so it's never in docker-compose |
| `.env.local` | Local dev overrides (Next.js reads this automatically) |

**Never commit `.env`, `.env.local`, or `.env.secrets` to git.**

---

## Changing the Admin Password

**Step 1 — Generate a new bcrypt hash:**

```bash
npm run hash-password yourNewPassword
```

Output looks like:
```
$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 2 — Update `.env.secrets`:**

```
ADMIN_PASSWORD_HASH=$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> The `$` signs must **not** be escaped. Paste as-is.

**Step 3 — Restart the app container:**

```bash
docker compose up -d --no-deps app
```

The new password is active immediately — no rebuild needed.

---

## Changing the Admin Username

Edit `.env`:

```
ADMIN_USERNAME=yournewusername
```

Then restart:

```bash
docker compose up -d --no-deps app
```

---

## Changing JWT Secret (invalidates all sessions)

```bash
# Generate a new secret
openssl rand -hex 64
```

Paste the result into `.env`:

```
JWT_SECRET=<paste here>
```

Restart the app:

```bash
docker compose up -d --no-deps app
```

All existing login sessions will be invalidated — everyone must log in again.

---

## Changing MySQL Passwords

> ⚠️ This wipes the database. Back up first if you have data.

1. Update all `MYSQL_*` variables in `.env`:
   ```
   MYSQL_ROOT_PASSWORD=newrootpass
   MYSQL_PASSWORD=newapppass
   ```
2. Tear down and recreate with fresh volumes:
   ```bash
   docker compose down -v
   docker compose up --build -d
   ```

---

## Resetting / Rebuilding the Database

To wipe all data and start fresh from `init.sql`:

```bash
docker compose down -v
docker compose up --build -d
```

> This deletes **all** content (projects, skills, timeline, certifications, activities, messages, uploaded files). Use with care.

---

## Running a DB Migration (without wiping data)

Connect to the running MySQL container:

```bash
docker exec portfolio_db mysql -uroot -p<MYSQL_ROOT_PASSWORD> portfolio
```

Then run your SQL:

```sql
ALTER TABLE activities ADD COLUMN image_url VARCHAR(512) NULL;
```

---

## Cloudflare Turnstile

The login page and contact form use Cloudflare Turnstile to block bots.

1. Go to [dash.cloudflare.com → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Create a widget and copy the **Site Key** and **Secret Key**
3. Update `.env`:
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAA...
   TURNSTILE_SECRET_KEY=0x4AAAA...
   ```
4. Rebuild the app (site key is baked into the client bundle):
   ```bash
   docker compose up --build -d app
   ```

**Local dev test keys** (always pass — use in `.env.local`):
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

---

## SMTP / Contact Form

Set the mail server in `.env`:

```
SMTP_HOST=IP ADDRESS
SMTP_PORT=PORT
SMTP_FROM=portfolio@localhost
CONTACT_TO_EMAIL=you@example.com
```

The contact form sends to `CONTACT_TO_EMAIL`. The server at `SMTP_HOST:SMTP_PORT` is used directly — no auth, no TLS. Adjust `src/app/api/contact/route.ts` if your server requires authentication.

---

## Admin Workflow

1. Go to `/login` and sign in with your admin credentials
2. The admin bar appears at the top of every page
3. Click **Edit** to enter edit mode — click any text on the page to edit it inline
4. A floating **Save Changes** panel appears when edits are pending
5. Use section **+ Add** buttons to create new projects, skills, certifications, etc.
6. Drag the ⠿ handle (visible in edit mode) to reorder cards in any section
7. Click **💬 Messages** to view contact form submissions

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              ← home page (all sections)
│   ├── login/page.tsx        ← admin login
│   ├── api/                  ← REST endpoints
│   └── uploads/[...path]/    ← file serving
├── components/
│   ├── admin/                ← admin modals and panels
│   ├── sections/             ← Hero, About, Skills, Timeline, Projects, Certifications, Activities, Contact
│   ├── layout/               ← Navbar, Footer
│   ├── providers/            ← ThemeProvider, AuthProvider
│   └── ui/                   ← Modal, Button, DropZone
├── lib/
│   ├── db.ts                 ← MySQL pool
│   ├── auth.ts               ← JWT helpers
│   ├── sanitize.ts           ← XSS protection
│   └── csrf.ts               ← CSRF validation
└── types/index.ts            ← shared TypeScript interfaces
```

---

## Common Commands

```bash
npm run dev                        # local dev server (port 3000)
npm run build                      # production build
npm run hash-password <password>   # generate ADMIN_PASSWORD_HASH

docker compose up --build -d       # start / rebuild all containers
docker compose up -d --no-deps app # restart only the app (fast, keeps DB)
docker compose down                # stop containers (keeps data)
docker compose down -v             # stop and wipe all volumes (destroys DB)
docker compose logs -f app         # tail app logs
```

---

## Security Notes

- All mutating API routes require a valid JWT cookie + CSRF header
- User input is sanitized with `sanitize-html` before writing to the DB
- Passwords are hashed with bcrypt (cost factor 12)
- Uploaded files are validated by MIME type and size; images are converted to WebP
- PDFs are served with `Content-Disposition: inline` so they open in the browser viewer
