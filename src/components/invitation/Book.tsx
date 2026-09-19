"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export type Leaf = { key: string; label: string; node: ReactNode };

type Turn = { overlay: number; base: number; dir: "fwd" | "back" } | null;

/** Must match the .page-turning animation duration in globals.css. */
const TURN_MS = 720;

/** A page-turning book.
 *
 *  `index` commits immediately on navigation; the outgoing (or incoming) leaf is
 *  rendered on top for the length of the animation and then dropped. That keeps
 *  the "what page am I on" state simple — only the transient overlay is special.
 *
 *  Each page scrolls internally rather than the document, so a long guestbook
 *  never breaks the book metaphor. */
export default function Book({
  leaves,
  labels,
}: {
  leaves: Leaf[];
  labels: { prev: string; next: string; of: string };
}) {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn>(null);
  const busy = useRef(false);
  const timer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const last = leaves.length - 1;

  const endTurn = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setTurn(null);
    busy.current = false;
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (busy.current) return;
      const target = index + dir;
      if (target < 0 || target > last) return;

      busy.current = true;
      setTurn(
        dir === 1
          ? { overlay: index, base: target, dir: "fwd" }
          : { overlay: target, base: index, dir: "back" },
      );
      setIndex(target);
      // A fresh page always starts at its top, never mid-scroll from the last one.
      scrollRef.current?.scrollTo({ top: 0 });

      // Never let the book depend solely on `animationend` to unlock. That event
      // is skipped whenever the page isn't compositing — a backgrounded tab, a
      // throttled device, an interrupted animation — and a missed one would jam
      // navigation permanently. The timer is the authority; the event is just a
      // faster path to the same call.
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(endTurn, TURN_MS + 90);
    },
    [index, last, endTurn],
  );

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  // Keyboard paging. Ignored while typing, or the guestbook would page away
  // mid-message every time someone pressed an arrow key.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Swipe, with an axis lock so a vertical scroll inside a page never turns it.
  const touch = useRef<{ x: number; y: number; locked: null | "x" | "y" } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    const el = e.target as HTMLElement;
    if (el.closest("input, textarea, select, button, a")) return;
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, locked: null };
  }

  function onTouchMove(e: React.TouchEvent) {
    const s = touch.current;
    if (!s) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (s.locked === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      s.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    const s = touch.current;
    touch.current = null;
    if (!s || s.locked !== "x") return;
    const dx = e.changedTouches[0].clientX - s.x;
    if (Math.abs(dx) < 55) return;
    go(dx < 0 ? 1 : -1);
  }

  const baseIndex = turn ? turn.base : index;

  return (
    // --book-h lets the admin shrink the book to sit under its toolbar.
    <div className="book-stage relative z-10 h-[var(--book-h,100dvh)] w-full overflow-hidden">
      {/* the page currently settled on the stage */}
      <Page
        key={leaves[baseIndex].key}
        scrollRef={baseIndex === index && !turn ? scrollRef : undefined}
        entering
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {leaves[baseIndex].node}
      </Page>

      {/* the leaf mid-turn, layered above */}
      {turn && (
        <Page
          key={`turn-${leaves[turn.overlay].key}-${turn.dir}`}
          className={`page-turning ${turn.dir}`}
          // Only the leaf's own turn counts — the shade overlay inside it runs
          // its own animation whose animationend also bubbles to here.
          onAnimationEnd={(e) => { if (e.target === e.currentTarget) endTurn(); }}
          aria-hidden
        >
          {leaves[turn.overlay].node}
          <div className="page-shade pointer-events-none absolute inset-0 bg-black" />
        </Page>
      )}

      {/* ── controls ─────────────────────────────────────────────────── */}
      <nav
        className="no-print pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))] sm:px-8"
        aria-label={labels.of}
      >
        <Arrow onClick={() => go(-1)} disabled={index === 0} label={labels.prev} dir="left" />

        {/* Dots are narrow but full-height: the visible mark is small, the tap
            area is 44px tall so a thumb can actually hit it. */}
        <ol className="pointer-events-auto flex items-center justify-center">
          {leaves.map((l, i) => (
            <li key={l.key}>
              <button
                type="button"
                onClick={() => {
                  if (i !== index && !busy.current) go(i > index ? 1 : -1);
                }}
                aria-label={l.label}
                aria-current={i === index ? "true" : undefined}
                className="flex h-11 w-5 items-center justify-center"
              >
                <span
                  className="block h-1.5 w-1.5 rotate-45 transition"
                  style={{
                    background: i === index ? "var(--accent)" : "color-mix(in srgb, var(--gold) 55%, transparent)",
                    transform: i === index ? "rotate(45deg) scale(1.5)" : undefined,
                  }}
                />
              </button>
            </li>
          ))}
        </ol>

        <Arrow onClick={() => go(1)} disabled={index === last} label={labels.next} dir="right" />
      </nav>
    </div>
  );
}

function Page({
  children,
  className = "",
  entering,
  scrollRef,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  entering?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`parchment absolute inset-0 ${className}`} {...rest}>
      {/* binding gutter */}
      <div className="page-spine pointer-events-none absolute inset-y-0 left-0 z-20 w-6 sm:w-10" aria-hidden />

      <div
        ref={scrollRef}
        className="h-full overflow-x-clip overflow-y-auto overscroll-contain"
      >
        <div
          className={`mx-auto flex min-h-[var(--book-h,100dvh)] max-w-2xl flex-col justify-center px-7 pt-12 pb-24 sm:px-14 ${entering ? "page-enter" : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function Arrow({
  onClick,
  disabled,
  label,
  dir,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  dir: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full backdrop-blur transition disabled:pointer-events-none disabled:opacity-0"
      style={{
        background: "color-mix(in srgb, var(--paper) 82%, transparent)",
        border: "1px solid color-mix(in srgb, var(--gold) 55%, transparent)",
        color: "var(--accent-deep)",
      }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
