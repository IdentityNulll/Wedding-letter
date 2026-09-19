/** Hand-built SVG flourishes. Inline (not <img>) so they inherit the theme's
 *  --gold and cost zero network requests. */

export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`} aria-hidden>
      <svg viewBox="0 0 240 24" className="h-6 w-56" fill="none" stroke="var(--gold)" strokeWidth="1.2">
        <path d="M2 12h78" />
        <path d="M160 12h78" />
        <path d="M96 12c8-9 16-9 24 0s16 9 24 0" />
        <path d="M96 12c8 9 16 9 24 0s16-9 24 0" />
        <circle cx="120" cy="12" r="3.2" fill="var(--gold)" stroke="none" />
        <circle cx="86" cy="12" r="1.8" fill="var(--gold)" stroke="none" />
        <circle cx="154" cy="12" r="1.8" fill="var(--gold)" stroke="none" />
      </svg>
    </div>
  );
}

export function Corner({ className = "" }: { className?: string }) {
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

/** Two rings with a flourish between — sits behind the couple's names. */
export function Monogram({ left, right }: { left: string; right: string }) {
  return (
    <div className="relative mx-auto flex h-24 w-48 items-center justify-center" aria-hidden>
      <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full" fill="none" stroke="var(--gold)" strokeWidth="1.4">
        <circle cx="78" cy="50" r="30" opacity=".55" />
        <circle cx="122" cy="50" r="30" opacity=".55" />
      </svg>
      <span className="font-display absolute left-[22%] text-3xl" style={{ color: "var(--accent)" }}>{left}</span>
      <span className="font-display absolute right-[22%] text-3xl" style={{ color: "var(--accent)" }}>{right}</span>
    </div>
  );
}
