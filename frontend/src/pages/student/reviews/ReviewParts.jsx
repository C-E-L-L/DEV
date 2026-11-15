import Icon from '../../../components/login/icons';
import AuthImage from '../../../components/AuthImage';
import { DEFAULT_IMAGE_DISPLAY_SETTINGS } from '../../../components/ImageDisplayControls';
import { imageUrl } from '../../../constants';
import { answerLabel } from '../../../utils/cellClasses';
import { cellStatus } from '../../../utils/studentReview';

const STATUS = {
  correct: { label: '정답', tone: 'is-emerald' },
  wrong: { label: '오답', tone: 'stu-badge-rose' },
  pending: { label: '채점 대기', tone: 'is-amber' },
};

export function CellBadge({ cell }) {
  const status = STATUS[cellStatus(cell)];
  return <span className={`prof-badge ${status.tone}`}>{status.label}</span>;
}

export function SpeciesTag({ cell }) {
  return <span className="prof-badge">{cell?.speciesName || cell?.speciesCode || '동물 종 미확인'}</span>;
}

export function ReviewSummary({ summary, unsubmitted }) {
  const values = [
    ['정답률', summary.accuracy == null ? '—' : `${summary.accuracy}%`, 'primary'],
    ['정답', summary.correct, 'correct'], ['오답', summary.wrong, 'wrong'],
    ['채점 대기', summary.pending, 'pending'],
    ...(unsubmitted != null ? [['미응답', unsubmitted, 'muted']] : []),
  ];
  return <div className="stu-review__summary">
    {values.map(([label, value, tone]) => <div key={label} className={`stu-review__stat is-${tone}`}>
      <span>{label}</span><strong className="prof-mono">{value}</strong>
    </div>)}
  </div>;
}

export function ReviewImageControls({ display }) {
  const adjusted = Object.entries(DEFAULT_IMAGE_DISPLAY_SETTINGS).some(([key, value]) => display.settings[key] !== value);
  return <details className="stu-review__adjust">
    <summary><Icon name="contrast" size={14} />화질 조정<Icon name="chevronDown" size={13} /></summary>
    <div>
      {[['brightness', '밝기', 50, 150], ['contrast', '대비', 50, 180], ['saturation', '채도', 0, 180]].map(([key, label, min, max]) => (
        <label key={key} className="stu-slider"><span>{label}</span>
          <input type="range" min={min} max={max} value={display.settings[key]} onChange={event => display.updateSetting(key, event.target.value)} />
          <span className="prof-mono">{display.settings[key]}%</span>
        </label>
      ))}
      <button type="button" className="stu-textbtn" onClick={display.resetSettings} disabled={!adjusted}>초기화</button>
    </div>
  </details>;
}

export function ReviewCellCard({ entry, onOpen }) {
  const { cell, review, index } = entry;
  return <button type="button" className="stu-review__cell-card" onClick={() => onOpen(entry)}>
    <AuthImage src={imageUrl.crop(cell.cropFilename)} alt={`세포 ${index + 1}`} className="stu-review__cell-photo" />
    <span className="stu-review__cell-caption"><strong className="prof-mono">Cell #{index + 1}</strong><CellBadge cell={cell} /></span>
    <span className="stu-review__cell-course">{review.title}</span>
    <span className="stu-review__cell-answers"><span>내 답 <strong>{answerLabel(cell.studentLabel) || '미응답'}</strong></span>
      <span>정답 <strong>{cell.correctLabel || '채점 대기'}</strong></span></span>
  </button>;
}
