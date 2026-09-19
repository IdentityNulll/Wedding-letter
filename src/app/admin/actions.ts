"use server";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkPassword,
  createSession,
  destroySession,
  isAuthenticated,
} from "@/lib/auth";
import {
  createInvitation,
  deleteInvitation,
  deleteMessage,
  getById,
  setMessageHidden,
  uniqueSlug,
  updateInvitation,
  type InvitationInput,
} from "@/lib/db";
import { DEFAULT_THEME, themeOr } from "@/lib/themes";
import type { Contact, Lang, ScheduleItem } from "@/lib/types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_UPLOAD = 8 * 1024 * 1024; // 8 MB per file
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["audio/mpeg", "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/ogg", "ogg"],
]);

/** Every mutating action below calls this first. */
async function requireAuth() {
  if (!(await isAuthenticated())) redirect("/admin/login");
}

/* ── Session ───────────────────────────────────────────────────────────── */

export type LoginState = { error: string } | null;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    // Blunt the brute-force edge without a full rate-limiter.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Parol noto'g'ri" };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ── Uploads ───────────────────────────────────────────────────────────── */

/** Saves to public/uploads and returns web paths. Filenames are random, never
 *  taken from the client — an admin uploading "../../x.png" must not escape. */
export async function uploadFiles(form: FormData): Promise<string[]> {
  await requireAuth();
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const saved: string[] = [];

  for (const file of files) {
    if (file.size === 0 || file.size > MAX_UPLOAD) continue;
    const ext = ALLOWED.get(file.type);
    if (!ext) continue;

    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    saved.push(`/uploads/${name}`);
  }

  return saved;
}

/* ── Invitation CRUD ───────────────────────────────────────────────────── */

function bool(form: FormData, key: string): 0 | 1 {
  return form.get(key) ? 1 : 0;
}

