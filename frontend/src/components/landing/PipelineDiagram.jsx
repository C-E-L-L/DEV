import { useLayoutEffect, useRef, useState } from 'react';
import Icon from '../login/icons';
import { PIPELINE } from './landingContent';
import './PipelineDiagram.css';

/**
 * Data-cycle flow chart: one row of steps (colored by who does them), group brackets above and a
 * dashed "model retraining" arrow from the dataset back to the AI step. On small screens the steps
 * stack vertically and the loop runs up the right side instead.
 */
export default function PipelineDiagram() {
  const { actors, groups, steps, loop } = PIPELINE;
  const n = steps.length;
  const aiIndex = steps.findIndex((s) => s.actor === 'ai');
  // Loop runs between the centers of the AI column and the last column (columns have no gap).
  const loopStyle = { left: `${((aiIndex + 0.5) / n) * 100}%`, right: `${(0.5 / n) * 100}%` };

  // Stacked layout: the loop runs from the middle of the last node up to the middle of the AI node.
  // Node heights depend on the text wrapping, so measure them.
  const trackRef = useRef(null);
  const [stackLoop, setStackLoop] = useState(null);
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const measure = () => {
      const nodes = track.querySelectorAll('.flow-node');
      const from = nodes[aiIndex];
      const to = nodes[n - 1];
      if (!from || !to) return;
      const base = track.getBoundingClientRect().top;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const top = a.top + a.height / 2 - base;
      setStackLoop({ top, height: b.top + b.height / 2 - base - top });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [aiIndex, n]);

  // Group label shown on the first step of each group (used by the stacked mobile layout).
  const groupStart = {};
  groups.reduce((start, group) => { groupStart[start] = group.label; return start + group.span; }, 0);

  return (
    <div className="flow" style={{ '--flow-cols': n }}>
      <ul className="flow-legend" aria-label="단계별 담당">
        {Object.entries(actors).map(([key, label]) => (
          <li key={key} className={`flow-legend__item flow--${key}`}><i aria-hidden="true" />{label}</li>
        ))}
      </ul>

      <div className="flow-groups" aria-hidden="true">
        {groups.map((group) => (
          <span key={group.label} className="flow-groups__item" style={{ gridColumn: `span ${group.span}` }}>
            {group.label}
          </span>
        ))}
      </div>

      <div className="flow-track" ref={trackRef}>
        <ol className="flow-steps">
          {steps.map((step, i) => (
            <li key={step.title} className={`flow-step flow--${step.actor}`}>
              {groupStart[i] && <span className="flow-step__group">{groupStart[i]}</span>}
              <div className="flow-node">
                <div className="flow-node__top">
                  <span className="flow-node__actor">{actors[step.actor]}</span>
                  <span className="flow-node__num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <span className="flow-node__icon"><Icon name={step.icon} size={18} /></span>
                <strong className="flow-node__title">{step.title}</strong>
                <p className="flow-node__desc">{step.desc}</p>
                {step.chips && (
                  <span className="flow-node__chips">
                    {step.chips.map((chip) => <span key={chip}>{chip}</span>)}
                  </span>
                )}
                {step.research && <span className="flow-node__research">{step.research}</span>}
              </div>
            </li>
          ))}
        </ol>
        {stackLoop && (
          <div className="flow-loop-v" style={{ top: stackLoop.top, height: stackLoop.height }}>
            <span className="flow-loop-v__label"><Icon name="refresh" size={12} />{loop.text}</span>
          </div>
        )}
      </div>

      <div className="flow-loop">
        <span className="flow-loop__line" style={loopStyle} aria-hidden="true" />
        <p className="flow-loop__label" style={loopStyle}>
          <span className="flow-loop__pill">
            <Icon name="refresh" size={13} />
            {loop.text}
          </span>
        </p>
      </div>
    </div>
  );
}
