import { useEffect, useRef, useState } from 'react';
import Icon from '../login/icons';
import './ResearchViewer.css';

/**
 * Modal viewer for a paper / poster / abstract. Shows pre-rendered page images (works on mobile,
 * where PDFs cannot be embedded) and offers the original file through a separate download button.
 * Uses the native <dialog>: Esc closes it and focus stays inside while it is open.
 */
export default function ResearchViewer({ doc, title, onClose }) {
  const dialogRef = useRef(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!doc || !dialog) return undefined;
    setZoomed(false);
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [doc]);

  if (!doc) return null;
  const multiPage = doc.pages.length > 1;

  return (
    <dialog
      ref={dialogRef}
      className="viewer"
      aria-labelledby="viewer-title"
      onClose={onClose}
      // A click that lands on the dialog element itself is a click on the backdrop.
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <header className="viewer__head">
        <div className="viewer__heading">
          <span className="viewer__kind">{doc.label}{multiPage && ` · ${doc.pages.length}쪽`}</span>
          <h3 id="viewer-title" className="viewer__title">{title}</h3>
        </div>
        <div className="viewer__actions">
          <button
            type="button"
            className="viewer__btn"
            onClick={() => setZoomed((z) => !z)}
            aria-pressed={zoomed}
          >
            {zoomed ? '화면 맞춤' : '확대'}
          </button>
          <a href={doc.file} download={doc.downloadName} className="viewer__btn viewer__btn--primary" aria-label={`${doc.label} 다운로드`}>
            <Icon name="download" size={14} />
            <span className="viewer__btn-label">다운로드</span>
          </a>
          <button type="button" className="viewer__btn viewer__btn--icon" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={16} />
          </button>
        </div>
      </header>

      <div className={`viewer__body${zoomed ? ' is-zoomed' : ''}`}>
        {doc.pages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${title} ${doc.label}${multiPage ? ` ${i + 1}쪽` : ''}`}
            className="viewer__page"
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
      </div>
    </dialog>
  );
}
