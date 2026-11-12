import { DEMO_IMAGE, DEMO_IMAGE_RATIO } from './demoData';

/** Zoomed view of one cell: the full image is scaled so the cell's box fills ~65% of the square. */
export default function CellZoom({ cell, size = 150 }) {
  const [x, y, w, h] = cell.box;
  const imgW = (65 / w) * 100;
  const imgH = imgW / DEMO_IMAGE_RATIO;
  const left = 50 - imgW * (x + w / 2) / 100;
  const top = 50 - imgH * (y + h / 2) / 100;
  return (
    <span className="sd-zoom" style={{ width: size, height: size }}>
      <img src={DEMO_IMAGE} alt="" style={{ width: `${imgW}%`, left: `${left}%`, top: `${top}%` }} />
    </span>
  );
}
