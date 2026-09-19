import { useCallback, useEffect, useRef, useState } from "react";

/** Must match the .leaf animation duration in index.css. */
const TURN_MS = 780;

/** A physical book: hard cover, stitched spine, stacked page edges on the
 *  fore-edge, and leaves that rotate about the binding.
 *
 *  `index` commits immediately on navigation; the leaf mid-turn is rendered on
 *  top for the animation's length and then dropped, so "what page am I on"
 *  stays a single number. */
export default function Book({ leaves, labels }) {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(null);
  const busy = useRef(false);
  const timer = useRef(null);
  const scroller = useRef(null);

  const last = leaves.length - 1;

  const endTurn = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setTurn(null);
    busy.current = false;
  }, []);

  const go = useCallback((dir) => {
    if (busy.current) return;
    const target = index + dir;
    if (target < 0 || target > last) return;

    busy.current = true;
    setTurn(dir === 1
      ? { overlay: index, base: target, dir: "fwd" }
      : { overlay: target, base: index, dir: "back" });
    setIndex(target);
    scroller.current?.scrollTo({ top: 0 });

    // Never let navigation depend solely on `animationend`: that event is
    // skipped whenever the page isn't compositing (backgrounded tab, throttled
    // device, interrupted animation) and one missed event would jam paging
    // forever. The timer is the authority; the event is just a faster path.
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(endTurn, TURN_MS + 90);
  }, [index, last, endTurn]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Keyboard paging, ignored while typing — otherwise an arrow key in the
  // guestbook would turn the page mid-message.
  useEffect(() => {
    function onKey(e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || "")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Swipe, with an axis lock so scrolling a long page never turns it.
  const touch = useRef(null);

  function onTouchStart(e) {
    if (e.target.closest("input, textarea, select, button, a")) return;
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, locked: null };
  }
  function onTouchMove(e) {
    const s = touch.current;
    if (!s) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (!s.locked && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      s.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
  }
  function onTouchEnd(e) {
    const s = touch.current;
    touch.current = null;
    if (!s || s.locked !== "x") return;
    const dx = e.changedTouches[0].clientX - s.x;
    if (Math.abs(dx) < 55) return;
    go(dx < 0 ? 1 : -1);
  }

  const baseIndex = turn ? turn.base : index;

  return (
    <div className="book">
      <div className="book-block stage">
        {/* the page currently settled */}
        <Leaf key={leaves[baseIndex].key} entering
              scrollRef={!turn ? scroller : undefined}
              onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          {leaves[baseIndex].node}
        </Leaf>

        {/* shadow the lifting leaf casts on the page beneath */}
        {turn && (
          <div className="leaf-cast pointer-events-none absolute inset-0 z-[15]" aria-hidden
               style={{ background: "linear-gradient(to right, rgba(0,0,0,.5), transparent 45%)" }} />
        )}

        {/* the leaf mid-turn */}
        {turn && (
          <Leaf key={`t-${leaves[turn.overlay].key}-${turn.dir}`} className={`leaf ${turn.dir} z-20`}
                // Only the leaf's own turn counts — the shade inside it runs its
                // own animation whose animationend also bubbles to here.
                onAnimationEnd={(e) => { if (e.target === e.currentTarget) endTurn(); }}
                aria-hidden>
            {leaves[turn.overlay].node}
            <div className="leaf-shade pointer-events-none absolute inset-0 bg-black" />
          </Leaf>
        )}

        <div className="gutter" aria-hidden />

        {/* ── controls ─────────────────────────────────────────────── */}
        <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-2 px-2 pb-2"
             aria-label={labels.pages}>
          <Arrow onClick={() => go(-1)} disabled={index === 0} label={labels.prev} dir="left" />
          <ol className="pointer-events-auto flex items-center justify-center">
            {leaves.map((l, i) => (
              <li key={l.key}>
                {/* narrow mark, 44px tap area */}
                <button type="button" aria-label={l.label}
                        aria-current={i === index ? "true" : undefined}
                        onClick={() => { if (i !== index && !busy.current) go(i > index ? 1 : -1); }}
                        className="flex h-11 w-4 items-center justify-center">
                  <span className="block h-1.5 w-1.5 rotate-45 transition"
                        style={{ background: i === index ? "var(--accent)" : "color-mix(in srgb, var(--gold) 55%, transparent)",
                                 transform: i === index ? "rotate(45deg) scale(1.5)" : undefined }} />
                </button>
              </li>
            ))}
          </ol>
          <Arrow onClick={() => go(1)} disabled={index === last} label={labels.next} dir="right" />
        </nav>
      </div>

      <div className="stitch" aria-hidden />
    </div>
  );
}

function Leaf({ children, className = "", entering, scrollRef, ...rest }) {
  return (
    <div className={`parchment absolute inset-0 ${className}`} {...rest}>
      <div ref={scrollRef} className="no-bar h-full overflow-x-clip overflow-y-auto overscroll-contain">
        <div className={`flex min-h-full flex-col justify-center py-10 pr-7 pl-9 sm:pr-9 sm:pl-12 ${entering ? "enter" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Arrow({ onClick, disabled, label, dir }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full backdrop-blur transition disabled:pointer-events-none disabled:opacity-0"
      style={{ background: "color-mix(in srgb, var(--paper) 80%, transparent)",
               border: "1px solid color-mix(in srgb, var(--gold) 55%, transparent)",
               color: "var(--accent-deep)" }}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
