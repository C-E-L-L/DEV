import { useLayoutEffect, useRef, useState } from 'react';
import Icon from '../../login/icons';
import './LandingDemo.css';

/** The demo screen is laid out at this fixed size, then scaled to the available width (like a GIF). */
export const STAGE_W = 600;
export const STAGE_H = 400;
/** Below this window width (phones) the screen switches to a narrower portrait stage so text stays readable. */
const COMPACT_BELOW = 520;
const COMPACT_W = 380;

/** Arrow cursor that glides to the element marked data-demo-target="<step.target>" and "clicks". */
function DemoCursor({ screenRef, step, index, scale }) {
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    const screen = screenRef.current;
    const target = step.target && screen?.querySelector(`[data-demo-target="${step.target}"]`);
    if (!screen || !target) return;
    const s = screen.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    setPos({ x: t.left - s.left + t.width / 2, y: t.top - s.top + t.height / 2 });
  }, [screenRef, step, index, scale]);

  if (!pos) return null;
  return (
    <span className="demo-cursor" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }} aria-hidden="true">
      {step.click && <span key={index} className="demo-cursor__ripple" />}
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.4-6.7L4 20z" fill="#0f172a" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * Window chrome around a scripted demo: title bar, play/pause, the scaled screen and phase chips
 * (click a chip to jump to that phase).
 */
export default function DemoWindow({
  timeline, role, roleTone, title, description, phaseLabels, compactHeight = 520, stages: stagesProp, className = '', children,
}) {
  const screenRef = useRef(null);
  // Stage sizes from widest to narrowest; the first whose minWidth fits the window is used.
  const stages = stagesProp || [
    { name: 'regular', minWidth: COMPACT_BELOW, w: STAGE_W, h: STAGE_H },
    { name: 'compact', minWidth: 0, w: COMPACT_W, h: compactHeight },
  ];
  const [layout, setLayout] = useState({ name: stages[0].name, scale: 1 });
  const { rootRef, step, index, playing, togglePlaying, phases, activePhase, goToPhase } = timeline;
  const { name: stageName, scale } = layout;
  const stage = stages.find((s) => s.name === stageName) || stages[0];

  useLayoutEffect(() => {
    const node = screenRef.current;
    if (!node) return undefined;
    const update = () => {
      const width = node.clientWidth;
      const next = stages.find((s) => width >= s.minWidth) || stages[stages.length - 1];
      setLayout({ name: next.name, scale: width / next.w });
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
    // `stages` is static per demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <figure ref={rootRef} className={`demo demo--${roleTone} ${className}`.trim()} aria-label={`${role} ${title} 예시 화면: ${description}`}>
      <div className="demo__bar">
        <span className="demo__lights" aria-hidden="true"><i /><i /><i /></span>
        <span className="demo__role">{role}</span>
        <span className="demo__title">{title}</span>
        <button
          type="button"
          className="demo__toggle"
          onClick={togglePlaying}
          aria-label={playing ? `${role} 데모 일시정지` : `${role} 데모 재생`}
        >
          <Icon name={playing ? 'pause' : 'play'} size={12} />
        </button>
      </div>

      <div ref={screenRef} className="demo__screen" style={{ aspectRatio: `${stage.w} / ${stage.h}` }} aria-hidden="true">
        <div
          className={`demo__stage is-${stage.name}`}
          data-step={step.id}
          style={{ width: stage.w, height: stage.h, transform: `scale(${scale})` }}
        >
          {children}
        </div>
        <DemoCursor screenRef={screenRef} step={step} index={index} scale={`${stage.name}-${scale}`} />
      </div>

      <div className="demo__phases" role="group" aria-label={`${role} 데모 단계로 이동`}>
        {phases.map((phase, i) => (
          <button
            key={phase}
            type="button"
            className={`demo__phase${phase === activePhase ? ' is-active' : ''}`}
            aria-current={phase === activePhase ? 'step' : undefined}
            onClick={() => goToPhase(phase)}
          >
            <span className="demo__phase-num">{i + 1}</span>
            {phaseLabels[phase]}
          </button>
        ))}
      </div>
    </figure>
  );
}
