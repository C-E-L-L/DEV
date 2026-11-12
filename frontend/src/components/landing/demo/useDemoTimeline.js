import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Drives a looping, GIF-like demo: one step at a time, each with its own duration.
 * - Pauses automatically while the demo is scrolled out of view.
 * - With OS "reduce motion" it starts paused on `posterStep` (user can still press play).
 */
export default function useDemoTimeline(steps, { posterStep = 0 } = {}) {
  const rootRef = useRef(null);
  const reduced = useRef(prefersReducedMotion()).current;
  const [index, setIndex] = useState(reduced ? posterStep : 0);
  const [playing, setPlaying] = useState(!reduced);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return undefined;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % steps.length), steps[index].duration);
    return () => window.clearTimeout(timer);
  }, [index, playing, visible, steps]);

  const step = steps[index];
  const phases = [...new Set(steps.map((s) => s.phase))];

  return {
    rootRef,
    index,
    step,
    playing,
    phases,
    activePhase: step.phase,
    togglePlaying: () => setPlaying((p) => !p),
    goToPhase: (phase) => setIndex(steps.findIndex((s) => s.phase === phase)),
    /** True once the timeline has reached (or passed) the given step id in this loop. */
    reached: (id) => index >= steps.findIndex((s) => s.id === id),
  };
}
