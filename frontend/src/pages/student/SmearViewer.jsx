import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../../components/login/icons';
import AuthImage from '../../components/AuthImage';
import { imageUrl } from '../../constants';

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const STEP = 1.25;
const clamp = value => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));

/**
 * Scrolls `container` just enough to show `element`. Unlike scrollIntoView it never scrolls the
 * page around the container, which on phones would push the viewer off screen.
 */
export function revealInside(container, element, margin = 4) {
  if (!container || !element) return;
  const box = container.getBoundingClientRect();
  const target = element.getBoundingClientRect();
  if (target.top < box.top + margin) container.scrollTop -= box.top + margin - target.top;
  else if (target.bottom > box.bottom - margin) container.scrollTop += target.bottom - (box.bottom - margin);
  if (target.left < box.left + margin) container.scrollLeft -= box.left + margin - target.left;
  else if (target.right > box.right - margin) container.scrollLeft += target.right - (box.right - margin);
}

function parseBbox(value) {
  try {
    const box = Array.isArray(value) ? value : JSON.parse(String(value).replace(/'/g, '"'));
    return box.map(Number);
  } catch { return [0, 0, 0, 0]; }
}

/**
 * The smear image with one box per detected cell. Boxes are placed in percent of the image's
 * natural size, so they stay aligned at any zoom level and window size.
 * `cells`: [{ id, number, state: 'current' | 'done' | 'todo', label }]. `label` is the student's own answer.
 * The professor screens reuse it and may also pass `tone` (an extra `is-…` class), `tag` (text in the
 * number tag) and `description` (the accessible name after the number).
 */
export default function SmearViewer({ filename, filter, cells, onSelect }) {
  const scroller = useRef(null);
  const drag = useRef(null);
  const [natural, setNatural] = useState(null);
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => { setNatural(null); setZoom(1); }, [filename]);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return undefined;
    const measure = () => setRoom({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Fit the whole smear into the viewer at 100%, then scale from there.
  const fit = natural && room.width && room.height
    ? Math.min((room.width - 24) / natural.width, (room.height - 24) / natural.height) : 0;
  const stage = fit > 0 ? { width: natural.width * fit * zoom, height: natural.height * fit * zoom } : null;

  const currentId = cells.find(cell => cell.state === 'current')?.id;
  useEffect(() => {
    if (zoom === 1 || currentId == null) return;
    revealInside(scroller.current, scroller.current?.querySelector('.stu-box.is-current'), 24);
  }, [currentId, zoom]);

  // Drag to move around a zoomed smear. A drag must not also select the cell under the pointer.
  const onPointerDown = event => {
    if (event.button !== 0 || zoom === 1) return;
    drag.current = { x: event.clientX, y: event.clientY, left: scroller.current.scrollLeft, top: scroller.current.scrollTop, moved: false };
  };
  const onPointerMove = event => {
    const start = drag.current;
    if (!start || !(event.buttons & 1)) { drag.current = null; return; }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 5) return;
    start.moved = true;
    scroller.current.scrollLeft = start.left - dx;
    scroller.current.scrollTop = start.top - dy;
  };
  const onClickCapture = event => {
    if (drag.current?.moved) { event.stopPropagation(); event.preventDefault(); }
    drag.current = null;
  };

  return (
    <div className="stu-viewer">
      <div ref={scroller} className={`stu-viewer__scroll${zoom > 1 ? ' is-zoomed' : ''}`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onClickCapture={onClickCapture}>
        <div className="stu-viewer__stage" style={stage || undefined}>
          <AuthImage
            key={filename}
            src={imageUrl.original(filename)}
            alt="혈액 도말 이미지"
            draggable={false}
            onLoad={event => setNatural({ width: event.target.naturalWidth, height: event.target.naturalHeight })}
            className="stu-viewer__image"
            style={{ filter }}
            loadingText="도말 이미지를 불러오는 중…"
            errorText="도말 이미지를 불러오지 못했습니다."
          />
          {stage && cells.map(cell => {
            const [x1, y1, x2, y2] = parseBbox(cell.bbox);
            const description = cell.description ?? (cell.label ? `내 답 ${cell.label}` : '미분류');
            return (
              <button key={cell.id} type="button" className={`stu-box is-${cell.state}${cell.tone ? ` is-${cell.tone}` : ''}`}
                aria-label={`세포 ${cell.number} · ${description}`} aria-pressed={cell.state === 'current'}
                title={cell.description ?? `#${cell.number} ${cell.label ? `내 답: ${cell.label}` : '미분류'}`}
                onClick={() => onSelect(cell.index)}
                style={{
                  left: `${(x1 / natural.width) * 100}%`, top: `${(y1 / natural.height) * 100}%`,
                  width: `${((x2 - x1) / natural.width) * 100}%`, height: `${((y2 - y1) / natural.height) * 100}%`,
                }}>
                <span className="stu-box__tag prof-mono">{cell.tag ?? cell.number}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="stu-zoom" role="group" aria-label="확대/축소">
        <button type="button" onClick={() => setZoom(value => clamp(value / STEP))} disabled={zoom <= MIN_ZOOM} title="축소" aria-label="축소"><Icon name="minus" size={15} /></button>
        <span className="prof-mono" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(value => clamp(value * STEP))} disabled={zoom >= MAX_ZOOM} title="확대" aria-label="확대"><Icon name="plus" size={15} /></button>
        <span className="stu-zoom__sep" aria-hidden="true" />
        <button type="button" onClick={() => setZoom(1)} disabled={zoom === 1} title="화면에 맞춤" aria-label="화면에 맞춤"><Icon name="refresh" size={14} /></button>
      </div>
    </div>
  );
}
