import { useEffect, useRef, useState } from 'react';
import AuthImage from '../../../components/AuthImage';
import Icon from '../../../components/login/icons';
import { imageUrl } from '../../../constants';
import { DEFAULT_IMAGE_DISPLAY_SETTINGS } from '../../../components/ImageDisplayControls';
import { WorkspaceSidebarToggle, useWorkspaceChrome } from '../../../components/console/WorkspaceChrome';
// The frame classes come from the student workspace; review.css adds the professor-only parts.
import '../../student/student.css';
import './review.css';

/*
 * Pieces shared by the professor's labeling and results screens. Both use the student
 * classification workspace's frame (`stu-work`, `stu-pane`, …), so the three screens look alike.
 */

export const DISPLAY_CONTROLS = [
  { key: 'brightness', label: '밝기', min: 50, max: 150 },
  { key: 'contrast', label: '대비', min: 50, max: 180 },
  { key: 'saturation', label: '채도', min: 0, max: 180 },
];

export const isAdjusted = settings => DISPLAY_CONTROLS.some(control => settings[control.key] !== DEFAULT_IMAGE_DISPLAY_SETTINGS[control.key]);

export const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export const timeText = date => date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** Full-height screen header: sidebar toggle, back, title and badges; status, menu and account on the right. */
export function WorkHeader({ title, onBack, backLabel, children, status, menu }) {
  const { account } = useWorkspaceChrome();
  return (
    <header className="stu-work__head">
      <div className="stu-work__head-main">
        <WorkspaceSidebarToggle />
        <button type="button" className="prof-icon-btn" onClick={onBack} title={backLabel} aria-label={backLabel}><Icon name="arrowLeft" size={18} /></button>
        <span className="stu-work__divider" aria-hidden="true" />
        <h1 title={title}>{title}</h1>
        {children}
      </div>
      <div className="stu-work__head-side">
        {status}
        {menu}
        {account}
      </div>
    </header>
  );
}

/**
 * "⋯" menu. `items`: [{ key, icon, text, onClick, danger, disabled, title }]; an item with `file`
 * ({ accept, onFile }) opens a file picker instead.
 */
export function MoreMenu({ label = '더 보기', items }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const onKey = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const shown = items.filter(Boolean);
  if (!shown.length) return null;
  return (
    <div className="prof-menu" ref={root}>
      <button type="button" className="prof-icon-btn" aria-haspopup="menu" aria-expanded={open} aria-label={label} title={label} onClick={() => setOpen(value => !value)}>
        <Icon name="more" size={18} />
      </button>
      {open && (
        <div className="prof-menu__list rv-menu" role="menu">
          {shown.map(item => item.file ? (
            <label key={item.key} role="menuitem" className={`rv-menu__file${item.disabled ? ' is-disabled' : ''}`} title={item.title}>
              <Icon name={item.icon} size={15} />{item.text}
              <input type="file" accept={item.file.accept} disabled={item.disabled}
                onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; setOpen(false); if (file) item.file.onFile(file); }} />
            </label>
          ) : (
            <button key={item.key} type="button" role="menuitem" className={item.danger ? 'is-danger' : undefined} disabled={item.disabled} title={item.title}
              onClick={() => { setOpen(false); item.onClick(); }}>
              <Icon name={item.icon} size={15} />{item.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** One line under the header for an error or a short confirmation. */
export function Flash({ flash, onClose }) {
  if (!flash) return null;
  return (
    <div className={`rv-flash is-${flash.kind}`} role={flash.kind === 'error' ? 'alert' : 'status'}>
      <span>{flash.text}</span>
      <button type="button" className="prof-icon-btn prof-icon-btn--sm" onClick={onClose} aria-label="닫기" title="닫기"><Icon name="close" size={14} /></button>
    </div>
  );
}

/** Small smear picture in the smear list (the thumbnail file, or the original when there is none). */
export function SmearThumb({ filename }) {
  return <AuthImage src={filename ? imageUrl.thumbnail(filename) : null} fallbackSrc={filename ? imageUrl.original(filename) : null} alt="" className="stu-smear__thumb" />;
}

/** Footer centre: previous / position / next, as on the student screen. */
export function Stepper({ index, total, onStep }) {
  return (
    <div className="stu-foot__stepper">
      <button type="button" className="prof-btn" onClick={() => onStep(-1)} disabled={index <= 0} title="이전 세포 (←)"><Icon name="arrowLeft" size={15} /><span>이전</span></button>
      <span className="stu-foot__position prof-mono"><strong>{index + 1}</strong> / {total}</span>
      <button type="button" className="prof-btn" onClick={() => onStep(1)} disabled={index >= total - 1} title="다음 세포 (→ 또는 Space)"><span>다음</span><Icon name="arrowRight" size={15} /></button>
    </div>
  );
}

/** Brightness, contrast and saturation of the images on this screen (the files are not changed). */
export function AdjustPanel({ display }) {
  return (
    <div className="stu-adjust">
      {DISPLAY_CONTROLS.map(control => (
        <label key={control.key} className="stu-slider">
          <span>{control.label}</span>
          <input type="range" min={control.min} max={control.max} value={display.settings[control.key]}
            onChange={event => display.updateSetting(control.key, event.target.value)} />
          <span className="prof-mono">{display.settings[control.key]}%</span>
        </label>
      ))}
      <button type="button" className="stu-textbtn" onClick={display.resetSettings} disabled={!isAdjusted(display.settings)}>초기화</button>
    </div>
  );
}

/** A small centred window over a dimmed screen. Escape and a click outside close it unless `busy`. */
export function WorkModal({ title, onClose, busy, children, actions, labelledBy = 'rv-modal-title' }) {
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, busy]);
  return (
    <div className="stu-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="stu-modal__panel rv-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <h2 id={labelledBy}>{title}</h2>
        {children}
        {actions && <div className="stu-modal__actions">{actions}</div>}
      </section>
    </div>
  );
}

/** A labelled on/off switch with a one-line explanation. */
export function Switch({ checked, onChange, label, note, disabled }) {
  return (
    <label className={`rv-switch${disabled ? ' is-disabled' : ''}`}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
      <span className="rv-switch__track" aria-hidden="true" />
      <span className="rv-switch__text"><strong>{label}</strong>{note && <small>{note}</small>}</span>
    </label>
  );
}

/**
 * Keyboard shortcuts for a work screen. Typing in a text field, a slider or a select, and any open
 * dialog, take the keys first. `handler(event)` returns nothing.
 */
export function useWorkKeys(handler) {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    const onKey = event => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      if (tag === 'INPUT' && !['checkbox', 'radio', 'button'].includes(target.type)) return;
      if (document.querySelector('.stu-modal')) return;
      latest.current(event, tag);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}

/** Downloads a Blob under `name`. */
export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
