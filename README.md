# Taklifnoma — online wedding invitations

One Next.js app that serves every invitation. Creating an invitation is a
single database row, so a new link is live the instant it's saved — there is no
per-invitation build or deploy.

```
/                     landing
/<slug>               the public invitation      e.g. /azizbek-nargiza
/qr/<slug>?format=svg print-ready QR (svg | png)
/admin                invitation list            (password protected)
/admin/<id>           the editor
```

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in ADMIN_PASSWORD and SESSION_SECRET
npm run dev
```

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sample data (run once the app has booted and created the schema):

```bash
node scripts/seed.mjs
```

## How it's put together

| Piece | Where |
|---|---|
| Schema, queries, migrations | `src/lib/db.ts` |
| The 7 colourways | `src/lib/themes.ts` + `[data-theme]` blocks in `src/app/globals.css` |
| Guest-facing strings (uz / ru) | `src/lib/types.ts` → `UI` |
| The invitation, as page content | `src/components/invitation/InvitationView.tsx` |
| Page-turning mechanics | `src/components/invitation/Book.tsx` |
| Envelope opening | `src/components/EnvelopeGate.tsx` + `globals.css` |
| Inline admin editor | `src/components/admin/InlineEditor.tsx` |
| Venue search | `src/components/admin/LocationPicker.tsx` + `src/app/api/geocode/route.ts` |

### The book

The invitation is a book, not a scrolling page: one section per leaf, turned
with the arrows, a swipe, or the arrow keys. `InvitationView` assembles the
`leaves` array — a leaf only exists when its toggle is on and it has content —
and `Book` handles paging and the 3D turn.

`InvitationView` is rendered by *both* the public page and the admin, so the
admin edits the real thing rather than a preview that can drift out of sync.
`EditContext` supplies the pencil affordances; with no provider (the public
page) `<Edit>` renders its children untouched and costs nothing.

Data lives in `data/wedding.db` (SQLite, WAL mode). Uploads go to
`public/uploads/`. **Both are gitignored — back them up; they are the product.**

### Design rules worth keeping

- **Every section fails soft.** A section renders only when its toggle is on
  *and* it has data. An admin who enables "Gallery" but uploads nothing gets a
  shorter page, never an empty box.
- **Fonts must carry Cyrillic.** Invitations are written in Uzbek Latin *and*
  Russian/Cyrillic, which rules out most calligraphic display faces. The
  medieval feel comes from ornaments and layout instead. Check any new font for
  a `cyrillic` subset before adding it.
- **Themes never touch components.** A colourway is only CSS variables. If you
  find yourself branching on `theme` in a component, something has gone wrong.
- **Phone first.** Verified with no horizontal overflow and ≥44px tap targets
  down to 320px wide, on every page of the book and in the admin.
- **Never gate UI state on `animationend` alone.** That event is skipped
  whenever the page isn't compositing — a backgrounded tab, a throttled device,
  an interrupted animation — and one missed event would jam paging forever.
  `Book` always arms a timer as the authority; the event is only a faster path
  to the same call. (This bit us: the book locked after one turn.)
- **`overflow-x: clip`, never `overflow-x: hidden`.** Setting one axis to
  `hidden` silently forces the other from `visible` to `auto`, turning the
  element into a scroll container. That broke IntersectionObserver and left a
  whole section stuck at `opacity: 0`.
- **Animation is transform/opacity only.** `Ambient` caps its particle count,
  drops it further on low-core devices, pauses on tab hide, and renders nothing
  under `prefers-reduced-motion`. A guest on a mid-range Android should never
  feel this page work.

## Deploying

Any Node host works. On a VPS:

```bash
npm ci && npm run build && npm start   # behind a reverse proxy on :3000
```

Put Caddy or nginx in front for TLS. Two things that matter:

1. **Set `NEXT_PUBLIC_SITE_URL` to the real public origin.** QR codes encode it.
   Get this wrong and you print QR codes pointing at `localhost`.
2. **The proxy must forward `x-forwarded-for`.** The guestbook rate limiter keys
   off it; without it, flood protection silently does nothing. Caddy sends it by
   default; nginx needs `proxy_set_header X-Forwarded-For $remote_addr;`.
3. **Venue search calls Nominatim**, OpenStreetMap's free geocoder. It is rate
   limited to ~1 req/sec (enforced server-side in `/api/geocode`) and asks for a
   real User-Agent. Fine at this volume; if the product grows, move to Yandex
   Geocoder, which has far better Uzbek address coverage anyway.

### Later: subdomains instead of paths

Currently `site.uz/azizbek-nargiza`. To move to
`azizbek-nargiza.site.uz`, nothing about the app's architecture changes — add a
wildcard DNS record `*.site.uz`, get a wildcard certificate (Caddy does this
automatically over DNS-01), and read the subdomain off the `Host` header in
middleware instead of the path. Still one row per invitation, still instant.

## Not built yet

- **Image resizing on upload** — the most urgent one. Originals are served
  as-is, so a 6 MB phone photo reaches the guest at 6 MB.
- RSVP (guests confirming attendance) — one table plus one admin view
- Per-guest personalised links (`?g=akmal-aka` → "Hurmatli Akmal aka")
- Print-ready PDF of the paper invitation from the same data
- Multiple templates (*shablon*) — today there is one layout in seven
  colourways. A second template means a second `InvitationView`-shaped
  component selected by a column on `invitations`; the book, themes, data layer
  and admin all carry over unchanged.
- A draggable map pin. Search covers the common case, but Uzbek addresses are
  often imprecise; Leaflet would let the admin nudge the marker.
