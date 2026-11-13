import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../login/icons';
import logoUrl from '../../assets/login/cell-logo.svg';
import { NAV_LINKS } from './landingContent';
import { closeDialogAnimated, prefersReducedMotion } from './motion';
import { isProgrammaticScroll, scrollToPart } from './useSectionSnap';
import './SectionNav.css';

const SECTION_IDS = NAV_LINKS.map((link) => link.id);

/** Glides to a section, resting where the auto snap would put it (its first snap part). */
export function scrollToSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  scrollToPart(section.matches('[data-snap]') ? section : section.querySelector('[data-snap]') || section);
}

/** Id of the section that crosses the upper part of the viewport. */
export function useActiveSection() {
  const [active, setActive] = useState(SECTION_IDS[0]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); }),
      { rootMargin: '-35% 0px -60% 0px' },
    );
    SECTION_IDS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  return active;
}

function NavItems({ active, className, iconSize, onSelect, itemRefs }) {
  return NAV_LINKS.map((link, i) => {
    const current = link.id === active;
    return (
      <a
        key={link.id}
        ref={itemRefs ? (el) => { itemRefs.current[link.id] = el; } : undefined}
        href={`#${link.id}`}
        className={`${className}${current ? ' is-active' : ''}`}
        style={{ '--i': i }}
        aria-current={current ? 'location' : undefined}
        onClick={(e) => { e.preventDefault(); onSelect(link.id); }}
      >
        <span className={`${className}-icon`}><Icon name={link.icon} size={iconSize} /></span>
        <span className={`${className}-label`}>{link.label}</span>
      </a>
    );
  });
}

/**
 * Lazy follow: while the user scrolls, the rail is carried along with the content, then catches up
 * to its place on a critically damped spring, so it sets off late, speeds up and eases in without
 * bouncing. It never jumps:
 * - scrolls started from code (nav clicks, snap glides) do not carry it, so a clicked rail stays put;
 * - how far it can be carried saturates softly (tanh) instead of hitting a hard limit;
 * - one scroll event carries it at most STEP_MAX px (keyboard / scrollbar jumps).
 */
function useLazyFollow(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    const OMEGA = 6; // return spring (1/s): about 0.7 s to arrive
    const SMOOTH = 22; // display spring (1/s): turns any sudden change into a short glide
    const MAX = 160; // soft limit of how far it is carried
    const STEP_MAX = 60; // most it is carried by a single scroll event
    const saturate = (x) => MAX * Math.tanh(x / MAX);
    const unsaturate = (x) => MAX * Math.atanh(Math.max(-0.995, Math.min(0.995, x / MAX)));

    // `offset` is where the rail should be (carried, then springing home); `shown` follows it.
    let offset = 0;
    let velocity = 0;
    let shown = 0;
    let shownVelocity = 0;
    let lastY = window.scrollY;
    let frame = 0;
    let lastTime = 0;

    const render = () => { el.style.transform = shown ? `translate3d(0, ${shown.toFixed(2)}px, 0)` : ''; };
    const integrate = (dt) => {
      velocity += (-OMEGA * OMEGA * offset - 2 * OMEGA * velocity) * dt;
      offset += velocity * dt;
      shownVelocity += (SMOOTH * SMOOTH * (offset - shown) - 2 * SMOOTH * shownVelocity) * dt;
      shown += shownVelocity * dt;
    };
    const step = (time) => {
      let dt = Math.min(0.1, lastTime ? (time - lastTime) / 1000 : 1 / 60);
      lastTime = time;
      while (dt > 0) { // small sub-steps keep the stiff display spring stable on slow frames
        const h = Math.min(dt, 1 / 240);
        integrate(h);
        dt -= h;
      }
      const settled = Math.abs(offset) < 0.1 && Math.abs(velocity) < 1
        && Math.abs(shown) < 0.1 && Math.abs(shownVelocity) < 1;
      if (settled) {
        offset = 0;
        velocity = 0;
        shown = 0;
        shownVelocity = 0;
        render();
        frame = 0;
        lastTime = 0;
        return;
      }
      render();
      frame = requestAnimationFrame(step);
    };
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (isProgrammaticScroll()) return;
      offset = saturate(unsaturate(offset) - Math.max(-STEP_MAX, Math.min(STEP_MAX, dy)));
      if (!frame) frame = requestAnimationFrame(step);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}

/** Wide screens: toolbar fixed to the left edge, visible while scrolling. */
export function SectionRail({ active }) {
  const driftRef = useRef(null);
  const itemRefs = useRef({});
  const [indicator, setIndicator] = useState(null);

  useLazyFollow(driftRef);

  // The highlight is one element that glides to the active item.
  useLayoutEffect(() => {
    const item = itemRefs.current[active];
    if (item) setIndicator({ top: item.offsetTop, height: item.offsetHeight });
  }, [active]);

  return (
    <nav className="landing-rail" aria-label="섹션 이동">
      <div className="landing-rail__drift" ref={driftRef}>
        <div className="landing-rail__float">
          {indicator && (
            <span
              className="landing-rail__indicator"
              style={{ transform: `translateY(${indicator.top}px)`, height: indicator.height }}
              aria-hidden="true"
            />
          )}
          <NavItems active={active} className="landing-rail__item" iconSize={17} onSelect={scrollToSection} itemRefs={itemRefs} />
        </div>
      </div>
    </nav>
  );
}

/** Narrow screens: the same toolbar slides in from the left (opened by the header menu button). */
export function SectionDrawer({ open, active, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => closeDialogAnimated(dialogRef.current);
  const select = (id) => {
    close();
    scrollToSection(id); // scroll while the drawer slides away
  };

  return (
    <dialog
      ref={dialogRef}
      className="landing-drawer"
      aria-label="섹션 이동"
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); close(); }}
      // A click on the dialog element itself is a click on the backdrop (the panel fills the dialog).
      onClick={(e) => { if (e.target === dialogRef.current) close(); }}
    >
      <div className="landing-drawer__panel">
        <div className="landing-drawer__head">
          <span className="landing-drawer__brand">
            <img src={logoUrl} alt="" />
            CELL
          </span>
          <button type="button" className="landing-drawer__close" onClick={close} aria-label="메뉴 닫기">
            <Icon name="close" size={18} />
          </button>
        </div>
        <nav className="landing-drawer__nav">
          <NavItems active={active} className="landing-drawer__item" iconSize={17} onSelect={select} />
        </nav>
      </div>
    </dialog>
  );
}
