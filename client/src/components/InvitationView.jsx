import { useRef, useState } from "react";
import { mediaUrl } from "../lib/api";
import { UI, themeOr, formatLongDate, formatTime, parseEventDate } from "../lib/i18n";
import { useReveal } from "../lib/useReveal";
import { Ambient, Calendar, Countdown, Divider, Monogram, MusicPlayer, PageHead } from "./Bits";
import { FloralCorner, FloralDivider, Petals, Sprig } from "./Floral";
import { Gallery, Guestbook } from "./Guestbook";
import EnvelopeGate from "./EnvelopeGate";

/** The invitation: one continuous scroll inside a book-shaped frame.
 *
 *  Rendered by both the public page and the admin's inline editor, so the admin
 *  edits the real thing rather than a preview that can drift.
 *  `onEdit` turns on the pencil affordances; without it they cost nothing. */
export default function InvitationView({ inv, messages = [], showGate = true, onEdit = null }) {
  const [musicOn, setMusicOn] = useState(false);
  const scroller = useRef(null);
  const editing = Boolean(onEdit);

  const t = UI[inv.lang] ?? UI.uz;
  const theme = themeOr(inv.theme);
  const when = parseEventDate(inv.eventDate);
  const names = [inv.groomName, inv.brideName].filter(Boolean);
  const initials = names.map((n) => n[0] ?? "").join("").slice(0, 2) || "❧";

  // A section appears when its toggle is on AND it has content. While editing,
  // empty sections stay so there is something to click the pencil on.
  const has = (toggle, data) => Boolean(toggle) && (data || editing);

  const hasCoords = inv.venueLat != null && inv.venueLng != null;
  const showCountdown = has(inv.showCountdown, !!when);
  const showCalendar = has(inv.showCalendar, !!when);
  const showSchedule = has(inv.showSchedule, inv.schedule?.length > 0);
  const showGallery = has(inv.showGallery, inv.gallery?.length > 0);
  const showContacts = has(inv.showContacts, inv.contacts?.length > 0);
  const showMap = has(inv.showMap, hasCoords || !!inv.venueAddress || !!inv.venueName);
  const showGreeting = Boolean(inv.greetingTitle || inv.greetingBody) || editing;
  const showMusic = Boolean(inv.showMusic && inv.musicUrl);

  const mapQuery = hasCoords
    ? `${inv.venueLat},${inv.venueLng}`
    : encodeURIComponent([inv.venueName, inv.venueAddress].filter(Boolean).join(", "));

  // Re-runs when the draft changes so sections added in the admin get observed.
  useReveal(scroller, [inv, editing]);

  /** Editable region: a pencil in the admin, nothing on the public page. */
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

  return (
    <div data-theme={theme} className="desk relative flex items-center justify-center overflow-hidden p-3 sm:p-6">
      {inv.heroImage && (
        <img src={mediaUrl(inv.heroImage)} alt=""
             className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
      )}
      <Ambient />
      <Petals />

      {/* Definite width: .book is 100% wide, and a bare flex item would resolve
          that against its own content — circular, collapsing the book. */}
      <div className="relative w-full max-w-[30rem]">
        <div className="book">
          <div className="book-block">
            <div className="gutter" aria-hidden />

            {/* One continuous scroll — no page turning. */}
            <div ref={scroller} className="no-bar h-full overflow-x-clip overflow-y-auto overscroll-contain">
              <div className="flex flex-col px-7 pl-9 sm:px-10 sm:pl-12">

                {/* ── Cover ─────────────────────────────────────────── */}
                {/* A definite height, not a percentage: the flex parent is
                    auto-height, so min-h-full would resolve to nothing, the
                    cover would collapse, and every section below it would be on
                    screen at once — killing the scroll reveals. */}
                <section className="relative flex min-h-[min(calc(100dvh-5.5rem),50rem)] flex-col items-center justify-center py-14 text-center">
                  <FloralCorner className="pointer-events-none absolute -top-1 -left-7 w-28 opacity-90 sm:w-36" />
                  <FloralCorner flip className="pointer-events-none absolute -top-1 -right-5 w-24 opacity-80 sm:w-32" />
                  <FloralCorner flip className="pointer-events-none absolute -bottom-2 -left-6 w-20 rotate-180 opacity-60 sm:w-24" />

                  {(inv.epigraph || editing) && (
                    <Edit group="epigraph" label="Epigraf">
                      <p className="mb-5 max-w-xs text-sm leading-relaxed italic" style={{ color: "var(--ink-soft)" }}>
                        {inv.epigraph || "Epigraf qo'shish…"}
                      </p>
                    </Edit>
                  )}

                  {(inv.inviteFrom || editing) && (
                    <Edit group="greeting" label="Kim taklif qiladi">
                      <p className="mb-4 text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--ink-soft)" }}>
                        {inv.inviteFrom || "Kim taklif qiladi…"}
                      </p>
                    </Edit>
                  )}

                  <Edit group="names" label="Kelin-kuyov ismlari">
                    <div>
                      {names.length === 2 && <Monogram left={names[0][0]} right={names[1][0]} />}
                      {/* Great Vibes runs small for its point size, and Uzbek
                          names run long — clamp keeps both on one line. */}
                      <h1 className="font-script mt-1 w-full leading-[1.25] break-words"
                          style={{ color: "var(--accent)", fontSize: "clamp(2.4rem, 13vw, 4.2rem)" }}>
                        {names[0] || (editing ? "Kuyov" : "")}
                        {(names.length === 2 || editing) && (
                          <>
                            <span className="font-display block py-1 text-[0.4em]" style={{ color: "var(--gold)" }}>&amp;</span>
                            {names[1] || (editing ? "Kelin" : "")}
                          </>
                        )}
                      </h1>
                    </div>
                  </Edit>

                  <Divider className="my-5" />

                  <Edit group="date" label="Sana va vaqt">
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="font-display tracking-wide"
                         style={{ color: "var(--accent-deep)", fontSize: "clamp(1.1rem, 4.8vw, 1.7rem)" }}>
                        {when ? formatLongDate(inv.eventDate, inv.lang) : editing ? "Sanani tanlang…" : ""}
                      </p>
                      {when && <p className="text-base tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>{formatTime(inv.eventDate)}</p>}
                    </div>
                  </Edit>

                  <p className="mt-10 animate-bounce text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--ink-soft)" }}>
                    {t.turnHint} ↓
                  </p>
                </section>

                {/* ── Greeting ──────────────────────────────────────── */}
                {showGreeting && (
                  <Section>
                    <PageHead title={inv.greetingTitle || (editing ? "Murojaat" : "")} />
                    <Edit group="greeting" label="Murojaat matni">
                      <p className="dropcap text-[17px] leading-[1.75] whitespace-pre-line" style={{ color: "var(--ink)" }}>
                        {inv.greetingBody || (editing ? "Murojaat matnini yozing…" : "")}
                      </p>
                    </Edit>
                  </Section>
                )}

                {/* ── The day ───────────────────────────────────────── */}
                {(showCountdown || showCalendar) && (
                  <Section>
                    <PageHead title={t.countdownTitle} />
                    <Edit group="date" label="Sana va vaqt">
                      <div className="flex flex-col items-center gap-8">
                        {showCountdown && when && <Countdown target={when.getTime()} lang={inv.lang} />}
                        {showCalendar && when && <Calendar date={when} lang={inv.lang} />}
                      </div>
                    </Edit>
                  </Section>
                )}

                {/* ── Schedule ──────────────────────────────────────── */}
                {showSchedule && (
                  <Section>
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
                              <div className="font-display text-xl" style={{ color: "var(--accent-deep)" }}>{item.time}</div>
                              <div className="text-[15px]" style={{ color: "var(--ink-soft)" }}>{item.title}</div>
                            </div>
                          </li>
                        ))}
                        {!inv.schedule?.length && editing && (
                          <li className="text-sm italic" style={{ color: "var(--ink-soft)" }}>Dastur qo&apos;shing…</li>
                        )}
                      </ol>
                    </Edit>
                  </Section>
                )}

                {/* ── Venue ─────────────────────────────────────────── */}
                {showMap && (
                  <Section>
                    <PageHead title={t.venueTitle} />
                    <Edit group="venue" label="Manzil">
                      <div className="text-center">
                        <p className="font-display text-2xl" style={{ color: "var(--accent-deep)" }}>
                          {inv.venueName || (editing ? "To'yxona nomi…" : "")}
                        </p>
                        {inv.venueAddress && (
                          <p className="mx-auto mt-1.5 max-w-sm text-[15px]" style={{ color: "var(--ink-soft)" }}>{inv.venueAddress}</p>
                        )}
                      </div>
                    </Edit>

                    {hasCoords && (
                      <div className="frame mt-5 overflow-hidden">
                        <iframe title={t.venueTitle} className="block h-48 w-full" loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${inv.venueLng - 0.006},${inv.venueLat - 0.004},${inv.venueLng + 0.006},${inv.venueLat + 0.004}&layer=mapnik&marker=${inv.venueLat},${inv.venueLng}`} />
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                      <a href={hasCoords ? `https://yandex.com/maps/?pt=${inv.venueLng},${inv.venueLat}&z=17&l=map` : `https://yandex.com/maps/?text=${mapQuery}`}
                         target="_blank" rel="noopener noreferrer"
                         className="frame inline-flex min-h-11 items-center px-4 text-sm transition hover:opacity-80"
                         style={{ color: "var(--accent-deep)" }}>{t.openInYandex}</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                         target="_blank" rel="noopener noreferrer"
                         className="frame inline-flex min-h-11 items-center px-4 text-sm transition hover:opacity-80"
                         style={{ color: "var(--accent-deep)" }}>{t.openInGoogle}</a>
                    </div>
                  </Section>
                )}

                {/* ── Gallery ───────────────────────────────────────── */}
                {showGallery && (
                  <Section>
                    <PageHead title={t.galleryTitle} />
                    <Edit group="gallery" label="Galereya">
                      {inv.gallery?.length
                        ? <Gallery images={inv.gallery} />
                        : <p className="text-center text-sm italic" style={{ color: "var(--ink-soft)" }}>Surat qo&apos;shing…</p>}
                    </Edit>
                  </Section>
                )}

                {/* ── Contacts ──────────────────────────────────────── */}
                {showContacts && (
                  <Section>
                    <PageHead title={t.contactsTitle} />
                    <Edit group="contacts" label="Aloqa raqamlari">
                      {/* Slightly rotated, like notes tucked into the book. */}
                      <div className="flex flex-wrap justify-center gap-3">
                        {(inv.contacts ?? []).map((c, i) => (
                          <a key={i} href={`tel:${String(c.phone).replace(/[^\d+]/g, "")}`}
                             className="frame min-w-[136px] px-4 py-3 text-center transition hover:rotate-0 hover:opacity-80"
                             style={{ transform: `rotate(${i % 2 === 0 ? -1.3 : 1.1}deg)`,
                                      background: "color-mix(in srgb, var(--paper-2) 55%, transparent)" }}>
                            <div className="font-display text-lg" style={{ color: "var(--accent-deep)" }}>{c.name}</div>
                            <div className="mt-0.5 text-sm tracking-wide" style={{ color: "var(--ink-soft)" }}>{c.phone}</div>
                          </a>
                        ))}
                        {!inv.contacts?.length && editing && (
                          <p className="text-sm italic" style={{ color: "var(--ink-soft)" }}>Raqam qo&apos;shing…</p>
                        )}
                      </div>
                    </Edit>
                  </Section>
                )}

                {/* ── Guestbook ─────────────────────────────────────── */}
                {inv.showGuestbook && (
                  <Section>
                    <PageHead title={t.guestbookTitle} />
                    <Guestbook slug={inv.slug} lang={inv.lang} messages={messages.filter((m) => !m.hidden)} />
                  </Section>
                )}

                {/* ── Closing ───────────────────────────────────────── */}
                <FloralDivider className="py-2" />
                <section className="fade-up relative flex flex-col items-center pt-4 pb-16 text-center">
                  <Sprig className="pointer-events-none absolute -top-2 -left-5 w-12 opacity-70" />
                  <Sprig flip className="pointer-events-none absolute -top-2 -right-5 w-12 opacity-70" />
                  <p className="font-script mt-4" style={{ color: "var(--accent)", fontSize: "clamp(1.9rem, 10vw, 3rem)" }}>
                    {t.theBigDay}
                  </p>
                  {names.length > 0 && (
                    <p className="font-display mt-5 text-base tracking-[0.25em]" style={{ color: "var(--accent-deep)" }}>
                      {names.join(" & ")}
                    </p>
                  )}
                  <Divider className="mt-7" />
                </section>
              </div>
            </div>
          </div>
          <div className="stitch" aria-hidden />
        </div>

        {showMusic && <MusicPlayer src={mediaUrl(inv.musicUrl)} label={t.musicOn} startSignal={musicOn} />}

        {showGate && (
          <EnvelopeGate names={names.join(" & ") || "❧"} initials={initials}
                        dateLine={when ? formatLongDate(inv.eventDate, inv.lang) : ""}
                        hint={t.openLetter} onOpen={() => setMusicOn(true)} />
        )}
      </div>
    </div>
  );
}

/** A scroll section: a floral divider above it, then its content fading up as
 *  it scrolls into view. */
function Section({ children }) {
  return (
    <>
      <FloralDivider className="py-2" />
      <section className="fade-up pt-2 pb-10">{children}</section>
    </>
  );
}