function num(form: FormData, key: string): number | null {
  const raw = String(form.get(key) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Parallel arrays from the repeatable field rows in the editor. Blank rows are
 *  dropped, so an admin who adds a row and forgets to fill it gets nothing
 *  rather than an empty bullet on the invitation. */
function pairs<T extends Record<string, string>>(
  form: FormData,
  aKey: string,
  bKey: string,
  make: (a: string, b: string) => T,
): T[] {
  const as = form.getAll(aKey).map(String);
  const bs = form.getAll(bKey).map(String);
  const out: T[] = [];
  for (let i = 0; i < Math.max(as.length, bs.length); i += 1) {
    const a = (as[i] ?? "").trim();
    const b = (bs[i] ?? "").trim();
    if (a || b) out.push(make(a, b));
  }
  return out;
}

function readForm(form: FormData): InvitationInput {
  const groomName = String(form.get("groomName") ?? "").trim();
  const brideName = String(form.get("brideName") ?? "").trim();
  const lang = (String(form.get("lang") ?? "uz") === "ru" ? "ru" : "uz") as Lang;

  return {
    slug: String(form.get("slug") ?? "").trim(),
    theme: themeOr(String(form.get("theme") ?? DEFAULT_THEME)),
    lang,
    published: bool(form, "published"),
    groomName,
    brideName,
    epigraph: String(form.get("epigraph") ?? "").trim(),
    eventDate: String(form.get("eventDate") ?? "").trim(),
    greetingTitle: String(form.get("greetingTitle") ?? "").trim(),
    greetingBody: String(form.get("greetingBody") ?? "").trim(),
    inviteFrom: String(form.get("inviteFrom") ?? "").trim(),
    venueName: String(form.get("venueName") ?? "").trim(),
    venueAddress: String(form.get("venueAddress") ?? "").trim(),
    venueLat: num(form, "venueLat"),
    venueLng: num(form, "venueLng"),
    schedule: pairs<ScheduleItem>(form, "scheduleTime", "scheduleTitle", (time, title) => ({ time, title })),
    contacts: pairs<Contact>(form, "contactName", "contactPhone", (name, phone) => ({ name, phone })),
    gallery: form.getAll("gallery").map(String).filter(Boolean),
    musicUrl: String(form.get("musicUrl") ?? "").trim(),
    heroImage: String(form.get("heroImage") ?? "").trim(),
    giftCardNumber: String(form.get("giftCardNumber") ?? "").trim(),
    giftCardHolder: String(form.get("giftCardHolder") ?? "").trim(),
    showCountdown: bool(form, "showCountdown"),
    showMap: bool(form, "showMap"),
    showGallery: bool(form, "showGallery"),
    showSchedule: bool(form, "showSchedule"),
    showContacts: bool(form, "showContacts"),
    showMusic: bool(form, "showMusic"),
    showCalendar: bool(form, "showCalendar"),
    showGift: bool(form, "showGift"),
    showGuestbook: bool(form, "showGuestbook"),
  };
}

export async function createDraft() {
  await requireAuth();
  const id = createInvitation({
    slug: uniqueSlug("yangi-taklifnoma"),
    theme: DEFAULT_THEME,
    lang: "uz",
    published: 0,
    groomName: "",
    brideName: "",
    epigraph: "",
    eventDate: "",
    greetingTitle: "",
    greetingBody: "",
    inviteFrom: "",
    venueName: "",
    venueAddress: "",
    venueLat: null,
    venueLng: null,
    schedule: [],
    contacts: [],
    gallery: [],
    musicUrl: "",
    heroImage: "",
    giftCardNumber: "",
    giftCardHolder: "",
    showCountdown: 1,
    showMap: 1,
    showGallery: 0,
    showSchedule: 1,
    showContacts: 1,
    showMusic: 0,
    showCalendar: 1,
    showGift: 0,
    showGuestbook: 1,
  });
  redirect(`/admin/${id}`);
}

export type SaveState = { ok: boolean; message: string; slug?: string } | null;

export async function saveInvitation(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireAuth();

  const id = Number(form.get("id"));
  const existing = getById(id);
  if (!existing) return { ok: false, message: "Taklifnoma topilmadi" };

  const input = readForm(form);

  // A blank or duplicate slug would break the public URL, so derive one from
  // the couple's names rather than refusing to save.
  const base = input.slug || `${input.groomName}-${input.brideName}` || "taklifnoma";
  input.slug = uniqueSlug(base, id);

  updateInvitation(id, input);
  revalidatePath(`/${input.slug}`);
  revalidatePath("/admin");
  return { ok: true, message: "Saqlandi", slug: input.slug };
}

/** Save from the inline editor, which holds the whole invitation as state and
 *  sends it as one object rather than a flat FormData. */
export async function saveDraft(
  id: number,
  draft: InvitationInput,
): Promise<{ ok: boolean; message: string; slug: string }> {
  await requireAuth();

  const existing = getById(id);
  if (!existing) return { ok: false, message: "Taklifnoma topilmadi", slug: "" };

  // Never trust the client for these two: a bad theme would break the palette,
  // and a blank or duplicate slug would break the public URL.
  const theme = themeOr(draft.theme);
  const base = draft.slug?.trim() || `${draft.groomName}-${draft.brideName}` || "taklifnoma";
  const slug = uniqueSlug(base, id);

  updateInvitation(id, { ...draft, theme, slug });

  revalidatePath(`/${slug}`);
  if (existing.slug !== slug) revalidatePath(`/${existing.slug}`);
  revalidatePath("/admin");

  return { ok: true, message: "Saqlandi", slug };
}

export async function removeInvitation(form: FormData) {
  await requireAuth();
  deleteInvitation(Number(form.get("id")));
  revalidatePath("/admin");
  redirect("/admin");
}

/* ── Guestbook moderation ──────────────────────────────────────────────── */

export async function hideMessage(form: FormData) {
  await requireAuth();
  setMessageHidden(Number(form.get("messageId")), form.get("hidden") === "1");
  revalidatePath("/admin");
}

export async function removeMessage(form: FormData) {
  await requireAuth();
  deleteMessage(Number(form.get("messageId")));
  revalidatePath("/admin");
}
