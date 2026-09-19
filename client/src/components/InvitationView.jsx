import { useState } from "react";
import { mediaUrl } from "../lib/api";
import { UI, themeOr, formatLongDate, formatTime, parseEventDate } from "../lib/i18n";
import { Ambient, Calendar, Corner, Countdown, Divider, Monogram, MusicPlayer, PageHead } from "./Bits";
import { Gallery, GiftCard, Guestbook } from "./Guestbook";
import EnvelopeGate from "./EnvelopeGate";
import Book from "./Book";

/** The invitation. Rendered by both the public page and the admin's inline
 *  editor, so the admin always edits the real thing rather than a preview that
 *  can drift out of sync.
 *
 *  `onEdit` turns on the pencil affordances; without it they cost nothing. */
export default function InvitationView({ inv, messages = [], showGate = true, onEdit = null }) {
  const [musicOn, setMusicOn] = useState(false);
  const editing = Boolean(onEdit);

  const t = UI[inv.lang] ?? UI.uz;
  const theme = themeOr(inv.theme);
  const when = parseEventDate(inv.eventDate);
  const names = [inv.groomName, inv.brideName].filter(Boolean);
  const initials = names.map((n) => n[0] ?? "").join("").slice(0, 2) || "❧";

  // A page appears when its toggle is on AND it has content. While editing,
  // empty pages stay so there is something to click the pencil on.
  const has = (toggle, data) => Boolean(toggle) && (data || editing);

  const hasCoords = inv.venueLat != null && inv.venueLng != null;
  const showCountdown = has(inv.showCountdown, !!when);
  const showCalendar = has(inv.showCalendar, !!when);
  const showSchedule = has(inv.showSchedule, inv.schedule?.length > 0);
  const showGallery = has(inv.showGallery, inv.gallery?.length > 0);
  const showContacts = has(inv.showContacts, inv.contacts?.length > 0);
  const showGift = has(inv.showGift, !!inv.giftCardNumber);
  const showMap = has(inv.showMap, hasCoords || !!inv.venueAddress || !!inv.venueName);
  const showGreeting = Boolean(inv.greetingTitle || inv.greetingBody) || editing;
  const showMusic = Boolean(inv.showMusic && inv.musicUrl);

  const mapQuery = hasCoords
    ? `${inv.venueLat},${inv.venueLng}`
    : encodeURIComponent([inv.venueName, inv.venueAddress].filter(Boolean).join(", "));

  /** Wraps an editable region: a pencil in the admin, nothing on the public page. */
  const Edit = ({ group, label, children }) => {
    if (!editing) return children;
    return (
      <div className="relative">
        {children}
        <button type="button" onClick={() => onEdit(group)} aria-label={`${label} — tahrirlash`} title={label}
          className="absolute -top-2 -right-1 z-20 flex h-8 w-8 items-center justify-center rounded-full text-xs shadow-md transition hover:scale-110"
          style={{ background: "var(--accent)", color: "var(--paper)" }}>✎</button>
      </div>
    );
  };

  const leaves = [];
  const add = (key, label, node) => leaves.push({ key, label, node });

  /* ── 1. Cover ─────────────────────────────────────────────────────── */
  add("cover", t.coverPage, (
    <div className="relative flex flex-col items-center text-center">
      <Corner className="pointer-events-none absolute -top-3 -left-2 h-12 w-12 sm:h-16 sm:w-16" />
      <Corner className="pointer-events-none absolute -top-3 -right-2 h-12 w-12 rotate-90 sm:h-16 sm:w-16" />

      {(inv.epigraph || editing) && (
        <Edit group="epigraph" label="Epigraf">
          <p className="mb-5 max-w-xs text-xs leading-relaxed italic sm:text-sm" style={{ color: "var(--ink-soft)" }}>
            {inv.epigraph || "Epigraf qo'shish…"}
          </p>
        </Edit>
      )}

      {(inv.inviteFrom || editing) && (
        <Edit group="greeting" label="Kim taklif qiladi">
          <p className="mb-4 text-[9px] tracking-[0.3em] uppercase sm:text-[11px]" style={{ color: "var(--ink-soft)" }}>
            {inv.inviteFrom || "Kim taklif qiladi…"}
          </p>
        </Edit>
      )}

      <Edit group="names" label="Kelin-kuyov ismlari">
        <div>
          {names.length === 2 && <Monogram left={names[0][0]} right={names[1][0]} />}
          {/* Uzbek names run long (Muhammadaziz, Gulnorabonu) — clamp scales the
              type rather than letting it overflow a narrow page. */}
          <h1 className="font-display mt-1 w-full leading-[1.08] break-words"
              style={{ fontSize: "clamp(1.9rem, 9vw, 3.4rem)" }}>
            <span className="foil">{names[0] || (editing ? "Kuyov" : "")}</span>
            {(names.length === 2 || editing) && (
              <>
                <span className="font-script block py-0.5 sm:inline sm:px-3 sm:py-0"
                      style={{ color: "var(--accent)", fontSize: "clamp(1.2rem, 5vw, 2rem)" }}>&amp;</span>
                <span className="foil">{names[1] || (editing ? "Kelin" : "")}</span>
              </>
            )}
          </h1>
        </div>
      </Edit>

      <Divider className="my-5" />

      <Edit group="date" label="Sana va vaqt">
        <div className="flex flex-col items-center gap-0.5">
          <p className="font-display tracking-wide"
             style={{ color: "var(--accent-deep)", fontSize: "clamp(1rem, 4.4vw, 1.6rem)" }}>
            {when ? formatLongDate(inv.eventDate, inv.lang) : editing ? "Sanani tanlang…" : ""}
          </p>
          {when && <p className="text-sm tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>{formatTime(inv.eventDate)}</p>}
        </div>
      </Edit>

      <p className="mt-8 text-[9px] tracking-[0.3em] uppercase" style={{ color: "var(--ink-soft)" }}>
        {t.turnHint} →
      </p>
    </div>
  ));

  /* ── 2. Greeting ──────────────────────────────────────────────────── */
  if (showGreeting) {
    add("greeting", inv.greetingTitle || "Murojaat", (
      <>
        <PageHead title={inv.greetingTitle || (editing ? "Murojaat" : "")} />
        <Edit group="greeting" label="Murojaat matni">
          <p className="dropcap text-[16px] leading-[1.8] whitespace-pre-line" style={{ color: "var(--ink)" }}>
            {inv.greetingBody || (editing ? "Murojaat matnini yozing…" : "")}
          </p>
        </Edit>
      </>
    ));
  }

  /* ── 3. The day ───────────────────────────────────────────────────── */
  if (showCountdown || showCalendar) {
    add("day", t.countdownTitle, (
      <>
        <PageHead title={t.countdownTitle} />
        <Edit group="date" label="Sana va vaqt">
          <div className="flex flex-col items-center gap-8">
            {showCountdown && when && <Countdown target={when.getTime()} lang={inv.lang} />}
            {showCalendar && when && <Calendar date={when} lang={inv.lang} />}
          </div>
        </Edit>
      </>
    ));
  }

  /* ── 4. Schedule ──────────────────────────────────────────────────── */
  if (showSchedule) {
    add("schedule", t.scheduleTitle, (
      <>
        <PageHead title={t.scheduleTitle} />
        <Edit group="schedule" label="Tadbir dasturi">
          <ol className="mx-auto max-w-sm">
            {(inv.schedule ?? []).map((item, i) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="mt-2 h-2.5 w-2.5 rotate-45" style={{ background: "var(--gold)" }} />
                  {i < inv.schedule.length - 1 && (
                    <span className="mt-1 w-px flex-1" style={{ background: "color-mix(in srgb, var(--gold) 45%, transparent)" }} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-display text-lg" style={{ color: "var(--accent-deep)" }}>{item.time}</div>
                  <div className="text-sm" style={{ color: "var(--ink-soft)" }}>{item.title}</div>
                </div>
              </li>
            ))}
            {!inv.schedule?.length && editing && (
              <li className="text-sm italic" style={{ color: "var(--ink-soft)" }}>Dastur qo&apos;shing…</li>
            )}
          </ol>
        </Edit>
      </>
    ));
  }

  /* ── 5. Venue ─────────────────────────────────────────────────────── */
  if (showMap) {
    add("venue", t.venueTitle, (
      <>
        <PageHead title={t.venueTitle} />
        <Edit group="venue" label="Manzil">
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl" style={{ color: "var(--accent-deep)" }}>
              {inv.venueName || (editing ? "To'yxona nomi…" : "")}
            </p>
            {inv.venueAddress && (
              <p className="mx-auto mt-1.5 max-w-sm text-sm" style={{ color: "var(--ink-soft)" }}>{inv.venueAddress}</p>
            )}
          </div>
        </Edit>

        {hasCoords && (
          <div className="frame mt-5 overflow-hidden">
            <iframe title={t.venueTitle} className="block h-48 w-full sm:h-56" loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${inv.venueLng - 0.006},${inv.venueLat - 0.004},${inv.venueLng + 0.006},${inv.venueLat + 0.004}&layer=mapnik&marker=${inv.venueLat},${inv.venueLng}`} />
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <a href={hasCoords ? `https://yandex.com/maps/?pt=${inv.venueLng},${inv.venueLat}&z=17&l=map` : `https://yandex.com/maps/?text=${mapQuery}`}
             target="_blank" rel="noopener noreferrer"
             className="frame inline-flex min-h-11 items-center px-4 text-xs transition hover:opacity-80"
             style={{ color: "var(--accent-deep)" }}>{t.openInYandex}</a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
             target="_blank" rel="noopener noreferrer"
             className="frame inline-flex min-h-11 items-center px-4 text-xs transition hover:opacity-80"
             style={{ color: "var(--accent-deep)" }}>{t.openInGoogle}</a>
        </div>
      </>
    ));
  }

  /* ── 6. Gallery ───────────────────────────────────────────────────── */
  if (showGallery) {
    add("gallery", t.galleryTitle, (
      <>
        <PageHead title={t.galleryTitle} />
        <Edit group="gallery" label="Galereya">
          {inv.gallery?.length
            ? <Gallery images={inv.gallery} />
            : <p className="text-center text-sm italic" style={{ color: "var(--ink-soft)" }}>Surat qo&apos;shing…</p>}
        </Edit>
      </>
    ));
  }

  /* ── 7. Contacts ──────────────────────────────────────────────────── */
  if (showContacts) {
    add("contacts", t.contactsTitle, (
      <>
        <PageHead title={t.contactsTitle} />
        <Edit group="contacts" label="Aloqa raqamlari">
          {/* Slightly rotated, like notes tucked into the book. */}
          <div className="flex flex-wrap justify-center gap-3">
            {(inv.contacts ?? []).map((c, i) => (
              <a key={i} href={`tel:${String(c.phone).replace(/[^\d+]/g, "")}`}
                 className="frame min-w-[136px] px-4 py-3 text-center transition hover:rotate-0 hover:opacity-80"
                 style={{ transform: `rotate(${i % 2 === 0 ? -1.3 : 1.1}deg)`,
                          background: "color-mix(in srgb, var(--paper-2) 55%, transparent)" }}>
                <div className="font-display text-base" style={{ color: "var(--accent-deep)" }}>{c.name}</div>
                <div className="mt-0.5 text-xs tracking-wide" style={{ color: "var(--ink-soft)" }}>{c.phone}</div>
              </a>
            ))}
            {!inv.contacts?.length && editing && (
              <p className="text-sm italic" style={{ color: "var(--ink-soft)" }}>Raqam qo&apos;shing…</p>
            )}
          </div>
        </Edit>
      </>
    ));
  }

  /* ── 8. Gift ──────────────────────────────────────────────────────── */
  if (showGift) {
    add("gift", t.giftTitle, (
      <>
        <PageHead title={t.giftTitle} />
        <Edit group="gift" label="To'y sovg'asi">
          {inv.giftCardNumber
            ? <GiftCard number={inv.giftCardNumber} holder={inv.giftCardHolder} lang={inv.lang} />
            : <p className="text-center text-sm italic" style={{ color: "var(--ink-soft)" }}>Karta raqamini kiriting…</p>}
        </Edit>
      </>
    ));
  }

  /* ── 9. Guestbook ─────────────────────────────────────────────────── */
  if (inv.showGuestbook) {
    add("guestbook", t.guestbookTitle, (
      <>
        <PageHead title={t.guestbookTitle} />
        <Guestbook slug={inv.slug} lang={inv.lang} messages={messages.filter((m) => !m.hidden)} />
      </>
    ));
  }

  /* ── 10. Closing ──────────────────────────────────────────────────── */
  add("closing", t.theBigDay, (
    <div className="flex flex-col items-center text-center">
      <Divider />
      <p className="font-script mt-6" style={{ color: "var(--accent)", fontSize: "clamp(1.6rem, 7vw, 2.6rem)" }}>
        {t.theBigDay}
      </p>
      {names.length > 0 && (
        <p className="font-display mt-5 text-base tracking-[0.25em]" style={{ color: "var(--accent-deep)" }}>
          {names.join(" & ")}
        </p>
      )}
      <Divider className="mt-6" />
    </div>
  ));

  return (
    <div data-theme={theme} className="desk relative flex items-center justify-center overflow-hidden p-3 sm:p-6">
      {inv.heroImage && (
        <img src={mediaUrl(inv.heroImage)} alt=""
             className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
      )}
      <Ambient />

      {/* The width must be definite here: .book sizes itself at 100%, and a bare
          flex item would resolve that against its own content — circular,
          collapsing the book to a sliver. */}
      <div className="relative w-full max-w-[30rem]">
        <Book leaves={leaves} labels={{ prev: t.prevPage, next: t.nextPage, pages: t.pages }} />

        {showGate && (
          <EnvelopeGate names={names.join(" & ") || "❧"} initials={initials}
                        dateLine={when ? formatLongDate(inv.eventDate, inv.lang) : ""}
                        hint={t.openLetter} onOpen={() => setMusicOn(true)} />
        )}
        {showMusic && <MusicPlayer src={mediaUrl(inv.musicUrl)} label={t.musicOn} startSignal={musicOn} />}
      </div>
    </div>
  );
}
