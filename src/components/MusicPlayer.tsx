"use client";

import { useEffect, useRef, useState } from "react";
import { LETTER_OPENED } from "./EnvelopeGate";

export default function MusicPlayer({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Autoplay is blocked until a user gesture — opening the envelope IS the
    // gesture, so we start there rather than on mount.
    function start() {
      ref.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
    window.addEventListener(LETTER_OPENED, start);
    return () => window.removeEventListener(LETTER_OPENED, start);
  }, []);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {});
    else { a.pause(); setPlaying(false); }
  }

  return (
    <>
      <audio ref={ref} src={src} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={playing}
        className="no-print fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg backdrop-blur transition hover:scale-105"
        style={{
          background: "color-mix(in srgb, var(--paper) 88%, transparent)",
          border: "1px solid color-mix(in srgb, var(--gold) 60%, transparent)",
          color: "var(--accent)",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z" />
        </svg>
        {!playing && (
          <span
            className="absolute h-7 w-0.5 rotate-45 rounded"
            style={{ background: "var(--accent)" }}
            aria-hidden
          />
        )}
      </button>
    </>
  );
}
