"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  hideMessage,
  removeInvitation,
  removeMessage,
  saveDraft,
  uploadFiles,
} from "@/app/admin/actions";
import { THEMES } from "@/lib/themes";
import type { Contact, GuestMessage, Invitation, ScheduleItem } from "@/lib/types";
import InvitationView from "@/components/invitation/InvitationView";
import { EditProvider, type EditGroup } from "@/components/invitation/EditContext";
import LocationPicker from "./LocationPicker";

// Carries NO width — callers set their own. Baking w-full in here silently beat
// any narrower w-* a caller added (CSS source order wins, not the order of names
// in the class attribute), so `w-24 shrink-0` on the schedule time field stayed
// full width and couldn't shrink, shoving the whole sheet off screen.
//
// min-w-0 matters too: <input> has an intrinsic min-width that blows out flex
// rows. text-[16px] stops iOS Safari zooming the viewport on focus.
const input =
  "min-h-11 min-w-0 rounded-md border border-stone-300 bg-white px-3 py-2.5 text-[16px] text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

/** Content groups, plus a "manage" panel for things that aren't part of the
 *  invitation's design: the public link, the QR, moderation, deletion. */
type Panel = EditGroup | "manage";

const SHEET_TITLES: Record<Panel, string> = {
  manage: "Havola, QR va boshqaruv",
  names: "Kelin va kuyov",
  epigraph: "Epigraf",
  date: "Sana va vaqt",
  greeting: "Murojaat",
  venue: "Manzil",
  schedule: "Tadbir dasturi",
  contacts: "Aloqa raqamlari",
  gallery: "Galereya",
  gift: "To'y sovg'asi",
  music: "Fon musiqasi",
  hero: "Fon rasmi",
  theme: "Sozlamalar",
};

/** The admin edits the real invitation, in place.
 *
 *  The live book is rendered from `draft`, so every keystroke in the sheet is
 *  visible in the actual design immediately. Nothing is written to the database
 *  until Save — the editor is a staging copy. */
