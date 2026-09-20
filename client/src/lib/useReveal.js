import { useEffect } from "react";

/** Reveal `.fade-up` blocks as they scroll into view inside `scrollerRef`.
 *
 *  Deliberately NOT IntersectionObserver. IO silently never fires when the page
 *  isn't compositing frames, and the failure mode here is the whole invitation
 *  stuck at opacity 0 — an unacceptable way to lose the content. A scroll
 *  listener comparing rectangles always runs, is trivially cheap for the ~10
 *  sections involved, and detaches itself once everything has been revealed.
 *
 *  A timer also force-reveals everything shortly after mount, so no combination
 *  of missed events can leave a guest looking at a blank page. */
export function useReveal(scrollerRef, deps = []) {
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    let pending = Array.from(root.querySelectorAll(".fade-up:not(.is-in)"));
    if (pending.length === 0) return;

    const revealAll = () => {
      pending.forEach((n) => n.classList.add("is-in"));
      pending = [];
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealAll();
      return;
    }

    // Throttled with a timer rather than requestAnimationFrame: rAF does not
    // fire while a page isn't compositing (a backgrounded tab, an inactive
    // window), which would leave sections permanently invisible. A 60ms timer
    // always runs, and the work is a handful of getBoundingClientRect calls.
    let timer = 0;

    function check() {
      timer = 0;
      if (pending.length === 0) return detach();

      const rootBottom = root.getBoundingClientRect().bottom;
      // Fire a little before the element's top edge reaches the bottom of the
      // viewport, so the motion is already underway when it comes into view.
      const trigger = rootBottom - root.clientHeight * 0.08;

      const still = [];
      for (const node of pending) {
        if (node.getBoundingClientRect().top <= trigger) node.classList.add("is-in");
        else still.push(node);
      }
      pending = still;
      if (pending.length === 0) detach();
    }

    function onScroll() {
      if (!timer) timer = setTimeout(check, 60);
    }

    function detach() {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (timer) clearTimeout(timer);
      timer = 0;
    }

    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // The first measurement must wait for layout to settle. Measuring at mount
    // reads a page whose webfonts have not loaded yet — the cover has not
    // reached full height, so every section below it looks on screen and the
    // whole invitation reveals at once instead of on scroll.
    let cancelled = false;
    const settle = () => setTimeout(() => { if (!cancelled) check(); }, 80);

    if (document.fonts?.ready) document.fonts.ready.then(settle).catch(settle);
    else settle();

    // Last-resort safety net, deliberately long: scrolling should always be
    // what reveals a section. This only exists so that a broken listener can
    // never leave a guest staring at a blank invitation.
    const failsafe = setTimeout(revealAll, 20000);

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
