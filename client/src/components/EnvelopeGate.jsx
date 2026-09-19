import { useEffect, useState } from "react";

/** The hero moment: a sealed envelope the guest taps. The wax cracks, the flap
 *  folds back in real 3D, the folded letter slides out and unfolds, then
 *  dissolves into the book.
 *
 *  Also the audio gate — browsers block autoplay until a genuine user gesture,
 *  and this tap is it. */
export default function EnvelopeGate({ names, initials, dateLine, hint, onOpen }) {
  const [opening, setOpening] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setGone(true); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function open() {
    // A second tap skips ahead, in case the animation stalls on a slow device.
    if (opening) { setGone(true); return; }
    setOpening(true);
    onOpen?.();
    setTimeout(() => setGone(true), 2950);
  }

  if (gone) return null;
  const paperEdge = "1px solid color-mix(in srgb, var(--gold) 45%, transparent)";

  return (
    <div
      className={`env-stage parchment absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4 ${opening ? "env-open" : ""}`}
      // --w drives every other dimension, so the whole assembly scales as one
      // object. It MUST be viewport-relative, not a percentage: the button is
      // shrink-to-fit, so a % width would resolve against a containing block
      // that is itself sized by this content — circular, and the envelope
      // collapses to nothing.
      style={{ "--w": "min(74vw, 290px)", "--h": "calc(var(--w) * 0.66)" }}
    >
      <button type="button" onClick={open} aria-label={hint}
        className="group relative block cursor-pointer bg-transparent p-0 focus:outline-none"
        style={{ perspective: "1200px", perspectiveOrigin: "50% 0%" }}>
        <div className="relative" style={{ width: "var(--w)", height: "var(--h)" }}>
          {/* back panel */}
          <div className="env-body absolute inset-0 rounded-[3px]"
            style={{ background: "var(--envelope)", boxShadow: "0 22px 45px -14px rgba(0,0,0,.42)", zIndex: 0 }} />

          {/* the folded letter — sits low enough that the pocket hides it
              completely while sealed; the flap tapers to a point and cannot be
              relied on to cover the upper corners */}
          <div className="env-letter absolute"
            style={{ left: "7%", width: "86%", top: "28%", height: "56%", transformStyle: "preserve-3d", zIndex: 10 }}>
            <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-[2px] px-3"
              style={{ background: "var(--paper)", border: paperEdge, boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}>
              <div className="h-px w-10" style={{ background: "var(--gold)" }} />
              <p className="font-script text-center leading-tight"
                 style={{ color: "var(--accent)", fontSize: "calc(var(--w) * 0.075)" }}>{names}</p>
              <div className="h-px w-10" style={{ background: "var(--gold)" }} />
            </div>
            {/* lower panel, folded up over the one above it */}
            <div className="env-fold absolute inset-x-0 top-full flex flex-col items-center justify-center rounded-[2px]"
              style={{ height: "100%", background: "var(--paper)", border: paperEdge,
                       transformOrigin: "top center", transform: "rotateX(-180deg)",
                       boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}>
              <p className="font-display tracking-[0.15em]"
                 style={{ color: "var(--accent-deep)", fontSize: "calc(var(--w) * 0.05)" }}>{dateLine}</p>
            </div>
          </div>

          {/* front pocket */}
          <div className="env-pocket absolute inset-x-0 bottom-0 rounded-b-[3px]"
            style={{ height: "74%", background: "var(--envelope)",
              backgroundImage: "linear-gradient(118deg, var(--envelope-2) 0 50%, transparent 50%), linear-gradient(-118deg, var(--envelope-2) 0 50%, transparent 50%)",
              backgroundSize: "50.5% 100%", backgroundPosition: "left, right", backgroundRepeat: "no-repeat",
              zIndex: 20 }} />

          {/* flap */}
          <div className="env-flap absolute inset-x-0 top-0"
            style={{ height: "60%", background: "var(--envelope-2)",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)", transformOrigin: "top center", zIndex: 30 }} />

          {/* wax seal, stamped with the couple's initials */}
          <div className="env-seal absolute left-1/2 flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
            style={{ top: "48%", width: "calc(var(--w) * 0.18)", height: "calc(var(--w) * 0.18)",
              transform: "translateX(-50%)",
              background: "radial-gradient(circle at 34% 28%, color-mix(in srgb, var(--seal) 62%, white), var(--seal) 68%)",
              boxShadow: "0 4px 10px rgba(0,0,0,.34), inset 0 -2px 7px rgba(0,0,0,.3)", zIndex: 40 }}>
            <span className="font-display leading-none"
              style={{ color: "color-mix(in srgb, var(--gold) 85%, white)",
                       fontSize: "calc(var(--w) * 0.075)", textShadow: "0 1px 1px rgba(0,0,0,.35)" }}>
              {initials}
            </span>
          </div>
        </div>
      </button>

      <p className="env-hint mt-8 animate-pulse text-center text-[10px] tracking-[0.3em] uppercase"
         style={{ color: "var(--ink-soft)" }}>{hint}</p>
    </div>
  );
}
