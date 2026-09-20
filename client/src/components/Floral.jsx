import { useEffect, useId, useState } from "react";

/** Illustrated floral ornaments, drawn as inline SVG so they inherit the
 *  theme's --accent / --gold and cost no network requests.
 *
 *  Depth comes from three things: petals are cupped bezier shapes rather than
 *  ellipses, each ring is filled from a radial gradient so the throat of the
 *  flower is lighter than its edge, and a low-frequency turbulence filter
 *  roughens the outlines so they read as painted rather than vector.
 *
 *  All of it is decorative, so everything is aria-hidden. */

/* A single cupped petal, drawn once and reused at different scales/rotations.
   Origin is the flower's centre; the petal opens upward. */
const PETAL =
  "M0 0 C 13 -4 26 -16 28 -34 C 29 -48 20 -58 0 -60 C -20 -58 -29 -48 -28 -34 C -26 -16 -13 -4 0 0 Z";

/* Narrower inner petal, curled slightly to one side. */
const PETAL_INNER =
  "M0 0 C 10 -3 19 -12 21 -25 C 22 -35 15 -43 1 -44 C -13 -43 -21 -35 -20 -25 C -18 -12 -9 -3 0 0 Z";

function Ring({ count, path, scale, offset, fill, opacity }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (i * 360) / count + offset).map((a) => (
        <path key={a} d={path} fill={fill} opacity={opacity}
              transform={`rotate(${a}) scale(${scale})`} />
      ))}
    </>
  );
}

/** A full bloom. `tone` shifts it through the palette so a cluster reads as
 *  several different flowers instead of one repeated stamp. */
function Bloom({ x, y, r, tone = 0, rotate = 0, uid }) {
  const g = `${uid}-b${tone}`;
  const s = r / 60; // the petal paths are authored at radius 60

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <Ring count={7} path={PETAL} scale={1}    offset={0}  fill={`url(#${g}-outer)`} opacity="0.95" />
      <Ring count={6} path={PETAL} scale={0.74} offset={26} fill={`url(#${g}-mid)`} opacity="0.97" />
      <Ring count={5} path={PETAL_INNER} scale={1} offset={12} fill={`url(#${g}-in)`} opacity="1" />

      {/* furled centre */}
      <path d="M0 -14 C 9 -14 13 -7 11 0 C 9 8 0 11 -6 7 C -12 3 -11 -6 -3 -8"
            fill="none" stroke={`url(#${g}-in)`} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <circle r="5" fill="var(--gold)" opacity="0.8" />
      <circle r="2" fill="color-mix(in srgb, var(--accent-deep) 60%, white)" opacity="0.7" />
    </g>
  );
}

/** Veined leaf with a curved midrib. */
function Leaf({ x, y, rotate = 0, scale = 1, uid }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0 0 C 14 -16 38 -18 52 -6 C 42 14 16 18 0 0 Z" fill={`url(#${uid}-leaf)`} opacity="0.92" />
      <path d="M0 0 C 18 -4 36 -5 52 -6" stroke="color-mix(in srgb, var(--accent-deep) 55%, white)"
            strokeWidth="1.1" fill="none" opacity="0.75" />
      {[10, 20, 30, 40].map((t, i) => (
        <path key={t} d={`M${t} ${-t * 0.12} l ${6 - i} ${-5 - i}`}
              stroke="color-mix(in srgb, var(--accent-deep) 40%, white)" strokeWidth="0.7"
              fill="none" opacity="0.5" />
      ))}
      {[12, 24, 36].map((t, i) => (
        <path key={t} d={`M${t} ${-t * 0.12} l ${5 - i} ${5 + i}`}
              stroke="color-mix(in srgb, var(--accent-deep) 40%, white)" strokeWidth="0.7"
              fill="none" opacity="0.45" />
      ))}
    </g>
  );
}

/** Small five-petal filler bloom — gypsophila-like, softens the silhouette. */
function Filler({ x, y, r = 7, uid }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} rx={r * 0.42} ry={r * 0.72} cy={-r * 0.55}
                 fill={`url(#${uid}-fill)`} transform={`rotate(${a})`} opacity="0.9" />
      ))}
      <circle r={r * 0.24} fill="var(--gold)" opacity="0.85" />
    </g>
  );
}

