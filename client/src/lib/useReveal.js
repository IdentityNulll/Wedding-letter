import { useEffect } from "react";

/** Fade `.fade-up` blocks in as they scroll into view, and reset them once they
 *  leave — so scrolling back up and down again replays the animation.
 *
 *  Deliberately NOT IntersectionObserver, and not requestAnimationFrame:
 *  neither runs while a page isn't compositing (a backgrounded tab, an inactive
 *  window). The failure mode there is the whole invitation stuck invisible, so
 *  this measures rectangles on a plain timer instead. The work is a handful of
 *  getBoundingClientRect calls for ~10 sections, which is cheap enough to do on
 *  every scroll tick. */
export function useReveal(scrollerRef, deps = []) {
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll(".fade-up"));
    if (nodes.length === 0) return;

    const showAll = () => nodes.forEach((n) => n.classList.add("is-in"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showAll();
      return;
    }

    let timer = 0;
    let everRevealed = false;
    let frozen = false; // set by the failsafe; stops all further toggling

    function check() {
      timer = 0;
      if (frozen) return;

      const r = root.getBoundingClientRect();
      // Fire slightly before the element's top reaches the bottom edge, so the
      // motion is already underway as it comes into view.
      const trigger = r.bottom - root.clientHeight * 0.08;

      for (const node of nodes) {
        const b = node.getBoundingClientRect();
        const entered = b.top <= trigger && b.bottom > r.top;
        const fullyGone = b.top > r.bottom || b.bottom < r.top;

        if (entered) {
          node.classList.add("is-in");
          everRevealed = true;
        } else if (fullyGone) {
          // Only reset once it has left the viewport completely — resetting
          // while any part is still visible would flicker mid-scroll.
          node.classList.remove("is-in");
        }
      }
    }

    function onScroll() {
      if (!timer) timer = setTimeout(check, 60);
    }

    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // The first measurement must wait for layout to settle. Measuring at mount
    // reads a page whose webfonts have not loaded, so the cover has not reached
    // full height and every section below it looks on screen — the whole
    // invitation would reveal at once instead of on scroll.
    let cancelled = false;
    const settle = () => setTimeout(() => { if (!cancelled) check(); }, 80);
    if (document.fonts?.ready) document.fonts.ready.then(settle).catch(settle);
    else settle();

    // Last resort: if nothing has ever revealed, something is wrong with the
    // measuring above — show everything rather than leave a guest on a blank
    // page. Only fires in that broken case, so normal replaying is untouched.
    const failsafe = setTimeout(() => {
      if (!everRevealed) {
        frozen = true;
        showAll();
      }
    }, 20000);

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      if (timer) clearTimeout(timer);
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
