import { useEffect, useRef, useState } from "react";
import { UI } from "../lib/i18n";

/* ── Ornaments — inline SVG so they inherit --gold and cost no requests ── */

export function Divider({ className = "" }) {
  return (
    <div className={`flex justify-center ${className}`} aria-hidden>
      <svg viewBox="0 0 240 24" className="h-5 w-48" fill="none" stroke="var(--gold)" strokeWidth="1.2">
        <path d="M2 12h78" /><path d="M160 12h78" />
        <path d="M96 12c8-9 16-9 24 0s16 9 24 0" />
        <path d="M96 12c8 9 16 9 24 0s16-9 24 0" />
        <circle cx="120" cy="12" r="3.2" fill="var(--gold)" stroke="none" />
        <circle cx="86" cy="12" r="1.8" fill="var(--gold)" stroke="none" />
        <circle cx="154" cy="12" r="1.8" fill="var(--gold)" stroke="none" />
      </svg>
    </div>
  );
}

export function Corner({ className = "" }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" stroke="var(--gold)" strokeWidth="1.3" aria-hidden>
      <path d="M2 40C2 18 18 2 40 2" />
      <path d="M10 40C10 23 23 10 40 10" opacity=".65" />
      <path d="M40 2c-6 10-14 14-24 14" opacity=".5" />
      <circle cx="40" cy="2" r="2.4" fill="var(--gold)" stroke="none" />
      <circle cx="2" cy="40" r="2.4" fill="var(--gold)" stroke="none" />
    </svg>
  );
}

export function Monogram({ left, right }) {
  return (
    <div className="relative mx-auto flex h-20 w-44 items-center justify-center" aria-hidden>
      <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full" fill="none" stroke="var(--gold)" strokeWidth="1.4">
        <circle cx="78" cy="50" r="30" opacity=".55" />
        <circle cx="122" cy="50" r="30" opacity=".55" />
      </svg>
      <span className="font-display absolute left-[22%] text-2xl" style={{ color: "var(--accent)" }}>{left}</span>
      <span className="font-display absolute right-[22%] text-2xl" style={{ color: "var(--accent)" }}>{right}</span>
    </div>
  );
}

export function PageHead({ title }) {
  if (!title) return null;
  return (
    <div className="mb-6 text-center">
      <h2 className="font-display text-[1.6rem] leading-tight tracking-wide sm:text-3xl" style={{ color: "var(--accent-deep)" }}>
        {title}
      </h2>
      <div className="mx-auto mt-2.5 h-px w-14" style={{ background: "var(--gold)" }} aria-hidden />
    </div>
  );
}

/* ── Countdown ─────────────────────────────────────────────────────────── */

function diff(target) {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}

export function Countdown({ target, lang }) {
  const [parts, setParts] = useState(() => diff(target));
  const t = UI[lang];

  useEffect(() => {
    setParts(diff(target));
    const id = setInterval(() => setParts(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  // The day has arrived — a warm line beats a frozen row of zeros.
  if (!parts) {
    return <p className="font-script text-center text-3xl" style={{ color: "var(--accent)" }}>{t.theBigDay}</p>;
  }

  const cells = [[parts.d, t.days], [parts.h, t.hours], [parts.m, t.minutes], [parts.s, t.seconds]];
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {cells.map(([v, label]) => (
        <div key={label} className="frame min-w-[62px] px-2.5 py-2.5"
             style={{ background: "color-mix(in srgb, var(--paper-2) 70%, transparent)" }}>
          <div className="font-display text-2xl leading-none tabular-nums sm:text-4xl" style={{ color: "var(--accent-deep)" }}>
            {String(v).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[9px] tracking-[0.15em] uppercase sm:text-[10px]" style={{ color: "var(--ink-soft)" }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Calendar — weeks start Monday, as in Uzbek and Russian calendars ──── */

export function Calendar({ date, lang }) {
  const t = UI[lang];
  const year = date.getFullYear();
  const month = date.getMonth();
  const theDay = date.getDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstCol = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [...Array(firstCol).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <div className="mx-auto w-full max-w-[17rem]">
      <p className="font-display mb-3 text-center text-xl capitalize" style={{ color: "var(--accent-deep)" }}>
        {t.months[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {t.weekShort.map((d) => (
          <div key={d} className="pb-1 text-[10px] tracking-wider uppercase" style={{ color: "var(--ink-soft)" }}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            {day === null ? <span className="block h-8 w-8" /> : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                    style={day === theDay
                      ? { background: "var(--accent)", color: "var(--paper)", boxShadow: "0 0 0 3px color-mix(in srgb, var(--gold) 55%, transparent)" }
                      : { color: "var(--ink-soft)" }}>
                {day}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ambient motes ─────────────────────────────────────────────────────── */

export function Ambient() {
  const [motes, setMotes] = useState([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Coarse capability proxy — fewer particles on low-core phones.
    const count = (navigator.hardwareConcurrency ?? 4) <= 4 ? 7 : 12;
    setMotes(Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      size: 3 + Math.random() * 5,
      duration: 26 + Math.random() * 24,
      delay: -Math.random() * 40, // negative: the field starts already in motion
      dx: -5 + Math.random() * 10,
      spin: 90 + Math.random() * 270,
      peak: 0.15 + Math.random() * 0.25,
      gold: Math.random() > 0.45,
    })));
  }, []);

  useEffect(() => {
    const on = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  if (!motes.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {motes.map((m, i) => (
        <span key={i} className="mote" style={{
          left: `${m.left}%`, width: m.size, height: m.size,
          background: m.gold ? "var(--gold)" : "var(--accent)",
          animationDuration: `${m.duration}s`, animationDelay: `${m.delay}s`,
          animationPlayState: paused ? "paused" : "running",
          "--dx": `${m.dx}vw`, "--spin": `${m.spin}deg`, "--mote-peak": m.peak,
        }} />
      ))}
    </div>
  );
}

/* ── Music ─────────────────────────────────────────────────────────────── */

export function MusicPlayer({ src, label, startSignal }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Autoplay is blocked until a user gesture — opening the envelope IS that
  // gesture, so playback starts from that signal rather than on mount.
  useEffect(() => {
    if (!startSignal) return;
    ref.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [startSignal]);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {});
    else { a.pause(); setPlaying(false); }
  }

  return (
    <>
      <audio ref={ref} src={src} loop preload="none" />
      <button type="button" onClick={toggle} aria-label={label} aria-pressed={playing}
        className="absolute right-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition hover:scale-105"
        style={{ background: "color-mix(in srgb, var(--paper) 85%, transparent)",
                 border: "1px solid color-mix(in srgb, var(--gold) 55%, transparent)", color: "var(--accent)" }}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z" />
        </svg>
        {!playing && <span className="absolute h-7 w-0.5 rotate-45 rounded" style={{ background: "var(--accent)" }} aria-hidden />}
      </button>
    </>
  );
}