/** Gradient + filter definitions. Ids are scoped per component instance —
 *  duplicate ids across instances would make every flower reuse the first
 *  instance's palette. */
function Defs({ uid }) {
  const tones = [
    { light: "color-mix(in srgb, var(--accent) 12%, white)", deep: "color-mix(in srgb, var(--accent) 58%, white)" },
    { light: "color-mix(in srgb, var(--accent) 6%, white)",  deep: "color-mix(in srgb, var(--accent) 40%, white)" },
    { light: "color-mix(in srgb, var(--gold) 18%, white)",   deep: "color-mix(in srgb, var(--accent) 30%, white)" },
  ];

  return (
    <defs>
      {tones.map((t, i) => (
        <g key={i}>
          <radialGradient id={`${uid}-b${i}-outer`} cx="50%" cy="72%" r="72%">
            <stop offset="0%" stopColor={t.light} />
            <stop offset="100%" stopColor={t.deep} />
          </radialGradient>
          <radialGradient id={`${uid}-b${i}-mid`} cx="50%" cy="70%" r="68%">
            <stop offset="0%" stopColor={t.light} />
            <stop offset="95%" stopColor={t.deep} />
          </radialGradient>
          <radialGradient id={`${uid}-b${i}-in`} cx="50%" cy="65%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="0.95" />
            <stop offset="100%" stopColor={t.deep} />
          </radialGradient>
        </g>
      ))}

      <linearGradient id={`${uid}-leaf`} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="color-mix(in srgb, var(--accent-deep) 42%, white)" />
        <stop offset="100%" stopColor="color-mix(in srgb, var(--accent-deep) 14%, white)" />
      </linearGradient>

      <radialGradient id={`${uid}-fill`} cx="50%" cy="80%" r="80%">
        <stop offset="0%" stopColor="white" />
        <stop offset="100%" stopColor="color-mix(in srgb, var(--gold) 45%, white)" />
      </radialGradient>

      {/* Watercolour edge. Kept to one filter per cluster at a low displacement
          scale — SVG filters are the expensive part of this on a phone. */}
      <filter id={`${uid}-paint`} x="-12%" y="-12%" width="124%" height="124%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  );
}

/** Corner cluster.
 *
 *  Prefers a real watercolour PNG from /florals/ — drop one in and it is used
 *  automatically, no code change. Painted florals cannot be reproduced in SVG,
 *  so the drawn version below is only the fallback when no asset is present.
 *  See client/public/florals/README.md. */
/** True only once `src` has actually decoded.
 *
 *  Probing with `new Image()` rather than rendering an <img> and waiting for
 *  onError matters: a missing asset renders at zero height first, which
 *  collapses the cover and makes every section below it look on screen — the
 *  scroll reveals then all fire at once. The drawn flowers show until a real
 *  asset is confirmed, so layout never shifts. */
function useAssetReady(src) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!src) return;
    let live = true;
    const probe = new Image();
    probe.onload = () => { if (live) setReady(true); };
    probe.src = src;
    return () => { live = false; };
  }, [src]);
  return ready;
}

export function FloralCorner({ className = "", flip = false, src = "/florals/corner.png" }) {
  const ready = useAssetReady(src);

  if (!ready) return <DrawnCorner className={className} flip={flip} />;

  return (
    <img src={src} alt="" aria-hidden className={className}
         style={flip ? { transform: "scaleX(-1)" } : undefined} />
  );
}

function DrawnCorner({ className = "", flip = false }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 190 165" className={className} aria-hidden
         style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <Defs uid={uid} />
      <g filter={`url(#${uid}-paint)`}>
        {/* greenery first, so blooms sit on top */}
        <Leaf x={6}   y={96}  rotate={168} scale={1.15} uid={uid} />
        <Leaf x={62}  y={132} rotate={96}  scale={1.0}  uid={uid} />
        <Leaf x={132} y={54}  rotate={-28} scale={1.1}  uid={uid} />
        <Leaf x={34}  y={26}  rotate={-122} scale={0.9} uid={uid} />
        <Leaf x={118} y={110} rotate={44}  scale={0.85} uid={uid} />
        <Leaf x={92}  y={12}  rotate={-64} scale={0.75} uid={uid} />

        <Bloom x={52}  y={54}  r={40} tone={0} rotate={-8} uid={uid} />
        <Bloom x={112} y={30}  r={27} tone={1} rotate={22} uid={uid} />
        <Bloom x={30}  y={110} r={24} tone={2} rotate={-30} uid={uid} />
        <Bloom x={100} y={92}  r={20} tone={1} rotate={48} uid={uid} />

        <Filler x={146} y={82} r={9} uid={uid} />
        <Filler x={76}  y={8}  r={7} uid={uid} />
        <Filler x={12}  y={62} r={8} uid={uid} />
        <Filler x={126} y={136} r={6} uid={uid} />
      </g>
    </svg>
  );
}

