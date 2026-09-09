# Apex Warehouse Ops Dashboard

A real-time warehouse operations dashboard built with Next.js (App Router), Prisma + SQLite, and Zustand.

## Features

- **Live sensor monitoring** via Server-Sent Events — temperature, humidity, and throughput, with `OK` / `WARN` / `CRITICAL` status and `UPDATE` / `ALERT` / `RECOVERY` event tracking on status transitions.
- **Periodic aggregated summaries** — windowed averages, trend deltas vs. the previous window, and threshold-derived alerts, refreshed every 10 seconds.
- **Alerts feed** with cursor-based pagination and a word-prefix trie for search (matches "dock" against "Dock 04" and "Inbound dock nearing capacity", but not mid-word substrings).
- **Authentication** — JWT access/refresh tokens, bcrypt password hashing, a cap of 2 parallel sessions per account, and per-IP/per-email rate limiting on login.
- **Editable operator profile** with photo upload (stored as a data URL), department, and bio.
- **Live-tracking pause/resume** from Settings — stops both the SSE stream and the periodic polling when paused.
- **Error states** — Zustand stores capture fetch failures into an `error` field, surfaced via a shared `ErrorState` component with retry.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [Prisma](https://www.prisma.io) + SQLite
- [Zustand](https://github.com/pmndrs/zustand) for shared client state
- [Framer Motion](https://www.framer.com/motion/) for UI animation
- [lodash](https://lodash.com) (used for debouncing)

## Getting started

```bash
npm install          # also runs `prisma generate` via postinstall
npm run db:push       # applies the schema to a local SQLite file
npm run db:seed       # seeds a demo user, profile, and starter alerts
npm run dev            # starts the dev server on http://localhost:3000
```

**Demo login:** `operator@apex.io` / `warehouse2026`

### Optional: live alert generator

To see the alerts feed and stats populate continuously in the background:

```bash
npm run alerts:generate
```

This pushes a random alert every 5–20 seconds and keeps the `Alert` table trimmed to the most recent 30 rows.

## Environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | SQLite connection string, e.g. `file:./dev.db` |
| `JWT_ACCESS_SECRET` | Signing secret for short-lived access tokens |
| `JWT_REFRESH_SECRET` | Signing secret for refresh tokens |

Copy `.env` and set real secrets before deploying — the values checked into a local `.env` are for development only.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:seed` | Seed a demo user, profile, and starter alerts |
| `npm run alerts:generate` | Continuously generate dummy alerts in the background |

## Project structure

```
app/
  api/                  Route handlers (auth, dashboard data, profile, settings)
  dashboard/            Dashboard routes + layout (SideNav, TopNav)
  ui/
    dashboard/          Overview/analytics/inventory/alerts UI
    settings/           Settings page UI
    profile/            Profile page UI
    layout/             SideNav, TopNav, LogoutButton
    shared/             Reusable pieces (Title, ErrorState, StatLine, ToggleRow, AvatarUpload, ...)
lib/
  services/             Thin fetch wrappers per API domain
  stores/                Zustand stores (settings, alerts, alert stats, profile)
  hooks/                  Cross-cutting client hooks (live sensor stream, summary polling, silent refresh)
  utils/                  Pure data-shaping helpers used by UI components
  *.ts                    Server-side helpers (auth, prisma client, rate limiting, trie search, dummy data generators)
prisma/
  schema.prisma           Data model
  seed.mjs                 Demo data seed script
scripts/
  alerts-generator.mjs      Background dummy-alert generator
```

## Docker

A multi-stage `Dockerfile` builds a standalone production image. The SQLite database is expected on a mounted volume so it persists across container restarts.

```bash
docker build -t warehouse-ops-dashboard .

docker run -d --name warehouse-ops -p 3000:3000 \
  -e DATABASE_URL="file:/app/data/dev.db" \
  -e JWT_ACCESS_SECRET="<your-secret>" \
  -e JWT_REFRESH_SECRET="<your-secret>" \
  -v warehouse-ops-data:/app/data \
  warehouse-ops-dashboard

# first run only: seed the demo user
docker exec warehouse-ops node prisma/seed.mjs
```

The container's entrypoint runs `prisma db push` on every start, so the schema stays in sync with the mounted volume automatically.

### Publishing to Docker Hub

Tag and push the image to a Docker Hub repository (the tag must exactly match `<your-dockerhub-username>/<repo-name>`, or the push is rejected):

```bash
docker login

docker tag warehouse-ops-dashboard neeshu05/ware-house:latest
docker push neeshu05/ware-house:latest
```

### Run from Docker Hub

Pull and run the published image from anywhere — no local build needed:

```bash
docker pull neeshu05/ware-house:latest

docker run -d --name warehouse-ops -p 3000:3000 \
  -e DATABASE_URL="file:/app/data/dev.db" \
  -e JWT_ACCESS_SECRET="<your-secret>" \
  -e JWT_REFRESH_SECRET="<your-secret>" \
  -v warehouse-ops-data:/app/data \
  neeshu05/ware-house:latest

# first run only: seed the demo user
docker exec warehouse-ops node prisma/seed.mjs
```

## Notes

- SQLite is used for local development and this demo; it's a single-writer database and isn't suited to concurrent multi-instance production deployment. Swap `DATABASE_URL` for a Postgres/MySQL connection string (and update `prisma/schema.prisma`'s `datasource` provider) for that use case.
- The alert search/pagination endpoints scan the alerts table in memory (bounded to the most recent rows) rather than doing a database-level full-text search, since SQLite via Prisma doesn't support case-insensitive `contains` — fine at this table's scale.
