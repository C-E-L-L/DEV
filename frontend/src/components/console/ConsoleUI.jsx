import { useCallback, useEffect, useId, useRef, useState } from 'react';
import axios from 'axios';

export const errorMessage = error => error?.response?.data?.message || error?.message || '요청을 처리하지 못했습니다.';
export const dateText = value => value ? new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export function useRemote(loader, dependencies = []) {
  const latest = useRef(loader); latest.current = loader;
  const sequence = useRef(0);
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const reload = useCallback(async () => {
    const id = ++sequence.current;
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await latest.current();
      if (sequence.current === id) setState({ data, loading: false, error: '' });
    } catch (error) {
      if (sequence.current === id && !axios.isCancel(error)) setState(current => ({ ...current, loading: false, error: errorMessage(error) }));
    }
  }, []);
  useEffect(() => { setState({ data: null, loading: true, error: '' }); reload(); return () => { sequence.current++; }; }, [reload, ...dependencies]);
  return { ...state, reload };
}

export function RemoteState({ state, empty, children }) {
  if (state.loading && state.data == null) return <p role="status" className="adm-empty">불러오는 중…</p>;
  if (state.error) return <div role="alert" className="adm-error">{state.error} <button type="button" onClick={state.reload}>다시 시도</button></div>;
  if (empty) return <p className="adm-empty">아직 표시할 데이터가 없습니다.</p>;
  return children;
}

export function Dialog({ title, onClose, children, wide = false }) {
  const root = useRef(null);
  const titleId = useId();
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const focusable = () => [...root.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')];
    (focusable()[0] || root.current).focus();
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key === 'Tab') {
        const nodes = focusable(); const first = nodes[0]; const last = nodes.at(-1);
        if (!nodes.length) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, []);
  return <div className="console-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={root} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`console-dialog${wide ? ' is-wide' : ''}`}>
      <header><h2 id={titleId}>{title}</h2><button type="button" aria-label="닫기" onClick={onClose}>×</button></header>
      <div className="console-dialog-body">{children}</div>
    </section>
  </div>;
}
