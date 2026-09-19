import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Contact, GuestMessage, Invitation, Lang, ScheduleItem } from "./types";
import { RATE_WINDOW } from "./limits";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

// Next dev reloads modules constantly; keep one handle on globalThis so we
// don't leak file descriptors on every hot reload.
const g = globalThis as unknown as { __db?: Database.Database };

function open(): Database.Database {
  const db = new Database(path.join(DATA_DIR, "wedding.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS invitations (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      slug          TEXT NOT NULL UNIQUE,
      theme         TEXT NOT NULL DEFAULT 'zar',
      lang          TEXT NOT NULL DEFAULT 'uz',
      published     INTEGER NOT NULL DEFAULT 1,

      groom_name    TEXT NOT NULL DEFAULT '',
      bride_name    TEXT NOT NULL DEFAULT '',
      epigraph      TEXT NOT NULL DEFAULT '',
      event_date    TEXT NOT NULL DEFAULT '',

      greeting_title TEXT NOT NULL DEFAULT '',
      greeting_body  TEXT NOT NULL DEFAULT '',
      invite_from    TEXT NOT NULL DEFAULT '',

      venue_name    TEXT NOT NULL DEFAULT '',
      venue_address TEXT NOT NULL DEFAULT '',
      venue_lat     REAL,
      venue_lng     REAL,

      schedule      TEXT NOT NULL DEFAULT '[]',
      gallery       TEXT NOT NULL DEFAULT '[]',
      contacts      TEXT NOT NULL DEFAULT '[]',
      music_url     TEXT NOT NULL DEFAULT '',
      hero_image    TEXT NOT NULL DEFAULT '',

      gift_card_number TEXT NOT NULL DEFAULT '',
      gift_card_holder TEXT NOT NULL DEFAULT '',

      show_countdown INTEGER NOT NULL DEFAULT 1,
      show_map       INTEGER NOT NULL DEFAULT 1,
      show_gallery   INTEGER NOT NULL DEFAULT 0,
      show_schedule  INTEGER NOT NULL DEFAULT 1,
      show_contacts  INTEGER NOT NULL DEFAULT 1,
      show_music     INTEGER NOT NULL DEFAULT 0,
      show_calendar  INTEGER NOT NULL DEFAULT 1,
      show_gift      INTEGER NOT NULL DEFAULT 0,
      show_guestbook INTEGER NOT NULL DEFAULT 1,

      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);

    CREATE TABLE IF NOT EXISTS guest_messages (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      invitation_id INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
      author        TEXT NOT NULL DEFAULT '',
      body          TEXT NOT NULL,
      hidden        INTEGER NOT NULL DEFAULT 0,
      -- Salted hash only: enough to rate-limit a flooder, never the raw IP.
      ip_hash       TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_msg_invitation ON guest_messages(invitation_id, hidden, id);
    CREATE INDEX IF NOT EXISTS idx_msg_rate ON guest_messages(ip_hash, created_at);
  `);

  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

/** Add columns introduced after a client's database already exists. SQLite has
 *  no "ADD COLUMN IF NOT EXISTS", so we diff against table_info first. */
function migrate(db: Database.Database) {
  const existing = new Set(
    (db.prepare(`PRAGMA table_info(invitations)`).all() as { name: string }[]).map((c) => c.name),
  );
  const added: [string, string][] = [
    ["epigraph", "TEXT NOT NULL DEFAULT ''"],
    ["gift_card_number", "TEXT NOT NULL DEFAULT ''"],
    ["gift_card_holder", "TEXT NOT NULL DEFAULT ''"],
    ["show_calendar", "INTEGER NOT NULL DEFAULT 1"],
    ["show_gift", "INTEGER NOT NULL DEFAULT 0"],
    ["show_guestbook", "INTEGER NOT NULL DEFAULT 1"],
  ];
  for (const [name, decl] of added) {
    if (!existing.has(name)) db.exec(`ALTER TABLE invitations ADD COLUMN ${name} ${decl}`);
  }
}

export const db = g.__db ?? (g.__db = open());

/** JSON columns are written by us, but a hand-edited DB or a failed write
 *  shouldn't take down a guest's page — fall back to empty. */
function parseJson<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

type Row = Record<string, unknown>;

function hydrate(r: Row): Invitation {
  return {
    id: r.id as number,
    slug: r.slug as string,
    theme: r.theme as string,
    lang: r.lang as Lang,
    published: r.published as 0 | 1,
    groomName: r.groom_name as string,
    brideName: r.bride_name as string,
    epigraph: (r.epigraph as string) ?? "",
    eventDate: r.event_date as string,
    greetingTitle: r.greeting_title as string,
    greetingBody: r.greeting_body as string,
    inviteFrom: r.invite_from as string,
    venueName: r.venue_name as string,
    venueAddress: r.venue_address as string,
    venueLat: r.venue_lat as number | null,
    venueLng: r.venue_lng as number | null,
    schedule: parseJson<ScheduleItem[]>(r.schedule as string, []),
    gallery: parseJson<string[]>(r.gallery as string, []),
    contacts: parseJson<Contact[]>(r.contacts as string, []),
    musicUrl: r.music_url as string,
    heroImage: r.hero_image as string,
    giftCardNumber: (r.gift_card_number as string) ?? "",
    giftCardHolder: (r.gift_card_holder as string) ?? "",
    showCountdown: r.show_countdown as 0 | 1,
    showMap: r.show_map as 0 | 1,
    showGallery: r.show_gallery as 0 | 1,
    showSchedule: r.show_schedule as 0 | 1,
    showContacts: r.show_contacts as 0 | 1,
    showMusic: r.show_music as 0 | 1,
    showCalendar: (r.show_calendar as 0 | 1) ?? 1,
    showGift: (r.show_gift as 0 | 1) ?? 0,
    showGuestbook: (r.show_guestbook as 0 | 1) ?? 1,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function listInvitations(): Invitation[] {
  return (db.prepare(`SELECT * FROM invitations ORDER BY id DESC`).all() as Row[]).map(hydrate);
}

export function getBySlug(slug: string): Invitation | null {
  const r = db.prepare(`SELECT * FROM invitations WHERE slug = ?`).get(slug) as Row | undefined;
  return r ? hydrate(r) : null;
}

export function getById(id: number): Invitation | null {
  const r = db.prepare(`SELECT * FROM invitations WHERE id = ?`).get(id) as Row | undefined;
  return r ? hydrate(r) : null;
}

/** Turn any name into a URL-safe slug, transliterating Cyrillic so a Russian
 *  invitation still gets a readable Latin URL. */
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[‘’'`]/g, "")
    .split("")
    .map((c) => CYRILLIC[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "taklifnoma";
}

/** Append -2, -3, ... until the slug is free. `exceptId` lets an existing
 *  invitation keep its own slug while editing. */
export function uniqueSlug(base: string, exceptId?: number): string {
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  for (;;) {
    const hit = db
      .prepare(`SELECT id FROM invitations WHERE slug = ?`)
      .get(candidate) as { id: number } | undefined;
    if (!hit || hit.id === exceptId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

export type InvitationInput = Omit<Invitation, "id" | "createdAt" | "updatedAt">;

const WRITE_COLUMNS = `
  slug=@slug, theme=@theme, lang=@lang, published=@published,
  groom_name=@groomName, bride_name=@brideName, epigraph=@epigraph, event_date=@eventDate,
  greeting_title=@greetingTitle, greeting_body=@greetingBody, invite_from=@inviteFrom,
  venue_name=@venueName, venue_address=@venueAddress, venue_lat=@venueLat, venue_lng=@venueLng,
  schedule=@schedule, gallery=@gallery, contacts=@contacts,
  music_url=@musicUrl, hero_image=@heroImage,
  gift_card_number=@giftCardNumber, gift_card_holder=@giftCardHolder,
  show_countdown=@showCountdown, show_map=@showMap, show_gallery=@showGallery,
  show_schedule=@showSchedule, show_contacts=@showContacts, show_music=@showMusic,
  show_calendar=@showCalendar, show_gift=@showGift, show_guestbook=@showGuestbook
`;

function bind(v: InvitationInput) {
  return {
    ...v,
    schedule: JSON.stringify(v.schedule ?? []),
    gallery: JSON.stringify(v.gallery ?? []),
    contacts: JSON.stringify(v.contacts ?? []),
  };
}

export function createInvitation(v: InvitationInput): number {
  const stmt = db.prepare(`
    INSERT INTO invitations (
      slug, theme, lang, published,
      groom_name, bride_name, epigraph, event_date,
      greeting_title, greeting_body, invite_from,
      venue_name, venue_address, venue_lat, venue_lng,
      schedule, gallery, contacts, music_url, hero_image,
      gift_card_number, gift_card_holder,
      show_countdown, show_map, show_gallery, show_schedule, show_contacts, show_music,
      show_calendar, show_gift, show_guestbook
    ) VALUES (
      @slug, @theme, @lang, @published,
      @groomName, @brideName, @epigraph, @eventDate,
      @greetingTitle, @greetingBody, @inviteFrom,
      @venueName, @venueAddress, @venueLat, @venueLng,
      @schedule, @gallery, @contacts, @musicUrl, @heroImage,
      @giftCardNumber, @giftCardHolder,
      @showCountdown, @showMap, @showGallery, @showSchedule, @showContacts, @showMusic,
      @showCalendar, @showGift, @showGuestbook
    )
  `);
  return Number(stmt.run(bind(v)).lastInsertRowid);
}

export function updateInvitation(id: number, v: InvitationInput): void {
  db.prepare(
    `UPDATE invitations SET ${WRITE_COLUMNS}, updated_at = datetime('now') WHERE id = @id`,
  ).run({ ...bind(v), id });
}

export function deleteInvitation(id: number): void {
  db.prepare(`DELETE FROM invitations WHERE id = ?`).run(id);
  db.prepare(`DELETE FROM guest_messages WHERE invitation_id = ?`).run(id);
}

/* ── Guestbook ─────────────────────────────────────────────────────────── */

function hydrateMsg(r: Row): GuestMessage {
  return {
    id: r.id as number,
    invitationId: r.invitation_id as number,
    author: r.author as string,
    body: r.body as string,
    hidden: r.hidden as 0 | 1,
    createdAt: r.created_at as string,
  };
}

/** Visible messages, oldest first — a guestbook reads like a conversation. */
export function listMessages(invitationId: number): GuestMessage[] {
  return (
    db
      .prepare(`SELECT * FROM guest_messages WHERE invitation_id = ? AND hidden = 0 ORDER BY id ASC`)
      .all(invitationId) as Row[]
  ).map(hydrateMsg);
}

/** Everything, including hidden — for the admin moderation view. */
export function listAllMessages(invitationId: number): GuestMessage[] {
  return (
    db
      .prepare(`SELECT * FROM guest_messages WHERE invitation_id = ? ORDER BY id DESC`)
      .all(invitationId) as Row[]
  ).map(hydrateMsg);
}

export function countMessages(invitationId: number): number {
  const r = db
    .prepare(`SELECT COUNT(*) AS n FROM guest_messages WHERE invitation_id = ?`)
    .get(invitationId) as { n: number };
  return r.n;
}

export function isRateLimited(ipHash: string): boolean {
  if (!ipHash) return false;
  const r = db
    .prepare(
      `SELECT COUNT(*) AS n FROM guest_messages
        WHERE ip_hash = ? AND created_at > datetime('now', ?)`,
    )
    .get(ipHash, `-${RATE_WINDOW} seconds`) as { n: number };
  return r.n > 0;
}

export function addMessage(v: {
  invitationId: number;
  author: string;
  body: string;
  ipHash: string;
}): void {
  db.prepare(
    `INSERT INTO guest_messages (invitation_id, author, body, ip_hash)
     VALUES (@invitationId, @author, @body, @ipHash)`,
  ).run(v);
}

export function setMessageHidden(id: number, hidden: boolean): void {
  db.prepare(`UPDATE guest_messages SET hidden = ? WHERE id = ?`).run(hidden ? 1 : 0, id);
}

export function deleteMessage(id: number): void {
  db.prepare(`DELETE FROM guest_messages WHERE id = ?`).run(id);
}
