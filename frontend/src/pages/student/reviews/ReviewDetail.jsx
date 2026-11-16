import { useMemo, useState } from 'react';
import Icon from '../../../components/login/icons';
import AuthImage from '../../../components/AuthImage';
import { useImageDisplaySettings } from '../../../components/ImageDisplayControls';
import { imageUrl } from '../../../constants';
import { answerLabel } from '../../../utils/cellClasses';
import { cellStatus, matchesCellFilter, reviewEntries, reviewKey, summarizeReviewCells } from '../../../utils/studentReview';
import SmearViewer from '../SmearViewer';
import { CellBadge, ReviewImageControls, SmearThumb, SpeciesTag } from './ReviewParts';

export default function ReviewDetail({ review, selectedIndex, filter, onFilter, onSelect, onBack, backLabel }) {
  const entries = useMemo(() => reviewEntries([review]), [review]);
  const filters = [['correct', '정답'], ['wrong', '오답'], ['unknown', '모르겠어요'], ['pending', '채점 대기']];
  const activeFilter = filters.some(([key]) => key === filter) ? filter
    : filters.find(([key]) => entries.some(({ cell }) => matchesCellFilter(cell, key)))?.[0] || 'correct';
  const visible = entries.filter(({ cell }) => matchesCellFilter(cell, activeFilter));
  const selected = visible.find(entry => entry.index === selectedIndex) || visible[0];
  const position = selected ? visible.indexOf(selected) : -1;
  const diagnostic = review.scopeType === 'DIAGNOSTIC';
  const [showSmear, setShowSmear] = useState(false);
  const display = useImageDisplaySettings(selected?.cell.originalSmearFilename || reviewKey(review));
  const summary = summarizeReviewCells(entries);
  const groups = [...entries.reduce((map, entry) => {
    const key = entry.cell.originalSmearFilename || `task-${entry.cell.taskId}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
    return map;
  }, new Map()).values()];
  const activeSmear = selected?.cell.originalSmearFilename;
  const overlayCells = visible.filter(({ cell }) => cell.originalSmearFilename === activeSmear).map(entry => ({
    id: entry.cell.cropId, index: entry.index, number: entry.index + 1, bbox: entry.cell.bbox,
    state: selected?.index === entry.index ? 'current' : cellStatus(entry.cell),
    label: `${answerLabel(entry.cell.studentLabel)} · 정답 ${entry.cell.correctLabel || '채점 대기'}`,
  }));

  return <div className="stu-review__sections">
    <div className="stu-review__detail-heading">
      <button type="button" className="prof-btn" onClick={onBack}><Icon name="arrowLeft" size={15} />{backLabel}</button>
      <div className="stu-review__detail-title"><span className="prof-eyebrow">{diagnostic ? '진단평가' : '과제'} 결과</span><h2>{review.title}</h2>
        <p className="prof-muted">응답 {review.answeredCells} / {review.totalCells}문항{review.deadlineAt ? ` · 마감 ${new Date(review.deadlineAt).toLocaleString('ko-KR')}` : ''}</p></div>
      <div className="stu-review__accuracy" title={`채점된 응답 ${summary.graded}개 기준`}><span>정답률</span><strong className="prof-mono">{summary.accuracy == null ? '—' : `${summary.accuracy}%`}</strong></div>
    </div>

    <div className="stu-review__detail-filters" role="group" aria-label="이 과제의 세포 필터">
      <div className="prof-tabs">{filters.map(([key, label]) => <button key={key} type="button" aria-pressed={activeFilter === key} onClick={() => onFilter(key)}>
        {label} <span className="prof-mono">{entries.filter(({ cell }) => matchesCellFilter(cell, key)).length}</span>
      </button>)}</div><span className="prof-muted">모르겠어요는 채점 후 오답에 포함됩니다.</span>
    </div>

    <div className="stu-review__detail-layout">
      <aside className="prof-card stu-review__selection" aria-label="도말과 결과 세포 목록">
        {!diagnostic && <>
          <header className="prof-card__head"><h2><Icon name="layers" size={16} />도말 목록</h2><span className="prof-mono prof-muted">{groups.length}개</span></header>
          <ul className="stu-review__smear-list">{groups.map((group, groupIndex) => {
            const filtered = group.filter(({ cell }) => matchesCellFilter(cell, activeFilter));
            const active = group.some(entry => entry.index === selected?.index);
            return <li key={group[0].cell.originalSmearFilename || group[0].cell.taskId}>
              <button type="button" aria-pressed={active} disabled={!filtered.length} onClick={() => onSelect(filtered[0].index)}>
                <SmearThumb filename={group[0].cell.originalSmearFilename} />
                <strong>도말 {groupIndex + 1}</strong><span className="prof-mono">{filtered.length} / {group.length}개</span>
              </button>
            </li>;
          })}</ul>
        </>}
        <header className="prof-card__head"><h2>세포 목록</h2><span className="prof-mono prof-muted">{visible.length}개</span></header>
        {!visible.length ? <p className="prof-empty prof-empty--compact">해당하는 세포가 없습니다.</p> : (
          <ul className="stu-review__thumbnails">{visible.map(entry => <li key={entry.key}>
            <button type="button" className={`is-${cellStatus(entry.cell)}`} aria-pressed={entry.index === selected?.index}
              title={`Cell #${entry.index + 1} · 내 답 ${answerLabel(entry.cell.studentLabel)} · 정답 ${entry.cell.correctLabel || '채점 대기'}`}
              onClick={() => onSelect(entry.index)}>
              <AuthImage src={imageUrl.crop(entry.cell.cropFilename)} alt={`세포 ${entry.index + 1}`} />
              <span className="prof-mono">#{entry.index + 1}</span><span className="prof-sr">{cellStatus(entry.cell) === 'correct' ? '정답' : cellStatus(entry.cell) === 'wrong' ? '오답' : '채점 대기'}</span>
            </button>
          </li>)}</ul>
        )}
      </aside>

        {!selected ? <section className="prof-card prof-empty stu-review__selected-card"><p>선택한 조건에 맞는 세포가 없습니다.</p><span className="prof-muted">다른 결과 탭을 선택해주세요.</span></section> : <>
          <section className="prof-card stu-review__selected-card">
            <header className="prof-card__head"><h2><Icon name="microscope" size={17} />선택한 세포</h2><CellBadge cell={selected.cell} /></header>
            <div className="prof-card__body stu-review__focus">
              <figure><AuthImage key={selected.cell.cropId} src={imageUrl.crop(selected.cell.cropFilename)} alt={`세포 ${selected.index + 1}`} className="stu-review__focus-photo" style={{ filter: display.filter }}
                loadingText="세포 이미지를 불러오는 중…" errorText="세포 이미지를 불러오지 못했습니다." />
                <figcaption><strong className="prof-mono">Cell #{selected.index + 1}</strong><SpeciesTag cell={selected.cell} /></figcaption></figure>
              <div className="stu-review__comparison">
                <div className="stu-review__answer"><span>내가 고른 답</span><strong>{answerLabel(selected.cell.studentLabel) || '미응답'}</strong></div>
                <div className={`stu-review__answer is-${cellStatus(selected.cell)}`}><span>정답</span><strong>{selected.cell.correctLabel || '채점 대기'}</strong></div>
                {selected.cell.studentLabel === 'UNKNOWN' && <p className="prof-muted">이 세포에는 ‘모르겠어요’로 응답했습니다.</p>}
                {cellStatus(selected.cell) === 'pending' && <p className="prof-muted">아직 정답이 확정되지 않아 비교할 수 없습니다.</p>}
                <ReviewImageControls display={display} />
              </div>
            </div>
            <footer className="prof-card__foot stu-review__cell-navigation">
              <button type="button" className="prof-btn" disabled={position <= 0} onClick={() => onSelect(visible[position - 1].index)}><Icon name="arrowLeft" size={14} />이전 세포</button>
              <span className="prof-muted">선택한 범위 <strong className="prof-mono">{position + 1} / {visible.length}</strong></span>
              <button type="button" className="prof-btn" disabled={position >= visible.length - 1} onClick={() => onSelect(visible[position + 1].index)}>다음 세포<Icon name="arrowRight" size={14} /></button>
            </footer>
          </section>
          {!diagnostic && activeSmear && <details className="prof-card stu-review__original" open={showSmear} onToggle={event => setShowSmear(event.currentTarget.open)}>
            <summary><span><Icon name="layers" size={16} />원본 도말에서 위치 보기</span><Icon name="chevronDown" size={15} /></summary>
            {showSmear && <div className="stu-review__smear-viewer"><SmearViewer filename={activeSmear} filter={display.filter} cells={overlayCells} onSelect={onSelect} /></div>}
            {showSmear && <p className="stu-review__explanation">현재 필터에 맞는 세포만 표시합니다. 확대 후 드래그하면 도말을 이동할 수 있습니다.</p>}
          </details>}
        </>}
    </div>
  </div>;
}
