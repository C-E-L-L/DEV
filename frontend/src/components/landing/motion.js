// Small motion helpers shared by the landing page (section snap, rail, dialogs).

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Closes a <dialog> after its closing animation: adds `is-closing` (the CSS animates the panel and
 * the backdrop out), then calls dialog.close() so the usual `close` event follows.
 */
export function closeDialogAnimated(dialog) {
  if (!dialog?.open || dialog.classList.contains('is-closing')) return;
  if (prefersReducedMotion()) {
    dialog.close();
    return;
  }
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    dialog.removeEventListener('animationend', onEnd);
    dialog.classList.remove('is-closing');
    dialog.close();
  };
  // Children animate too (and their animationend bubbles up), so only the dialog's own counts.
  const onEnd = (e) => { if (e.target === dialog) finish(); };
  dialog.addEventListener('animationend', onEnd);
  dialog.classList.add('is-closing');
  setTimeout(finish, 400); // in case the animation never runs
}
