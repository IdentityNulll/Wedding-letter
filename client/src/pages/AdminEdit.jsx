import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mediaUrl, qrUrl } from "../lib/api";
import { THEMES } from "../lib/i18n";
import InvitationView from "../components/InvitationView";
import LocationPicker from "../components/LocationPicker";

// Carries NO width — callers set their own. Baking w-full in here would beat
// any narrower w-* a caller adds (CSS source order wins, not class order), so a
// w-24 field would stay full width and shove the sheet off screen.
const field =
  "min-h-11 min-w-0 rounded-md border border-stone-300 bg-white px-3 py-2.5 text-[16px] text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

const TITLES = {
  manage: "Havola, QR va boshqaruv",
  theme: "Sozlamalar",
  names: "Kelin va kuyov",
  epigraph: "Epigraf",
  date: "Sana va vaqt",
  greeting: "Murojaat",
  venue: "Manzil",
  schedule: "Tadbir dasturi",
  contacts: "Aloqa raqamlari",
  gallery: "Galereya",
};

/** The admin edits the real invitation in place: the live book is rendered from
 *  `draft`, so every keystroke shows in the actual design. Nothing reaches the
 *  database until Save — the editor is a staging copy. */
export default function AdminEdit() {
  const { id } = useParams();
  const nav = useNavigate();

  const [draft, setDraft] = useState(null);
  const [messages, setMessages] = useState([]);
  const [panel, setPanel] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(id).then((d) => { setDraft(d.invitation); setMessages(d.messages); }).catch(() => nav("/admin"));
  }, [id, nav]);

  const set = (key, value) => { setDraft((d) => ({ ...d, [key]: value })); setDirty(true); setNote(""); };

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const { invitation } = await api.update(id, draft);
      setDraft(invitation);
      setDirty(false);
      setNote("Saqlandi");
    } catch {
      setNote("Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }, [draft, id]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    }
    function onLeave(e) { if (dirty) e.preventDefault(); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty, saving, save]);

  async function upload(files, done) {
    if (!files?.length) return;
    setBusy(true);
    try {
      done((await api.upload(files)).paths);
      setDirty(true);
    } catch (err) {
      setNote(err.message || "Yuklashda xatolik");
    }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm("Rostdan ham o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.")) return;
    await api.remove(id);
    nav("/admin");
  }

  if (!draft) return <main className="min-h-[100dvh] bg-stone-900" />;

  const publicUrl = `${location.origin}/${draft.slug}`;

  return (
    <div className="overflow-x-clip bg-stone-900">
      <header className="flex h-[3.25rem] items-center gap-2 px-3 text-white sm:px-5">
        <Link to="/admin" className="shrink-0 rounded px-2 py-2 text-sm text-stone-300 hover:text-white">←</Link>
        <span className="min-w-0 flex-1 truncate text-sm text-stone-300">
          {[draft.groomName, draft.brideName].filter(Boolean).join(" & ") || "Nomsiz"}
        </span>
        {note && <span className="shrink-0 text-xs text-green-400">{note}</span>}
        <button onClick={() => setPanel("manage")} className="shrink-0 rounded-md border border-stone-600 px-3 py-2 text-xs text-stone-200 hover:bg-stone-800">Havola</button>
        <button onClick={() => setPanel("venue")} className="shrink-0 rounded-md border border-stone-600 px-3 py-2 text-xs text-stone-200 hover:bg-stone-800">Manzil</button>
        <button onClick={() => setPanel("theme")} className="shrink-0 rounded-md border border-stone-600 px-3 py-2 text-xs text-stone-200 hover:bg-stone-800">Sozlamalar</button>
        <button onClick={save} disabled={saving || !dirty}
                className="shrink-0 rounded-md bg-white px-4 py-2 text-xs font-medium text-stone-900 disabled:opacity-40">
          {saving ? "…" : dirty ? "Saqlash" : "Saqlangan"}
        </button>
      </header>

      <div style={{ height: "calc(100dvh - 3.25rem)" }}>
        <InvitationView inv={draft} messages={messages} showGate={false} onEdit={setPanel} />
      </div>

      {panel && (
        <>
          <button aria-label="Yopish" onClick={() => setPanel(null)} className="fixed inset-0 z-40 bg-black/40" />
          {/* overflow-x-clip is a backstop: a stray wide field gets clipped here
              instead of shoving the whole document sideways. */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[82dvh] overflow-x-clip overflow-y-auto rounded-t-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3">
              <h2 className="font-medium text-stone-900">{TITLES[panel]}</h2>
              <button onClick={() => setPanel(null)} className="min-h-11 rounded-md px-3 text-sm text-stone-500 hover:text-stone-900">Tayyor</button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-5 py-5" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
              {panel === "names" && (
                <>
                  <Text label="Kuyov ismi" value={draft.groomName} onChange={(v) => set("groomName", v)} placeholder="Azizbek" />
                  <Text label="Kelin ismi" value={draft.brideName} onChange={(v) => set("brideName", v)} placeholder="Nargiza" />
                </>
              )}

              {panel === "epigraph" && (
                <Area label="Epigraf (oyat yoki she'r)" rows={3} value={draft.epigraph} onChange={(v) => set("epigraph", v)} />
              )}

              {panel === "date" && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-stone-700">To&apos;y sanasi va vaqti</span>
                  <input type="datetime-local" value={draft.eventDate} onChange={(e) => set("eventDate", e.target.value)} className={`${field} w-full`} />
                  <span className="mt-1 block text-xs text-stone-500">Mahalliy vaqt bo&apos;yicha.</span>
                </label>
              )}

              {panel === "greeting" && (
                <>
                  <Text label="Kim taklif qiladi" value={draft.inviteFrom} onChange={(v) => set("inviteFrom", v)} placeholder="Karimovlar oilasi nomidan" />
                  <Text label="Murojaat sarlavhasi" value={draft.greetingTitle} onChange={(v) => set("greetingTitle", v)} placeholder="Hurmatli mehmonlar!" />
                  <Area label="Murojaat matni" rows={6} value={draft.greetingBody} onChange={(v) => set("greetingBody", v)} />
                </>
              )}

              {panel === "venue" && (
                <LocationPicker
                  name={draft.venueName} address={draft.venueAddress}
                  lat={draft.venueLat} lng={draft.venueLng}
                  onNameChange={(v) => set("venueName", v)}
                  onAddressChange={(v) => set("venueAddress", v)}
                  onPick={(r) => {
                    setDraft((d) => ({ ...d, venueName: r.name, venueAddress: r.address, venueLat: r.lat, venueLng: r.lng }));
                    setDirty(true);
                  }} />
              )}

              {panel === "schedule" && (
                <Rows rows={draft.schedule ?? []} onChange={(r) => set("schedule", r)}
                      blank={{ time: "", title: "" }} addLabel="+ Qator qo'shish"
                      render={(row, update) => (
                        <>
                          <input value={row.time} onChange={(e) => update({ ...row, time: e.target.value })}
                                 placeholder="18:00" className={`${field} w-24 shrink-0`} />
                          <input value={row.title} onChange={(e) => update({ ...row, title: e.target.value })}
                                 placeholder="Mehmonlarni kutib olish" className={`${field} w-full`} />
                        </>
                      )} />
              )}

              {panel === "contacts" && (
                <Rows rows={draft.contacts ?? []} onChange={(r) => set("contacts", r)}
                      blank={{ name: "", phone: "" }} addLabel="+ Raqam qo'shish"
                      render={(row, update) => (
                        <>
                          <input value={row.name} onChange={(e) => update({ ...row, name: e.target.value })}
                                 placeholder="Akmal aka" className={`${field} w-full`} />
                          <input value={row.phone} onChange={(e) => update({ ...row, phone: e.target.value })}
                                 placeholder="+998 90 123 45 67" inputMode="tel" className={`${field} w-full`} />
                        </>
                      )} />
              )}

              {panel === "gallery" && (
                <>
                  {draft.gallery?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {draft.gallery.map((src, i) => (
                        <div key={src} className="relative">
                          <img src={mediaUrl(src)} alt="" className="h-20 w-20 rounded object-cover ring-1 ring-stone-200" />
                          <button onClick={() => set("gallery", draft.gallery.filter((_, j) => j !== i))}
                                  aria-label="O'chirish"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-stone-600 shadow ring-1 ring-stone-200 hover:text-red-600">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <FileInput accept="image/*" multiple onFiles={(f) => upload(f, (p) => set("gallery", [...(draft.gallery ?? []), ...p]))} />
                  <Toggle label="Galereya ko'rinsin" checked={draft.showGallery} onChange={(v) => set("showGallery", v)} />
                </>
              )}

              {panel === "theme" && (
                <>
                  <button type="button" onClick={() => setPanel("venue")}
                          className="flex min-h-11 items-center justify-between rounded-md border border-stone-300 px-3 text-left text-sm text-stone-800 hover:bg-stone-50">
                    <span>
                      <span className="block font-medium">To&apos;y joyi va xarita</span>
                      <span className="mt-0.5 block text-xs text-stone-500">Google yoki Yandex Maps orqali joy tanlang</span>
                    </span>
                    <span aria-hidden>→</span>
                  </button>

                  <div>
                    <span className="mb-2 block text-sm font-medium text-stone-700">Dizayn rangi</span>
                    <div className="grid grid-cols-2 gap-2">
                      {THEMES.map((t) => (
                        <button key={t.id} onClick={() => set("theme", t.id)} aria-pressed={draft.theme === t.id}
                                className={`flex items-center gap-2.5 rounded-lg border-2 p-2.5 text-left ${draft.theme === t.id ? "border-stone-900 bg-stone-50" : "border-stone-200"}`}>
                          <span className="flex shrink-0 gap-0.5" aria-hidden>
                            {t.swatch.map((c) => <span key={c} className="h-7 w-2.5 rounded-sm ring-1 ring-black/10" style={{ background: c }} />)}
                          </span>
                          <span className="min-w-0 text-xs leading-tight text-stone-700">{t.label[draft.lang]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-stone-700">Til</span>
                    <select value={draft.lang} onChange={(e) => set("lang", e.target.value)} className={`${field} w-full`}>
                      <option value="uz">O&apos;zbekcha (lotin)</option>
                      <option value="ru">Ruscha / Kirill</option>
                    </select>
                  </label>

                  <Text label="Havola manzili (slug)" value={draft.slug} onChange={(v) => set("slug", v)} hint={publicUrl} />

                  <div>
                    <span className="mb-1 block text-sm font-medium text-stone-700">Fon rasmi</span>
                    {draft.heroImage && (
                      <div className="mb-2 flex items-center gap-3">
                        <img src={mediaUrl(draft.heroImage)} alt="" className="h-16 w-24 rounded object-cover ring-1 ring-stone-200" />
                        <button onClick={() => set("heroImage", "")} className="text-sm text-red-600 underline">O&apos;chirish</button>
                      </div>
                    )}
                    <FileInput accept="image/*" onFiles={(f) => upload(f, (p) => p[0] && set("heroImage", p[0]))} />
                  </div>

                  <div>
                    <span className="mb-1 block text-sm font-medium text-stone-700">Fon musiqasi</span>
                    {draft.musicUrl && (
                      <div className="mb-2 flex items-center gap-3">
                        <audio src={mediaUrl(draft.musicUrl)} controls className="h-10 max-w-full" />
                        <button onClick={() => set("musicUrl", "")} className="shrink-0 text-sm text-red-600 underline">O&apos;chirish</button>
                      </div>
                    )}
                    <FileInput accept="audio/*" onFiles={(f) => upload(f, (p) => p[0] && set("musicUrl", p[0]))} />
                  </div>

                  <fieldset>
                    <legend className="mb-1 text-sm font-medium text-stone-700">Qaysi sahifalar ko&apos;rinsin</legend>
                    <p className="mb-2 text-xs text-stone-500">Yoqilgan sahifa ma&apos;lumoti bo&apos;sh bo&apos;lsa, mehmonlarga ko&apos;rinmaydi.</p>
                    <div className="grid gap-0.5">
                      <Toggle label="Faol (mehmonlar ko'ra oladi)" checked={draft.published} onChange={(v) => set("published", v)} />
                      <Toggle label="Sanoq" checked={draft.showCountdown} onChange={(v) => set("showCountdown", v)} />
                      <Toggle label="Kalendar" checked={draft.showCalendar} onChange={(v) => set("showCalendar", v)} />
                      <Toggle label="Xarita va manzil" checked={draft.showMap} onChange={(v) => set("showMap", v)} />
                      <Toggle label="Tadbir dasturi" checked={draft.showSchedule} onChange={(v) => set("showSchedule", v)} />
                      <Toggle label="Galereya" checked={draft.showGallery} onChange={(v) => set("showGallery", v)} />
                      <Toggle label="Aloqa raqamlari" checked={draft.showContacts} onChange={(v) => set("showContacts", v)} />
                      <Toggle label="Fon musiqasi" checked={draft.showMusic} onChange={(v) => set("showMusic", v)} />
                      <Toggle label="Mehmonlar kitobi" checked={draft.showGuestbook} onChange={(v) => set("showGuestbook", v)} />
                    </div>
                  </fieldset>
                </>
              )}

              {panel === "manage" && (
                <>
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-stone-700">Mehmonlar uchun havola</span>
                    <div className="flex gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-md bg-stone-100 px-3 py-2.5 text-sm text-stone-700">{publicUrl}</code>
                      <button onClick={async () => {
                        try { await navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* selectable above */ }
                      }} className="min-h-11 shrink-0 rounded-md border border-stone-300 px-4 text-sm text-stone-700 hover:bg-stone-50">
                        {copied ? "✓" : "Nusxa"}
                      </button>
                    </div>
                    {dirty && <p className="mt-1.5 text-xs text-amber-700">Saqlanmagan o&apos;zgarishlar bor — havola saqlagandan keyin ishlaydi.</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 rounded-md bg-stone-50 p-4">
                    <img src={qrUrl(draft.slug, "svg")} alt="QR" className="h-28 w-28 rounded bg-white p-1.5 ring-1 ring-stone-200" />
                    <div className="flex flex-col gap-2 text-sm">
                      <a href={qrUrl(draft.slug, "svg")} download className="text-stone-900 underline underline-offset-4">SVG (chop etish uchun)</a>
                      <a href={qrUrl(draft.slug, "png")} download className="text-stone-900 underline underline-offset-4">PNG (1400px)</a>
                      <span className="text-xs text-stone-500">Chop etishda SVG ishlating.</span>
                    </div>
                  </div>

                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-stone-700">Mehmonlar kitobi ({messages.length})</span>
                    {messages.length === 0 ? (
                      <p className="text-sm text-stone-500">Hali tilaklar yo&apos;q.</p>
                    ) : (
                      <ul className="grid gap-2">
                        {messages.map((m) => (
                          <li key={m._id} className={`rounded-md border border-stone-200 p-3 ${m.hidden ? "bg-stone-50 opacity-60" : ""}`}>
                            <p className="text-sm break-words whitespace-pre-line text-stone-800">{m.body}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                              <span>{m.author || "Mehmon"}</span>
                              <button onClick={async () => {
                                const { message } = await api.hideMessage(m._id, !m.hidden);
                                setMessages((list) => list.map((x) => (x._id === m._id ? message : x)));
                              }} className="ml-auto px-1 py-2 underline underline-offset-4 hover:text-stone-900">
                                {m.hidden ? "Ko'rsatish" : "Yashirish"}
                              </button>
                              <button onClick={async () => {
                                if (!confirm("Bu tilakni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.")) return;
                                try {
                                  await api.deleteMessage(m._id);
                                  setMessages((list) => list.filter((x) => x._id !== m._id));
                                } catch (err) {
                                  setNote(err.message || "O'chirishda xatolik");
                                }
                              }} className="px-1 py-2 text-red-600 underline underline-offset-4">O&apos;chirish</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-md border border-red-200 p-4">
                    <p className="mb-3 text-sm text-stone-600">
                      Taklifnomani o&apos;chirish — havola ishlamay qoladi va barcha tilaklar yo&apos;qoladi.
                    </p>
                    <button onClick={remove} className="min-h-11 rounded-md border border-red-300 px-5 text-sm font-medium text-red-700 hover:bg-red-50">
                      O&apos;chirish
                    </button>
                  </div>
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

/* ── field primitives ──────────────────────────────────────────────────── */

function Text({ label, value, onChange, placeholder, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${field} w-full`} />
      {hint && <span className="mt-1 block truncate text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

function Area({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
                className={`${field} w-full resize-y leading-relaxed`} />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 hover:bg-stone-50">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 accent-stone-900" />
      <span className="text-sm text-stone-800">{label}</span>
    </label>
  );
}

function FileInput({ accept, multiple, onFiles }) {
  return (
    <input type="file" accept={accept} multiple={multiple} onChange={(e) => onFiles(e.target.files)}
           className="block w-full text-sm text-stone-600 file:mr-3 file:min-h-11 file:rounded-md file:border-0 file:bg-stone-900 file:px-4 file:py-2.5 file:text-sm file:text-white" />
  );
}

/** Repeatable rows, shared by schedule and contacts. */
function Rows({ rows, onChange, blank, addLabel, render }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          {render(row, (next) => onChange(rows.map((r, j) => (j === i ? next : r))))}
          <button onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="O'chirish"
                  className="min-h-11 w-11 shrink-0 rounded-md border border-stone-300 text-stone-500 hover:bg-red-50 hover:text-red-600">×</button>
        </div>
      ))}
      <button onClick={() => onChange([...rows, blank])}
              className="min-h-11 justify-self-start rounded-md border border-dashed border-stone-300 px-4 text-sm text-stone-600 hover:bg-stone-50">
        {addLabel}
      </button>
    </div>
  );
}
