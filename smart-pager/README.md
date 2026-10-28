# QR Smart Pager

A web replacement for restaurant pagers. Staff create an order and show a QR code. The customer scans it, watches the status live, and gets a notification when staff mark the order ready. There are no customer accounts, and no name, phone or email is collected.

Status: MVP milestones 1–5 (foundation, customer page, staff dashboard, live updates, push notifications).

## How it works

| Piece | Tech | Role |
|---|---|---|
| `server/` | Node, Express, TypeScript, PostgreSQL | REST API, SSE streams, Web Push |
| `web/` | Vite, React, TypeScript, PWA | Customer page and staff dashboard |

**Order lifecycle:** `preparing` → `ready` (Send Call) → `completed`. An order can be cancelled only while preparing. Resend re-notifies a ready order.

**Delivery channels**
- **REST:** all staff and customer actions.
- **SSE:** live status to open customer pages and staff dashboards. The customer page also polls every 4 seconds as a fallback, because some proxies and tunnels hold SSE back.
- **Web Push:** system notification when the customer is in another app or the screen is locked (needs permission). Delivery is best-effort.

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/login` | Staff | Sign in or register a business |
| `/staff` | Staff | Dashboard: new order, QR, Send Call, Resend, Complete, Cancel, filters |
| `/t/:token` | Customer | Order tracking page (the QR code opens this) |

**API**

```
POST /api/auth/register | login | logout      GET /api/auth/me
POST /api/staff/orders                         GET /api/staff/orders?status=
POST /api/staff/orders/:id/call|resend|complete|cancel
GET  /api/staff/events                         (SSE)
GET  /api/customer/orders/:token               GET /api/customer/orders/:token/events (SSE)
GET  /api/customer/push/key                    POST /api/customer/push/subscribe
```

## Run locally

Requires Node 20+ and PostgreSQL 14+ (or Docker).

```bash
# 1. Database (example using Docker)
docker run -d --name sp-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=smart_pager -p 55432:5432 postgres:16

# 2. API
cd server
npm install
npx web-push generate-vapid-keys        # copy the keys into the env below
export DATABASE_URL=postgres://postgres:postgres@localhost:55432/smart_pager
export JWT_SECRET=some-long-random-string
export VAPID_PUBLIC_KEY=...  VAPID_PRIVATE_KEY=...
export PUBLIC_URL=http://localhost:5173
npm run dev                             # :4000, creates tables on start

# 3. Web
cd ../web
npm install
npm run dev                             # :5173, proxies /api to :4000
```

Open http://localhost:5173, register a business, click **+ New order**, then open the QR link.

## Environment variables (server)

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | local Postgres | |
| `JWT_SECRET` | dev value | Required when `NODE_ENV=production` |
| `PUBLIC_URL` | `http://localhost:5173` | Base URL put in QR codes. Must be the address customers can reach |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | empty | Push is disabled without them |
| `VAPID_SUBJECT` | `mailto:admin@example.com` | Use a real contact |
| `RETENTION_HOURS` | `24` | Push subscriptions of finished orders are deleted after this |
| `PORT` | `4000` | |

## Testing on a phone

Push needs HTTPS (localhost is exempt), and phones can't reach your `localhost`. Use an HTTPS tunnel, such as Cloudflare Quick Tunnel:

```bash
cloudflared tunnel --url http://localhost:5173
```

Then restart the API with `PUBLIC_URL` set to the tunnel URL. The URL changes whenever the tunnel restarts, which invalidates existing QR codes and push subscriptions. Customers must re-open the page and tap **Enable notifications** again.

## Platform notes

- **Android Chrome:** works in the browser. Chrome notifications must be allowed, and battery restrictions on Chrome can block background pushes.
- **iPhone:** web push only works after Share → Add to Home Screen.
- **Notifications denied:** the customer still sees live in-page status, sound and vibration while the page is open.
- Browsers and the OS control background sound and vibration. Continuous ringing or full-screen alerts are not possible.

## Production

```bash
cd web && npm run build
cd ../server && npm run build && NODE_ENV=production node dist/index.js
```

The API serves `web/dist`. Behind a reverse proxy, turn off response buffering for the `/events` routes and use long read timeouts.

## Security and privacy

- Customer access uses a random 192-bit token in the QR URL.
- Every staff query is scoped to the staff member's business.
- Status changes and the audit row in `order_events` commit in one transaction. SSE and push run after the commit.
- Never commit real VAPID private keys or `JWT_SECRET`.

## Not built yet

Admin settings and branding UI, staff management, analytics, Stripe billing, Row-Level Security, rate limiting, PNG icons for iOS, automated tests.
