"use client";

import type { ReactNode } from "react";
import { themeOr } from "@/lib/themes";
import { UI, type GuestMessage, type Invitation } from "@/lib/types";
import { formatLongDate, formatTime, parseEventDate } from "@/lib/format";
import { Corner, Divider, Monogram } from "@/components/Ornament";
import Ambient from "@/components/Ambient";
import Countdown from "@/components/Countdown";
import Calendar from "@/components/Calendar";
import Gallery from "@/components/Gallery";
import GiftCard from "@/components/GiftCard";
import Guestbook from "@/components/Guestbook";
import MusicPlayer from "@/components/MusicPlayer";
import EnvelopeGate from "@/components/EnvelopeGate";
import Book, { type Leaf } from "./Book";
import { Edit, useEdit } from "./EditContext";

/** The invitation, as a book: one section per page.
 *
 *  Rendered verbatim by both the public page and the admin's inline editor, so
 *  the admin is editing the real thing rather than a preview that can drift. */
export default function InvitationView({
  inv,
  messages,
  showGate = true,
}: {
  inv: Invitation;
  messages: GuestMessage[];
  /** The admin skips the envelope; it would need reopening after every edit. */
  showGate?: boolean;
}) {
  const { active: editing } = useEdit();
  const t = UI[inv.lang];
  const theme = themeOr(inv.theme);
  const when = parseEventDate(inv.eventDate);
  const names = [inv.groomName, inv.brideName].filter(Boolean);

  // A page appears when its toggle is on AND it has content. While editing,
  // empty pages stay so there is something to click the pencil on.
  const has = (toggle: 0 | 1, data: boolean) => toggle === 1 && (data || editing);

  const hasCoords = inv.venueLat !== null && inv.venueLng !== null;
  const showCountdown = has(inv.showCountdown, when !== null);
  const showCalendar = has(inv.showCalendar, when !== null);
  const showSchedule = has(inv.showSchedule, inv.schedule.length > 0);
  const showGallery = has(inv.showGallery, inv.gallery.length > 0);
  const showContacts = has(inv.showContacts, inv.contacts.length > 0);
  const showMusic = inv.showMusic === 1 && Boolean(inv.musicUrl);
  const showGift = has(inv.showGift, Boolean(inv.giftCardNumber));
  const showGuestbook = inv.showGuestbook === 1;
  const showGreeting = Boolean(inv.greetingTitle || inv.greetingBody) || editing;
  const showMap = has(inv.showMap, hasCoords || Boolean(inv.venueAddress) || Boolean(inv.venueName));

  const initials = names.map((n) => n[0] ?? "").join("").slice(0, 2) || "❧";
  const mapQuery = hasCoords
    ? `${inv.venueLat},${inv.venueLng}`
    : encodeURIComponent([inv.venueName, inv.venueAddress].filter(Boolean).join(", "));

  const leaves: Leaf[] = [];
  const add = (key: string, label: string, node: ReactNode) => leaves.push({ key, label, node });

  /* ── 1. Cover ───────────────────────────────────────────────────────── */
  add(
    "cover",
    t.coverPage,
    <div className="relative flex flex-col items-center text-center">
      <Corner className="pointer-events-none absolute -top-4 -left-2 h-14 w-14 sm:h-20 sm:w-20" />
      <Corner className="pointer-events-none absolute -top-4 -right-2 h-14 w-14 rotate-90 sm:h-20 sm:w-20" />

      {(inv.epigraph || editing) && (
        <Edit group="epigraph" label="Epigraf">
          <p className="mb-7 max-w-sm text-[13px] leading-relaxed italic sm:text-sm" style={{ color: "var(--ink-soft)" }}>
            {inv.epigraph || "Epigraf qo'shish…"}
          </p>
        </Edit>
      )}

      {(inv.inviteFrom || editing) && (
        <Edit group="greeting" label="Kim taklif qiladi">
          <p className="mb-5 text-[10px] tracking-[0.3em] uppercase sm:text-xs" style={{ color: "var(--ink-soft)" }}>
            {inv.inviteFrom || "Kim taklif qiladi…"}
          </p>
        </Edit>
      )}

      <Edit group="names" label="Kelin-kuyov ismlari">
        <>
          {names.length === 2 && <Monogram left={names[0][0]} right={names[1][0]} />}
          {/* Uzbek names run long (Muhammadaziz, Gulnorabonu) — clamp scales the
              type rather than letting it overflow a 360px phone. */}
          <h1 className="font-display mt-2 w-full leading-[1.08] break-words" style={{ fontSize: "clamp(2rem, 10vw, 4rem)" }}>
            <span className="foil">{names[0] || (editing ? "Kuyov" : "")}</span>
            {(names.length === 2 || editing) && (
              <>
                <span className="font-script block py-1 sm:inline sm:px-4 sm:py-0" style={{ color: "var(--accent)", fontSize: "clamp(1.3rem, 5.5vw, 2.2rem)" }}>
                  &amp;
                </span>
                <span className="foil">{names[1] || (editing ? "Kelin" : "")}</span>
              </>
            )}
          </h1>
        </>
      </Edit>

      <Divider className="my-6" />

      <Edit group="date" label="Sana va vaqt">
        <div className="flex flex-col items-center gap-1">
          <p className="font-display tracking-wide" style={{ color: "var(--accent-deep)", fontSize: "clamp(1.1rem, 4.8vw, 1.8rem)" }}>
            {when ? formatLongDate(inv.eventDate, inv.lang) : editing ? "Sanani tanlang…" : ""}
          </p>
          {when && (
            <p className="text-base tracking-[0.2em] sm:text-lg" style={{ color: "var(--ink-soft)" }}>
              {formatTime(inv.eventDate)}
            </p>
          )}
        </div>
      </Edit>

      <p className="mt-10 text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--ink-soft)" }}>
        {t.turnHint} →
      </p>
    </div>,
  );

  /* ── 2. Greeting ────────────────────────────────────────────────────── */
  if (showGreeting) {
    add(
      "greeting",
      inv.greetingTitle || "Murojaat",
      <>
        <PageHead title={inv.greetingTitle || (editing ? "Murojaat" : "")} />
        <Edit group="greeting" label="Murojaat matni">
          <p className="dropcap text-[17px] leading-[1.85] whitespace-pre-line" style={{ color: "var(--ink)" }}>
            {inv.greetingBody || (editing ? "Murojaat matnini yozing…" : "")}
          </p>
        </Edit>
      </>,
    );
  }

  /* ── 3. The day ─────────────────────────────────────────────────────── */
  if (showCountdown || showCalendar) {
    add(
      "day",
      t.countdownTitle,
      <>
        <PageHead title={t.countdownTitle} />
        <Edit group="date" label="Sana va vaqt">
          <div className="flex flex-col items-center gap-10">
            {showCountdown && when && <Countdown target={when.getTime()} lang={inv.lang} />}
            {showCalendar && when && <Calendar date={when} lang={inv.lang} />}
          </div>
        </Edit>
      </>,
    );
  }

  /* ── 4. Schedule ────────────────────────────────────────────────────── */
  if (showSchedule) {
    add(
      "schedule",
      t.scheduleTitle,
      <>
        <PageHead title={t.scheduleTitle} />
        <Edit group="schedule" label="Tadbir dasturi">
          <ol className="mx-auto max-w-md">
            {inv.schedule.map((item, i) => (
              <li key={i} className="relative flex gap-5 pb-7 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="mt-2 h-2.5 w-2.5 rotate-45" style={{ background: "var(--gold)" }} />
                  {i < inv.schedule.length - 1 && (
                    <span className="mt-1 w-px flex-1" style={{ background: "color-mix(in srgb, var(--gold) 45%, transparent)" }} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-display text-xl" style={{ color: "var(--accent-deep)" }}>{item.time}</div>
                  <div style={{ color: "var(--ink-soft)" }}>{item.title}</div>
                </div>
              </li>
            ))}
            {inv.schedule.length === 0 && editing && (
              <li className="text-sm italic" style={{ color: "var(--ink-soft)" }}>Dastur qo&apos;shing…</li>
            )}
          </ol>
        </Edit>
      </>,
    );
  }

  /* ── 5. Venue ───────────────────────────────────────────────────────── */
  if (showMap) {
    add(
      "venue",
      t.venueTitle,
      <>
        <PageHead title={t.venueTitle} />
        <Edit group="venue" label="Manzil">
          <div className="text-center">
            <p className="font-display text-2xl sm:text-3xl" style={{ color: "var(--accent-deep)" }}>
              {inv.venueName || (editing ? "To'yxona nomi…" : "")}
            </p>
            {inv.venueAddress && (
              <p className="mx-auto mt-2 max-w-md text-[15px]" style={{ color: "var(--ink-soft)" }}>{inv.venueAddress}</p>
            )}
          </div>
        </Edit>

        {hasCoords && (
          <div className="frame mt-7 overflow-hidden">
            <iframe
              title={t.venueTitle}
              className="block h-56 w-full sm:h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${inv.venueLng! - 0.006},${inv.venueLat! - 0.004},${inv.venueLng! + 0.006},${inv.venueLat! + 0.004}&layer=mapnik&marker=${inv.venueLat},${inv.venueLng}`}
            />
          </div>
        )}

        <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={hasCoords ? `https://yandex.com/maps/?pt=${inv.venueLng},${inv.venueLat}&z=17&l=map` : `https://yandex.com/maps/?text=${mapQuery}`}
            target="_blank" rel="noopener noreferrer"
            className="frame inline-flex min-h-11 items-center px-5 py-2.5 text-sm transition hover:opacity-80"
            style={{ color: "var(--accent-deep)" }}
          >
            {t.openInYandex}
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank" rel="noopener noreferrer"
            className="frame inline-flex min-h-11 items-center px-5 py-2.5 text-sm transition hover:opacity-80"
            style={{ color: "var(--accent-deep)" }}
          >
            {t.openInGoogle}
          </a>
        </div>
      </>,
    );
  }

  /* ── 6. Gallery ─────────────────────────────────────────────────────── */
  if (showGallery) {
    add(
      "gallery",
      t.galleryTitle,
      <>
        <PageHead title={t.galleryTitle} />
        <Edit group="gallery" label="Galereya">
          {inv.gallery.length > 0 ? (
            <Gallery images={inv.gallery} />
          ) : (
            <p className="text-center text-sm italic" style={{ color: "var(--ink-soft)" }}>Surat qo&apos;shing…</p>
          )}
        </Edit>
      </>,
    );
  }

  /* ── 7. Contacts ────────────────────────────────────────────────────── */
  if (showContacts) {
    add(
      "contacts",
      t.contactsTitle,
      <>
        <PageHead title={t.contactsTitle} />
        <Edit group="contacts" label="Aloqa raqamlari">
          {/* Slightly rotated, like notes tucked into the book. */}
          <div className="flex flex-wrap justify-center gap-4">
            {inv.contacts.map((c, i) => (
              <a
                key={i}
                href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                className="frame min-w-[150px] px-5 py-4 text-center transition hover:rotate-0 hover:opacity-80"
                style={{
                  transform: `rotate(${i % 2 === 0 ? -1.3 : 1.1}deg)`,
                  background: "color-mix(in srgb, var(--paper-2) 55%, transparent)",
                }}
              >
                <div className="font-display text-lg" style={{ color: "var(--accent-deep)" }}>{c.name}</div>
                <div className="mt-0.5 text-sm tracking-wide" style={{ color: "var(--ink-soft)" }}>{c.phone}</div>
              </a>
            ))}
            {inv.contacts.length === 0 && editing && (
              <p className="text-sm italic" style={{ color: "var(--ink-soft)" }}>Raqam qo&apos;shing…</p>
            )}
          </div>
        </Edit>
      </>,
    );
  }

  /* ── 8. Gift ────────────────────────────────────────────────────────── */
  if (showGift) {
    add(
      "gift",
      t.giftTitle,
      <>
        <PageHead title={t.giftTitle} />
        <Edit group="gift" label="To'y sovg'asi">
          {inv.giftCardNumber ? (
            <GiftCard number={inv.giftCardNumber} holder={inv.giftCardHolder} note={t.giftNote} lang={inv.lang} />
          ) : (
            <p className="text-center text-sm italic" style={{ color: "var(--ink-soft)" }}>Karta raqamini kiriting…</p>
          )}
        </Edit>
      </>,
    );
  }

  /* ── 9. Guestbook ───────────────────────────────────────────────────── */
  if (showGuestbook) {
    add(
      "guestbook",
      t.guestbookTitle,
      <>
        <PageHead title={t.guestbookTitle} />
        <Guestbook slug={inv.slug} lang={inv.lang} messages={messages} />
      </>,
    );
  }

  /* ── 10. Closing ────────────────────────────────────────────────────── */
  add(
    "closing",
    t.theBigDay,
    <div className="flex flex-col items-center text-center">
      <Divider />
      <p className="font-script mt-7" style={{ color: "var(--accent)", fontSize: "clamp(1.8rem, 8vw, 3rem)" }}>
        {t.theBigDay}
      </p>
      {names.length > 0 && (
        <p className="font-display mt-6 text-lg tracking-[0.25em]" style={{ color: "var(--accent-deep)" }}>
          {names.join(" & ")}
        </p>
      )}
      <Divider className="mt-7" />
    </div>,
  );

  return (
    // overflow-x-clip, NOT overflow-x-hidden: `hidden` on one axis silently
    // forces the other from `visible` to `auto`, turning this into a scroll
    // container. `clip` leaves the other axis alone.
    <div data-theme={theme} className="parchment h-[var(--book-h,100dvh)] overflow-x-clip">
      {showGate && (
        <EnvelopeGate
          names={names.join(" & ") || "❧"}
          initials={initials}
          dateLine={when ? formatLongDate(inv.eventDate, inv.lang) : ""}
          hint={t.openLetter}
        />
      )}

      <Ambient />
      {showMusic && <MusicPlayer src={inv.musicUrl} label={t.musicOn} />}

      <Book leaves={leaves} labels={{ prev: t.prevPage, next: t.nextPage, of: t.pages }} />
    </div>
  );
}

/** Page heading: a centred title over a short gold rule. */
function PageHead({ title }: { title: string }) {
  if (!title) return null;
  return (
    <div className="mb-8 text-center">
      <h2 className="font-display text-[1.7rem] leading-tight tracking-wide sm:text-4xl" style={{ color: "var(--accent-deep)" }}>
        {title}
      </h2>
      <div className="mx-auto mt-3 h-px w-16" style={{ background: "var(--gold)" }} aria-hidden />
    </div>
  );
}