/** Divider with a bloom at its centre, between sections. */
export function FloralDivider({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  return (
    <div className={`flex justify-center ${className}`} aria-hidden>
      <svg viewBox="0 0 280 58" className="h-11 w-64">
        <Defs uid={uid} />
        <g stroke="var(--gold)" strokeWidth="1.1" fill="none" opacity="0.8">
          <path d="M6 29 H92" />
          <path d="M188 29 H274" />
          <path d="M74 29 c7 -8, 16 -8, 21 0" />
          <path d="M206 29 c-7 -8, -16 -8, -21 0" />
        </g>
        <g filter={`url(#${uid}-paint)`}>
          <Leaf x={104} y={28} rotate={182} scale={0.6} uid={uid} />
          <Leaf x={176} y={30} rotate={-6}  scale={0.6} uid={uid} />
          <Bloom x={140} y={29} r={20} tone={0} uid={uid} />
          <Filler x={116} y={40} r={6} uid={uid} />
          <Filler x={166} y={17} r={6} uid={uid} />
        </g>
      </svg>
    </div>
  );
}

/** Hanging sprig for section corners. */
export function Sprig({ className = "", flip = false }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 74 92" className={`sway ${className}`} aria-hidden
         style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <Defs uid={uid} />
      <path d="M37 2 C 37 28, 32 52, 26 86" stroke="color-mix(in srgb, var(--accent-deep) 38%, white)"
            strokeWidth="1.4" fill="none" />
      <g filter={`url(#${uid}-paint)`}>
        <Leaf x={37} y={22} rotate={22}  scale={0.55} uid={uid} />
        <Leaf x={34} y={40} rotate={158} scale={0.5}  uid={uid} />
        <Leaf x={30} y={60} rotate={30}  scale={0.45} uid={uid} />
        <Bloom x={37} y={10} r={14} tone={1} uid={uid} />
        <Bloom x={27} y={80} r={9}  tone={2} uid={uid} />
        <Filler x={44} y={50} r={5} uid={uid} />
      </g>
    </svg>
  );
}

/** Falling petals. Deliberately few and slow: this runs behind a whole
 *  invitation on a mid-range phone, so it animates transform/opacity only,
 *  drops its count on low-core devices, pauses when the tab is hidden, and
 *  renders nothing under prefers-reduced-motion. */
export function Petals() {
  const [petals, setPetals] = useState([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const count = (navigator.hardwareConcurrency ?? 4) <= 4 ? 9 : 16;
    setPetals(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        w: 8 + Math.random() * 10,
        duration: 14 + Math.random() * 16,
        delay: -Math.random() * 30, // negative: the field starts mid-flight
        dx: -8 + Math.random() * 16,
        spin: 200 + Math.random() * 500,
        sway: 10 + Math.random() * 22,
        swayDur: 3 + Math.random() * 3,
        peak: 0.35 + Math.random() * 0.4,
        deep: Math.random() > 0.55,
      })),
    );
  }, []);

  useEffect(() => {
    const on = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  if (!petals.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.w * 0.78,
            background: p.deep
              ? "radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--accent) 18%, white), color-mix(in srgb, var(--accent) 55%, white))"
              : "radial-gradient(circle at 30% 25%, white, color-mix(in srgb, var(--accent) 28%, white))",
            animationDuration: `${p.duration}s, ${p.swayDur}s`,
            animationDelay: `${p.delay}s, 0s`,
            animationPlayState: paused ? "paused" : "running",
            "--dx": `${p.dx}vw`,
            "--spin": `${p.spin}deg`,
            "--sway": `${p.sway}px`,
            "--peak": p.peak,
          }}
        />
      ))}
    </div>
  );
}
