"use client";

import { useEffect, useState } from "react";

export const LETTER_OPENED = "wl:letter-opened";

/** The hero moment. A sealed envelope the guest taps: the wax cracks, the flap
 *  folds back in real 3D, the folded letter slides out of the pocket, unfolds
 *  along its crease, then rushes forward and dissolves into the page.
 *
 *  It doubles as the audio gate — browsers block autoplay until a genuine user
 *  gesture, and this tap is that gesture.
 *
 *  All sizing derives from --w (set in vw units) so the whole assembly scales
 *  as one object from a 320px phone up to desktop. */
export default function EnvelopeGate({
  names,
  initials,
  dateLine,
  hint,
}: {
  names: string;
  initials: string;
  dateLine: string;
  hint: string;
}) {
  const [opening, setOpening] = useState(false);
  const [gone, setGone] = useState(false);

  // Freeze the page behind the envelope so it can't be scrolled past.
  useEffect(() => {
    if (gone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [gone]);

  // Escape hatch: if the animation ever stalls on a slow device, a second tap
  // (or Escape) drops straight through to the invitation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setGone(true); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function open() {
    if (opening) { setGone(true); return; }
    setOpening(true);
    window.dispatchEvent(new Event(LETTER_OPENED));
    window.setTimeout(() => setGone(true), 2950);
  }

  if (gone) return null;

  const paperEdge = "1px solid color-mix(in srgb, var(--gold) 45%, transparent)";

  return (
    <div
      className={`env-stage parchment fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4 ${opening ? "env-open" : ""}`}
      style={{
        // --w drives every other dimension below.
        ["--w" as string]: "min(82vw, 340px)",
        ["--h" as string]: "calc(var(--w) * 0.66)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <button
        type="button"
        onClick={open}
        aria-label={hint}
        className="group relative block cursor-pointer bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
        style={{ perspective: "1200px", perspectiveOrigin: "50% 0%" }}
      >
        <div className="relative" style={{ width: "var(--w)", height: "var(--h)" }}>
          {/* ── envelope back panel ─────────────────────────────────── */}
          <div
            className="env-body absolute inset-0 rounded-[3px]"
            style={{
              background: "var(--envelope)",
              boxShadow: "0 22px 45px -14px rgba(0,0,0,.42)",
              zIndex: 0,
            }}
          />

          {/* ── the folded letter ───────────────────────────────────── */}
          <div
            className="env-letter absolute"
            style={{
              // Sits low enough that the front pocket hides it completely while
              // the envelope is sealed — the flap tapers to a point and can't
              // be relied on to cover the upper corners.
              left: "7%",
              width: "86%",
              top: "28%",
              height: "56%",
              transformStyle: "preserve-3d",
              zIndex: 10,
            }}
          >
            {/* upper panel — always flat, carries the names */}
            <div
              className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-[2px] px-3"
              style={{ background: "var(--paper)", border: paperEdge, boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}
            >
              <div className="h-px w-10" style={{ background: "var(--gold)" }} />
              <p
                className="font-script text-center leading-tight"
                style={{ color: "var(--accent)", fontSize: "calc(var(--w) * 0.075)" }}
              >
                {names}
              </p>
              <div className="h-px w-10" style={{ background: "var(--gold)" }} />

              {/* the crease: a hairline shadow where the paper was folded */}
              <div
                className="env-crease pointer-events-none absolute inset-x-0 bottom-0 h-px"
                style={{ background: "rgba(0,0,0,.28)", opacity: 0.5 }}
              />
            </div>

            {/* lower panel — starts folded up over the panel above it */}
            <div
              className="env-fold absolute inset-x-0 top-full flex flex-col items-center justify-center rounded-[2px]"
              style={{
                height: "100%",
                background: "var(--paper)",
                border: paperEdge,
                transformOrigin: "top center",
                transform: "rotateX(-180deg)",
                boxShadow: "0 2px 6px rgba(0,0,0,.12)",
              }}
            >
              <p
                className="font-display tracking-[0.18em]"
                style={{ color: "var(--accent-deep)", fontSize: "calc(var(--w) * 0.052)" }}
              >
                {dateLine}
              </p>
            </div>
          </div>

          {/* ── envelope front pocket ───────────────────────────────── */}
          <div
            className="env-pocket absolute inset-x-0 bottom-0 rounded-b-[3px]"
            style={{
              height: "74%",
              background: "var(--envelope)",
              backgroundImage:
                "linear-gradient(118deg, var(--envelope-2) 0 50%, transparent 50%), linear-gradient(-118deg, var(--envelope-2) 0 50%, transparent 50%)",
              backgroundSize: "50.5% 100%",
              backgroundPosition: "left, right",
              backgroundRepeat: "no-repeat",
              boxShadow: "0 -1px 3px rgba(0,0,0,.10)",
              zIndex: 20,
            }}
          />

          {/* ── flap ────────────────────────────────────────────────── */}
          <div
            className="env-flap absolute inset-x-0 top-0"
            style={{
              height: "60%",
              background: "var(--envelope-2)",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              transformOrigin: "top center",
              zIndex: 30,
            }}
          />

          {/* ── wax seal, stamped with the couple's initials ────────── */}
          <div
            className="env-seal absolute left-1/2 flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
            style={{
              top: "48%",
              width: "calc(var(--w) * 0.18)",
              height: "calc(var(--w) * 0.18)",
              transform: "translateX(-50%)",
              background:
                "radial-gradient(circle at 34% 28%, color-mix(in srgb, var(--seal) 62%, white), var(--seal) 68%)",
              boxShadow: "0 4px 10px rgba(0,0,0,.34), inset 0 -2px 7px rgba(0,0,0,.3)",
              zIndex: 40,
            }}
          >
            <span
              className="font-display leading-none tracking-tight"
              style={{
                color: "color-mix(in srgb, var(--gold) 85%, white)",
                fontSize: "calc(var(--w) * 0.075)",
                textShadow: "0 1px 1px rgba(0,0,0,.35)",
              }}
            >
              {initials}
            </span>
          </div>
        </div>
      </button>

      <p
        className="env-hint mt-10 animate-pulse text-center text-[11px] tracking-[0.3em] uppercase"
        style={{ color: "var(--ink-soft)" }}
      >
        {hint}
      </p>
    </div>
  );
}