export default function InlineEditor({
  invitation,
  messages,
  origin,
}: {
  invitation: Invitation;
  messages: GuestMessage[];
  origin: string;
}) {
  const [draft, setDraft] = useState<Invitation>(invitation);
  const [group, setGroup] = useState<Panel | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${origin}/${draft.slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable — the link is right there to select */ }
  }

  function set<K extends keyof Invitation>(key: K, value: Invitation[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
    setNote("");
  }

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = draft;
      const res = await saveDraft(draft.id, rest);
      setNote(res.message);
      if (res.ok) {
        setDirty(false);
        if (res.slug !== draft.slug) setDraft((d) => ({ ...d, slug: res.slug }));
      }
    } catch {
      setNote("Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }, [draft]);

  // Ctrl/Cmd+S, and a guard against closing the tab with unsaved work.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) void save();
      }
    }
    function onLeave(e: BeforeUnloadEvent) {
      if (dirty) e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty, saving, save]);

  async function upload(files: FileList | null, done: (paths: string[]) => void) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      done(await uploadFiles(fd));
      setDirty(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-x-clip bg-stone-900" style={{ ["--book-h" as string]: "calc(100dvh - 3.25rem)" }}>
      {/* ── toolbar ──────────────────────────────────────────────────── */}
      <header className="flex h-[3.25rem] items-center gap-2 px-3 text-white sm:px-5">
        <Link href="/admin" className="shrink-0 rounded px-2 py-2 text-sm text-stone-300 hover:text-white">
          ←
        </Link>
        <span className="min-w-0 flex-1 truncate text-sm text-stone-300">
          {[draft.groomName, draft.brideName].filter(Boolean).join(" & ") || "Nomsiz"}
        </span>

        {note && <span className="shrink-0 text-xs text-green-400">{note}</span>}

        <button
          type="button"
          onClick={() => setGroup("manage")}
          className="shrink-0 rounded-md border border-stone-600 px-3 py-2 text-xs text-stone-200 transition hover:bg-stone-800"
        >
          Havola
        </button>
        <button
          type="button"
          onClick={() => setGroup("theme")}
          className="shrink-0 rounded-md border border-stone-600 px-3 py-2 text-xs text-stone-200 transition hover:bg-stone-800"
        >
          Sozlamalar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="shrink-0 rounded-md bg-white px-4 py-2 text-xs font-medium text-stone-900 transition disabled:opacity-40"
        >
          {saving ? "…" : dirty ? "Saqlash" : "Saqlangan"}
        </button>
      </header>

      {/* ── the real invitation, editable in place ───────────────────── */}
      <EditProvider open={setGroup}>
        <InvitationView inv={draft} messages={messages} showGate={false} />
      </EditProvider>

      {/* ── bottom sheet ─────────────────────────────────────────────── */}
      {group && (
        <>
          <button
            type="button"
            aria-label="Yopish"
            onClick={() => setGroup(null)}
            className="fixed inset-0 z-40 bg-black/40"
          />
          {/* overflow-x-clip is a backstop: if any field ever overflows again it
              gets clipped here instead of shoving the whole document sideways. */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[82dvh] overflow-x-clip overflow-y-auto rounded-t-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3">
              <h2 className="font-medium text-stone-900">{SHEET_TITLES[group]}</h2>
              <button
                type="button"
                onClick={() => setGroup(null)}
                className="min-h-11 rounded-md px-3 text-sm text-stone-500 hover:text-stone-900"
              >
                Tayyor
              </button>
            </div>

            <div
              className="grid grid-cols-1 gap-4 px-5 py-5"
              style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            >
              {group === "names" && (
                <>
                  <Text label="Kuyov ismi" value={draft.groomName} onChange={(v) => set("groomName", v)} placeholder="Azizbek" />
                  <Text label="Kelin ismi" value={draft.brideName} onChange={(v) => set("brideName", v)} placeholder="Nargiza" />
                </>
              )}

              {group === "epigraph" && (
                <Area
                  label="Epigraf (oyat yoki she'r)"
                  value={draft.epigraph}
                  onChange={(v) => set("epigraph", v)}
                  rows={3}
                  placeholder="Alloh ularning qalblarini muhabbat bilan bog'ladi"
                />
              )}

              {group === "date" && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-stone-700">To&apos;y sanasi va vaqti</span>
                  <input
                    type="datetime-local"
                    value={draft.eventDate}
                    onChange={(e) => set("eventDate", e.target.value)}
                    className={`${input} w-full`}
                  />
                  <span className="mt-1 block text-xs text-stone-500">Mahalliy vaqt bo&apos;yicha.</span>
                </label>
              )}

              {group === "greeting" && (
                <>
                  <Text label="Kim taklif qiladi" value={draft.inviteFrom} onChange={(v) => set("inviteFrom", v)} placeholder="Karimovlar oilasi nomidan" />
                  <Text label="Murojaat sarlavhasi" value={draft.greetingTitle} onChange={(v) => set("greetingTitle", v)} placeholder="Hurmatli mehmonlar!" />
                  <Area label="Murojaat matni" value={draft.greetingBody} onChange={(v) => set("greetingBody", v)} rows={6} />
                </>
              )}

              {group === "venue" && (
                <LocationPicker
                  name={draft.venueName}
                  address={draft.venueAddress}
                  lat={draft.venueLat}
                  lng={draft.venueLng}
                  onNameChange={(v) => set("venueName", v)}
                  onAddressChange={(v) => set("venueAddress", v)}
                  onPick={(r) => {
                    setDraft((d) => ({ ...d, venueName: r.name, venueAddress: r.address, venueLat: r.lat, venueLng: r.lng }));
                    setDirty(true);
                  }}
                />
              )}

              {group === "schedule" && (
                <Rows<ScheduleItem>
                  rows={draft.schedule}
                  onChange={(r) => set("schedule", r)}
                  blank={{ time: "", title: "" }}
                  addLabel="+ Qator qo'shish"
                  render={(row, update) => (
                    <>
                      <input value={row.time} onChange={(e) => update({ ...row, time: e.target.value })} placeholder="18:00" className={`${input} w-24 shrink-0`} />
                      <input value={row.title} onChange={(e) => update({ ...row, title: e.target.value })} placeholder="Mehmonlarni kutib olish" className={`${input} w-full`} />
                    </>
                  )}
                />
              )}

              {group === "contacts" && (
                <Rows<Contact>
                  rows={draft.contacts}
                  onChange={(r) => set("contacts", r)}
                  blank={{ name: "", phone: "" }}
                  addLabel="+ Raqam qo'shish"
                  render={(row, update) => (
                    <>
                      <input value={row.name} onChange={(e) => update({ ...row, name: e.target.value })} placeholder="Akmal aka" className={`${input} w-full`} />
                      <input value={row.phone} onChange={(e) => update({ ...row, phone: e.target.value })} placeholder="+998 90 123 45 67" inputMode="tel" className={`${input} w-full`} />
                    </>
                  )}
                />
              )}

              {group === "gallery" && (
                <>
                  {draft.gallery.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {draft.gallery.map((src, i) => (
                        <div key={src} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="h-20 w-20 rounded object-cover ring-1 ring-stone-200" />
                          <button
                            type="button"
                            onClick={() => set("gallery", draft.gallery.filter((_, j) => j !== i))}
                            aria-label="O'chirish"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-stone-600 shadow ring-1 ring-stone-200 hover:text-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <FileInput accept="image/*" multiple onFiles={(f) => upload(f, (p) => set("gallery", [...draft.gallery, ...p]))} />
                  <Toggle label="Galereya ko'rinsin" checked={draft.showGallery === 1} onChange={(v) => set("showGallery", v ? 1 : 0)} />
                </>
              )}

              {group === "gift" && (
                <>
                  <Text label="Karta raqami" value={draft.giftCardNumber} onChange={(v) => set("giftCardNumber", v)} placeholder="8600 1234 5678 9012" />
                  <Text label="Karta egasi" value={draft.giftCardHolder} onChange={(v) => set("giftCardHolder", v)} placeholder="AZIZBEK KARIMOV" />
                </>
              )}

              {group === "theme" && (
                <>
                  <div>
                    <span className="mb-2 block text-sm font-medium text-stone-700">Dizayn rangi</span>
                    <div className="grid grid-cols-2 gap-2">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => set("theme", t.id)}
                          aria-pressed={draft.theme === t.id}
                          className={`flex items-center gap-2.5 rounded-lg border-2 p-2.5 text-left transition ${
                            draft.theme === t.id ? "border-stone-900 bg-stone-50" : "border-stone-200"
                          }`}
                        >
                          <span className="flex shrink-0 gap-0.5" aria-hidden>
                            {t.swatch.map((c) => (
                              <span key={c} className="h-7 w-2.5 rounded-sm ring-1 ring-black/10" style={{ background: c }} />
                            ))}
                          </span>
                          <span className="min-w-0 text-xs leading-tight text-stone-700">{t.label[draft.lang]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-stone-700">Til</span>
                    <select value={draft.lang} onChange={(e) => set("lang", e.target.value as "uz" | "ru")} className={`${input} w-full`}>
                      <option value="uz">O&apos;zbekcha (lotin)</option>
                      <option value="ru">Ruscha / Kirill</option>
                    </select>
                  </label>

                  <Text label="Havola manzili (slug)" value={draft.slug} onChange={(v) => set("slug", v)} hint={`${origin}/${draft.slug}`} />

                  <div>
                    <span className="mb-1 block text-sm font-medium text-stone-700">Fon rasmi</span>
                    {draft.heroImage && (
                      <div className="mb-2 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={draft.heroImage} alt="" className="h-16 w-24 rounded object-cover ring-1 ring-stone-200" />
                        <button type="button" onClick={() => set("heroImage", "")} className="text-sm text-red-600 underline">
                          O&apos;chirish
                        </button>
                      </div>
                    )}
                    <FileInput accept="image/*" onFiles={(f) => upload(f, (p) => p[0] && set("heroImage", p[0]))} />
                  </div>

                  <div>
                    <span className="mb-1 block text-sm font-medium text-stone-700">Fon musiqasi</span>
                    {draft.musicUrl && (
                      <div className="mb-2 flex items-center gap-3">
                        <audio src={draft.musicUrl} controls className="h-10 max-w-full" />
                        <button type="button" onClick={() => set("musicUrl", "")} className="shrink-0 text-sm text-red-600 underline">
                          O&apos;chirish
                        </button>
                      </div>
                    )}
                    <FileInput accept="audio/*" onFiles={(f) => upload(f, (p) => p[0] && set("musicUrl", p[0]))} />
                  </div>

                  <fieldset className="mt-1">
                    <legend className="mb-1 text-sm font-medium text-stone-700">Qaysi sahifalar ko&apos;rinsin</legend>
                    <p className="mb-2 text-xs text-stone-500">
                      Yoqilgan sahifa ma&apos;lumoti bo&apos;sh bo&apos;lsa, mehmonlarga ko&apos;rinmaydi.
                    </p>
                    <div className="grid gap-0.5">
                      <Toggle label="Faol (mehmonlar ko'ra oladi)" checked={draft.published === 1} onChange={(v) => set("published", v ? 1 : 0)} />
                      <Toggle label="Sanoq" checked={draft.showCountdown === 1} onChange={(v) => set("showCountdown", v ? 1 : 0)} />
                      <Toggle label="Kalendar" checked={draft.showCalendar === 1} onChange={(v) => set("showCalendar", v ? 1 : 0)} />
                      <Toggle label="Xarita va manzil" checked={draft.showMap === 1} onChange={(v) => set("showMap", v ? 1 : 0)} />
                      <Toggle label="Tadbir dasturi" checked={draft.showSchedule === 1} onChange={(v) => set("showSchedule", v ? 1 : 0)} />
                      <Toggle label="Galereya" checked={draft.showGallery === 1} onChange={(v) => set("showGallery", v ? 1 : 0)} />
                      <Toggle label="Aloqa raqamlari" checked={draft.showContacts === 1} onChange={(v) => set("showContacts", v ? 1 : 0)} />
                      <Toggle label="Fon musiqasi" checked={draft.showMusic === 1} onChange={(v) => set("showMusic", v ? 1 : 0)} />
                      <Toggle label="To'y sovg'asi" checked={draft.showGift === 1} onChange={(v) => set("showGift", v ? 1 : 0)} />
                      <Toggle label="Mehmonlar kitobi" checked={draft.showGuestbook === 1} onChange={(v) => set("showGuestbook", v ? 1 : 0)} />
                    </div>
                  </fieldset>
                </>
              )}

              {group === "manage" && (
                <>
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-stone-700">Mehmonlar uchun havola</span>
                    <div className="flex gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-md bg-stone-100 px-3 py-2.5 text-sm text-stone-700">
                        {publicUrl}
                      </code>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="min-h-11 shrink-0 rounded-md border border-stone-300 px-4 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        {copied ? "✓" : "Nusxa"}
                      </button>
                    </div>
                    {dirty && (
                      <p className="mt-1.5 text-xs text-amber-700">
                        Saqlanmagan o&apos;zgarishlar bor — havola saqlagandan keyin ishlaydi.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 rounded-md bg-stone-50 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/qr/${draft.slug}?format=svg`} alt="QR" className="h-28 w-28 rounded bg-white p-1.5 ring-1 ring-stone-200" />
                    <div className="flex flex-col gap-2 text-sm">
                      <a href={`/qr/${draft.slug}?format=svg`} download className="text-stone-900 underline underline-offset-4">
                        SVG (chop etish uchun)
                      </a>
                      <a href={`/qr/${draft.slug}?format=png`} download className="text-stone-900 underline underline-offset-4">
                        PNG (1400px)
                      </a>
                      <span className="text-xs text-stone-500">Chop etishda SVG ishlating.</span>
                    </div>
                  </div>

                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-stone-700">
                      Mehmonlar kitobi ({messages.length})
                    </span>
                    {messages.length === 0 ? (
                      <p className="text-sm text-stone-500">Hali tilaklar yo&apos;q.</p>
                    ) : (
                      <ul className="grid gap-2">
                        {messages.map((m) => (
                          <li key={m.id} className={`rounded-md border border-stone-200 p-3 ${m.hidden ? "bg-stone-50 opacity-60" : ""}`}>
                            <p className="text-sm break-words whitespace-pre-line text-stone-800">{m.body}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                              <span>{m.author || "Mehmon"}</span>
                              <span>{m.createdAt}</span>
                              <form action={hideMessage} className="ml-auto">
                                <input type="hidden" name="messageId" value={m.id} />
                                <input type="hidden" name="hidden" value={m.hidden ? "0" : "1"} />
                                <button className="px-1 py-2 underline underline-offset-4 hover:text-stone-900">
                                  {m.hidden ? "Ko'rsatish" : "Yashirish"}
                                </button>
                              </form>
                              <form action={removeMessage}>
                                <input type="hidden" name="messageId" value={m.id} />
                                <button className="px-1 py-2 text-red-600 underline underline-offset-4">O&apos;chirish</button>
                              </form>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <form
                    action={removeInvitation}
                    className="mt-2 rounded-md border border-red-200 p-4"
                    onSubmit={(e) => {
                      if (!confirm("Rostdan ham o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.")) e.preventDefault();
                    }}
                  >
                    <p className="mb-3 text-sm text-stone-600">
                      Taklifnomani o&apos;chirish — havola ishlamay qoladi va barcha tilaklar yo&apos;qoladi.
                    </p>
                    <input type="hidden" name="id" value={draft.id} />
                    <button className="min-h-11 rounded-md border border-red-300 px-5 text-sm font-medium text-red-700 hover:bg-red-50">
                      O&apos;chirish
                    </button>
                  </form>
                </>
              )}

              {busy && <p className="text-sm text-stone-500">Yuklanmoqda…</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── small field primitives ────────────────────────────────────────────── */

function Text({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${input} w-full`} />
      {hint && <span className="mt-1 block truncate text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

function Area({ label, value, onChange, rows = 4, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={`${input} w-full resize-y leading-relaxed`} />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 hover:bg-stone-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 accent-stone-900" />
      <span className="text-sm text-stone-800">{label}</span>
    </label>
  );
}

function FileInput({ accept, multiple, onFiles }: { accept: string; multiple?: boolean; onFiles: (f: FileList | null) => void }) {
  return (
    <input
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={(e) => onFiles(e.target.files)}
      className="block w-full text-sm text-stone-600 file:mr-3 file:min-h-11 file:rounded-md file:border-0 file:bg-stone-900 file:px-4 file:py-2.5 file:text-sm file:text-white"
    />
  );
}

/** Repeatable rows with add/remove. Kept generic so schedule and contacts share
 *  one implementation. */
function Rows<T>({
  rows,
  onChange,
  blank,
  addLabel,
  render,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  blank: T;
  addLabel: string;
  render: (row: T, update: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          {render(row, (next) => onChange(rows.map((r, j) => (j === i ? next : r))))}
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            aria-label="O'chirish"
            className="min-h-11 w-11 shrink-0 rounded-md border border-stone-300 text-stone-500 transition hover:bg-red-50 hover:text-red-600"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, blank])}
        className="min-h-11 justify-self-start rounded-md border border-dashed border-stone-300 px-4 py-2.5 text-sm text-stone-600 transition hover:bg-stone-50"
      >
        {addLabel}
      </button>
    </div>
  );
}
