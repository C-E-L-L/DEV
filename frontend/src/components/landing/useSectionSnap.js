import { useEffect } from 'react';
import { prefersReducedMotion } from './motion';

// Gentle section snapping for the landing page.
//
// When scrolling stops and a part (an element with `data-snap`) is close ahead in the direction of
// travel, the page glides to it: a part that fits on screen is centred in the area under the header,
// a taller one starts just under the header. Parts that are far away are left alone, so reading
// inside a long section is never interrupted.
// CSS scroll-snap is not used: its proximity range is fixed and with a mouse wheel it keeps pulling
// back to the section start, which feels sticky.

const IDLE_MS = 160; // scrolling counts as stopped after this long without scroll events
const AHEAD = 0.4; // snap when the part's resting position is within this share of the visible height ahead
const BEHIND = 72; // ...or when it was overshot by at most this many px
const STALE_MS = 3000;
const HEADER = 64; // fixed header height
const FIT_GAP = 24; // a part is centred only if it fits with at least this much room above and below

let programmaticAt = 0;

/** Call before scrolling from code (nav clicks), so the snap does not react to that scroll. */
export function markProgrammaticScroll() {
  programmaticAt = performance.now();
}

/** True while a scroll started from code (nav click or snap glide) is running. */
export function isProgrammaticScroll() {
  return programmaticAt !== 0 && performance.now() - programmaticAt < STALE_MS;
}

/**
 * Scroll position at which a part rests: centred in the area under the header when it fits there,
 * otherwise with its top just under the header (its scroll-margin-top).
 */
export function snapTop(el, scrollY = window.scrollY) {
  const rect = el.getBoundingClientRect();
  const top = rect.top + scrollY;
  const visible = window.innerHeight - HEADER;
  if (rect.height <= visible - FIT_GAP * 2) {
    return Math.round(top + rect.height / 2 - HEADER - visible / 2);
  }
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || HEADER;
  return Math.round(top - margin);
}

/** Glides to a part (nav clicks use the same resting position as the snap). */
export function scrollToPart(el) {
  if (!el) return;
  markProgrammaticScroll();
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: Math.max(0, Math.min(snapTop(el), maxY)), behavior: 'smooth' });
}

export default function useSectionSnap() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    let restY = window.scrollY; // where the current scroll gesture started
    let idleTimer = 0;
    let touching = false;

    const settle = () => {
      idleTimer = 0;
      if (touching) return; // wait for the finger to lift (momentum scroll follows, then we settle)
      const y = window.scrollY;
      const direction = Math.sign(y - restY);
      restY = y;

      if (programmaticAt) {
        const ours = performance.now() - programmaticAt < STALE_MS;
        programmaticAt = 0;
        if (ours) return;
      }
      if (!direction) return;
      if (document.documentElement.style.overflow === 'hidden') return; // a modal is open

      const ahead = (window.innerHeight - HEADER) * AHEAD;
      let best = null;
      document.querySelectorAll('[data-snap]').forEach((el) => {
        const target = snapTop(el, y);
        const distance = (target - y) * direction; // > 0: still ahead of us
        if (distance > -BEHIND && distance < ahead && (best === null || Math.abs(target - y) < Math.abs(best - y))) {
          best = target;
        }
      });
      if (best === null) return;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      const top = Math.max(0, Math.min(best, maxY));
      if (Math.abs(top - y) < 4) return;
      markProgrammaticScroll();
      window.scrollTo({ top, behavior: 'smooth' });
    };

    const schedule = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(settle, IDLE_MS);
    };
    // The user taking over (even mid-glide) makes the rest of the scroll theirs again.
    const onUserInput = () => { programmaticAt = 0; };
    const onTouchStart = () => { touching = true; onUserInput(); clearTimeout(idleTimer); };
    const onTouchEnd = () => { touching = false; schedule(); };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('wheel', onUserInput, { passive: true });
    window.addEventListener('keydown', onUserInput);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('wheel', onUserInput);
      window.removeEventListener('keydown', onUserInput);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);
}
