"use client";

import { useState } from "react";
import { UI, type Lang } from "@/lib/types";

/** Group a card number into 4s for readability, but copy the raw digits. */
function pretty(n: string): string {
  const digits = n.replace(/\D/g, "");
  return digits.replace(/(.{4})/g, "$1 ").trim() || n;
}

export default function GiftCard({
  number,
  holder,
  note,
  lang,
}: {
  number: string;
  holder: string;
  note: string;
  lang: Lang;
}) {
  const t = UI[lang];
  const [copied, setCopied] = useState(false);

  async function copy() {
    const digits = number.replace(/\D/g, "") || number;
    try {
      await navigator.clipboard.writeText(digits);
    } catch {
      // Older mobile browsers / non-secure origins have no clipboard API.
      const ta = document.createElement("textarea");
      ta.value = digits;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* give up silently */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-md text-center">
      {note && (
        <p className="mb-6 text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {note}
        </p>
      )}

      <div
        className="frame px-4 py-6 sm:px-8"
        style={{ background: "color-mix(in srgb, var(--paper-2) 55%, transparent)" }}
      >
        <p
          className="font-display text-xl tracking-[0.12em] tabular-nums break-all sm:text-3xl sm:tracking-[0.18em]"
          style={{ color: "var(--accent-deep)" }}
        >
          {pretty(number)}
        </p>
        {holder && (
          <p className="mt-3 text-xs tracking-[0.25em] uppercase" style={{ color: "var(--ink-soft)" }}>
            {holder}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={copy}
        className="mt-5 min-h-11 w-full rounded-sm px-6 py-3 text-xs tracking-[0.2em] uppercase transition active:scale-[0.98] sm:w-auto"
        style={{ background: "var(--accent)", color: "var(--paper)" }}
      >
        {copied ? t.copied : t.copyCard}
      </button>
    </div>
  );
}
