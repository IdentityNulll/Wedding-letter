"use client";

import { useEffect, useState } from "react";
import { UI, type Lang } from "@/lib/types";

type Parts = { d: number; h: number; m: number; s: number };

function diff(target: number): Parts | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}

export default function Countdown({ target, lang }: { target: number; lang: Lang }) {
  // Start null on both server and client so the first paint matches; the real
  // value lands on mount. Avoids a hydration mismatch from Date.now().
  const [parts, setParts] = useState<Parts | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setParts(diff(target));
    setReady(true);
    const id = setInterval(() => setParts(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const t = UI[lang];

  if (!ready) return <div className="h-28" />;

  // The day has arrived (or passed) — swap the clock for a warm line rather
  // than showing a frozen row of zeros.
  if (!parts) {
    return (
      <p className="font-script text-center text-3xl" style={{ color: "var(--accent)" }}>
        {t.theBigDay}
      </p>
    );
  }

  const cells: [number, string][] = [
    [parts.d, t.days], [parts.h, t.hours], [parts.m, t.minutes], [parts.s, t.seconds],
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
      {cells.map(([value, label]) => (
        <div
          key={label}
          className="frame min-w-[72px] px-3 py-3 sm:min-w-[92px] sm:px-5 sm:py-4"
          style={{ background: "color-mix(in srgb, var(--paper-2) 70%, transparent)" }}
        >
          <div className="font-display text-3xl leading-none tabular-nums sm:text-5xl" style={{ color: "var(--accent-deep)" }}>
            {String(value).padStart(2, "0")}
          </div>
          <div className="mt-1.5 text-[10px] tracking-[0.18em] uppercase sm:text-xs" style={{ color: "var(--ink-soft)" }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
