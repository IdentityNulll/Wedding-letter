import { useId } from "react";

/** The decorative page frame: silk drapes in the corners, gold speckling, and
 *  gold line-art botanicals.
 *
 *  Every colour comes from the palette variables, so the whole frame re-tints
 *  with the theme — which a fixed raster background could not do. The pieces
 *  chosen here are the ones vector handles well: soft gradients and fine gold
 *  strokes. Photographic blossoms stay a drop-in PNG (see Floral.jsx). */
export default function Backdrop() {
  const uid = useId().replace(/:/g, "");

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* ── silk drapes ─────────────────────────────────────────────────
          Large soft gradients, rotated so the highlight reads as folded
          fabric catching light rather than a flat wash. */}
      <div
        className="absolute -top-[18%] -right-[28%] h-[70%] w-[85%] rotate-12 opacity-70"
        style={{
          background:
            "radial-gradient(60% 55% at 35% 40%, color-mix(in srgb, var(--paper-2) 92%, white) 0%, transparent 70%)," +
            "linear-gradient(135deg, transparent 20%, color-mix(in srgb, var(--paper-2) 80%, white) 45%, transparent 72%)",
          filter: "blur(2px)",
        }}
      />
      <div
        className="absolute -bottom-[22%] -left-[30%] h-[75%] w-[90%] -rotate-6 opacity-60"
        style={{
          background:
            "radial-gradient(55% 50% at 60% 45%, color-mix(in srgb, var(--accent) 12%, white) 0%, transparent 72%)," +
            "linear-gradient(40deg, transparent 25%, color-mix(in srgb, var(--paper-2) 85%, white) 55%, transparent 80%)",
          filter: "blur(3px)",
        }}
      />

      {/* ── gold line botanicals + speckling ────────────────────────── */}
      <svg viewBox="0 0 400 700" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--gold)" />
            <stop offset="50%" stopColor="color-mix(in srgb, var(--gold) 55%, white)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>

        <g stroke={`url(#${uid}-gold)`} fill="none" strokeWidth="1.1" opacity="0.75">
          {/* bottom-right sprig */}
          <g transform="translate(300 560)">
            <path d="M92 118 C 70 92, 50 58, 40 18" />
            <path d="M40 18 C 44 44, 52 70, 66 92" opacity="0.7" />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const t = i * 18;
              return (
                <g key={i} transform={`translate(${44 + t * 0.42} ${26 + t}) rotate(${-24 + i * 5})`}>
                  <ellipse rx="11" ry="7.5" />
                  <ellipse rx="11" ry="7.5" transform="translate(-16 12) rotate(28)" opacity="0.8" />
                </g>
              );
            })}
          </g>

          {/* top-left sprig, lighter */}
          <g transform="translate(6 18)" opacity="0.6">
            <path d="M4 6 C 26 22, 48 44, 62 74" />
            {[0, 1, 2, 3].map((i) => (
              <ellipse key={i} rx="9" ry="6" transform={`translate(${14 + i * 15} ${18 + i * 18}) rotate(${38 + i * 6})`} />
            ))}
          </g>
        </g>

        {/* gold dust — fixed positions, so it never reflows or flickers */}
        <g fill="var(--gold)">
          {GOLD_DUST.map(([cx, cy, r, o], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} opacity={o} />
          ))}
        </g>
      </svg>
    </div>
  );
}

/** [x, y, radius, opacity] — hand-placed rather than random so the speckling
 *  clusters near the corners like the reference, and stays identical between
 *  renders. */
const GOLD_DUST = [
  [318, 26, 2.2, 0.75], [336, 42, 1.4, 0.6], [352, 20, 1.8, 0.7], [368, 52, 1.2, 0.5],
  [300, 54, 1.5, 0.55], [380, 32, 2.0, 0.65], [346, 70, 1.3, 0.45], [364, 88, 1.6, 0.4],
  [386, 12, 1.4, 0.6], [310, 84, 1.1, 0.35], [330, 104, 1.5, 0.3], [392, 70, 1.2, 0.4],
  [26, 612, 1.9, 0.5], [48, 640, 1.4, 0.45], [14, 660, 1.6, 0.4], [62, 606, 1.2, 0.35],
  [36, 682, 1.5, 0.3], [78, 656, 1.3, 0.35], [8, 586, 1.2, 0.3], [92, 688, 1.4, 0.28],
  [352, 640, 1.6, 0.45], [372, 668, 1.3, 0.38], [330, 672, 1.2, 0.3],
];
