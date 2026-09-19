# Taklifnoma — online wedding invitations

Two separate apps.

```
server/   Node + Express + MongoDB   → the API          (deploy to a Node host)
client/   React + Vite + Tailwind    → the static site  (deploy to any static host / CDN)
```

They talk over HTTP only. You can deploy them to different servers.

## Running locally

Two terminals.

**Terminal 1 — API**

```bash
cd server && npm install && cp .env.example .env
```

Fill in `.env` (generate the secret with the command in the file), then:

```bash
cd server && npm run seed && npm run dev
```

**Terminal 2 — client**

```bash
cd client && npm install && npm run dev
```

Open http://localhost:5173 — the seeded invitation is at `/azizbek-nargiza`,
the admin at `/admin`.

In dev, Vite proxies `/api` and `/uploads` to `localhost:4000`, so there is no
CORS and no absolute URLs in the client.

## API

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/login` | — |
| GET | `/api/public/:slug` | — |
| POST | `/api/public/:slug/messages` | — (rate limited) |
| GET POST | `/api/invitations` | admin |
| GET PUT DELETE | `/api/invitations/:id` | admin |
| PATCH DELETE | `/api/invitations/messages/:id` | admin |
| POST | `/api/upload` | admin |
| GET | `/api/geocode?q=` | admin |
| GET | `/api/qr/:slug?format=svg\|png` | — |

Auth is a JWT in `Authorization: Bearer …`, held in localStorage.

## The book

The invitation is a physical book, not a scrolling page: hard cover, stitched
spine, stacked page edges along the fore-edge for real thickness, and leaves
that rotate about the binding. Turn with the arrows, a swipe, or arrow keys.

- `client/src/components/Book.jsx` — paging and turn mechanics
- `client/src/components/InvitationView.jsx` — builds the `leaves` array
- `.book`, `.book-block`, `.gutter`, `.stitch`, `.leaf` in `client/src/index.css`

`InvitationView` is rendered by both the public page and the admin editor, so
the admin edits the real thing rather than a preview that can drift.

## Rules worth keeping

- **Every page fails soft.** A page renders only when its toggle is on *and* it
  has content. An admin who enables "Gallery" but uploads nothing gets a shorter
  book, never an empty page.
- **Fonts must carry Cyrillic.** Invitations are written in Uzbek Latin *and*
  Russian/Cyrillic, which rules out most calligraphic faces. Check any new font
  for a `cyrillic` subset.
- **Themes never touch components.** A colourway is only CSS variables. If you
  branch on `theme` inside a component, something has gone wrong.
- **Never gate UI state on `animationend` alone.** That event is skipped
  whenever the page isn't compositing — backgrounded tab, throttled device,
  interrupted animation — and one missed event jams paging forever. `Book`
  always arms a timer as the authority; the event is only a faster path.
- **`overflow-x: clip`, never `overflow-x: hidden`.** Setting one axis to
  `hidden` silently forces the other from `visible` to `auto`, making the
  element a scroll container.
- **Shared input class strings carry no width.** Callers set their own. Baking
  `w-full` into a shared class beats any narrower `w-*` a caller adds, because
  CSS source order wins — not the order of names in `className`.
- **A `width: 100%` child needs a parent with a definite width.** `.book` inside
  a bare flex item resolved 100% against its own content and collapsed to 17px.
- **Animation is transform/opacity only**, so it stays on the compositor. Motes
  cap their count, drop it on low-core devices, pause on tab hide, and render
  nothing under `prefers-reduced-motion`.

## Deploying

The two halves go to different places.

**Server** — needs a persistent disk for `server/uploads/`, so a VPS or a
container host with a volume (Railway, Render, Fly). Not a serverless function.

```bash
cd server && npm ci && npm start
```

Set `PORT`, `MONGODB_URI`, `ADMIN_PASSWORD`, `JWT_SECRET`, and `CLIENT_ORIGIN`.
Use MongoDB Atlas unless you want to run and back up Mongo yourself.

**Client** — a static bundle, so anything: Netlify, Vercel, Cloudflare Pages,
or nginx.

```bash
cd client && npm ci && VITE_API_URL=https://api.yourdomain.uz npm run build
# serve client/dist
```

Three things that will burn you:

1. **`CLIENT_ORIGIN` must be the real site origin.** It drives CORS *and* the URL
   encoded into QR codes — wrong value means QR codes pointing at localhost.
2. **`VITE_API_URL` is baked in at build time**, not read at runtime. Changing it
   means rebuilding the client.
3. **Configure SPA fallback** on the static host — every unknown path must serve
   `index.html`, or `/azizbek-nargiza` 404s on refresh.

## Not built yet

- **Image resizing on upload** — the most urgent. Originals are served as-is, so
  a 6 MB phone photo reaches the guest at 6 MB.
- Uploads live on the API server's disk. Move to S3/R2 before running more than
  one instance.
- RSVP, per-guest personalised links, print-ready PDF, multiple templates.
