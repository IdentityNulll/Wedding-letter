"use client";

import { useEffect, useState } from "react";

type Mote = {
  left: number;
  size: number;
  duration: number;
  delay: number;
  dx: number;
  spin: number;
  peak: number;
  gold: boolean;
};

/** Slow motes drifting up the page — dust in a shaft of light rather than the
 *  falling-petals effect every competitor uses.
 *
 *  Performance rules this obeys, because a wedding guest is on a mid-range
 *  Android on patchy data:
 *    · only transform + opacity animate, so each mote stays on the compositor
 *      and never triggers layout or paint
 *    · the node count is small and drops further on low-core devices
 *    · animations pause entirely when the tab is hidden
 *    · nothing renders at all under prefers-reduced-motion
 *
 *  Generated on mount, never on the server: the values are random, and
 *  rendering them server-side would guarantee a hydration mismatch. */
export default function Ambient() {
  const [motes, setMotes] = useState<Mote[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Coarse proxy for device capability. Phones reporting few cores get fewer
    // particles; desktops get the full set.
    const cores = navigator.hardwareConcurrency ?? 4;
    const count = cores <= 4 ? 8 : 14;

    setMotes(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        size: 3 + Math.random() * 6,
        duration: 26 + Math.random() * 26,
        delay: -Math.random() * 40, // negative: the field starts already in motion
        dx: -6 + Math.random() * 12,
        spin: 90 + Math.random() * 270,
        peak: 0.18 + Math.random() * 0.3,
        gold: Math.random() > 0.45,
      })),
    );
  }, []);

  useEffect(() => {
    function onVisibility() { setPaused(document.hidden); }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (motes.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ animationPlayState: paused ? "paused" : "running" }}
      aria-hidden
    >
      {motes.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: `${m.left}%`,
            width: m.size,
            height: m.size,
            background: m.gold ? "var(--gold)" : "var(--accent)",
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
            animationPlayState: paused ? "paused" : "running",
            ["--dx" as string]: `${m.dx}vw`,
            ["--spin" as string]: `${m.spin}deg`,
            ["--mote-peak" as string]: m.peak,
          }}
        />
      ))}
    </div>
  );
}
