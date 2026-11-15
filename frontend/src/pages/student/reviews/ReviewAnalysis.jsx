import { Fragment, useMemo } from 'react';
import Icon from '../../../components/login/icons';
import {
  analyzeReviewCells, matchesAnalysisFocus, reviewKey, reviewSpecies, SMALL_SAMPLE_SIZE, speciesKey,
} from '../../../utils/studentReview';
import { ReviewCellCard, ReviewSummary } from './ReviewParts';

export default function ReviewAnalysis({ entries, view, onChange, onOpen }) {
  const species = useMemo(() => reviewSpecies(entries), [entries]);
  const selectedSpecies = species.find(item => item.code === view.species) || species[0];
  const speciesEntries = entries.filter(({ cell }) => speciesKey(cell) === selectedSpecies?.code);
  const courses = [...new Map(speciesEntries.map(({ review }) => [reviewKey(review), review])).values()];
  const selectedCourse = courses.some(review => reviewKey(review) === view.course) ? view.course : 'all';
  const scoped = speciesEntries.filter(({ review }) => selectedCourse === 'all' || reviewKey(review) === selectedCourse);
  const analysis = analyzeReviewCells(scoped);
  const expandedClass = analysis.classes.some(row => row.key === view.expandedClass) ? view.expandedClass : null;
  const examples = scoped.filter(entry => matchesAnalysisFocus(entry, view.focus));
  const focus = (next, label) => onChange({ ...view, focus: next, focusLabel: label, expandedClass: null, limit: 12 });
  const changeScope = patch => onChange({ ...view, ...patch, focus: null, focusLabel: '', expandedClass: null, limit: 12 });

  if (!entries.length) return <div className="prof-card prof-empty">결과가 공개되면 세포 유형별 분석을 확인할 수 있습니다.</div>;

  return <div className="stu-review__sections">
    <section className="prof-card">
      <header className="prof-card__head"><h2><Icon name="chart" size={17} />세포별 분석</h2><span className="prof-muted">공개된 내 응답 기준</span></header>
      <div className="prof-card__body">
        <div className="stu-review__filters">
          <label>동물 종<select value={selectedSpecies?.code || ''} onChange={event => changeScope({ species: event.target.value, course: 'all' })}>
            {species.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select></label>
          <label>과제 범위<select value={selectedCourse} onChange={event => changeScope({ course: event.target.value })}>
            <option value="all">선택한 종의 전체 결과</option>
            {courses.map(review => <option key={reviewKey(review)} value={reviewKey(review)}>{review.title}</option>)}
          </select></label>
        </div>
        <ReviewSummary summary={analysis.summary} />
        <p className="prof-muted">채점된 응답 {analysis.summary.graded}개 기준입니다. 채점 대기는 정답률에서 제외하며, ‘모르겠어요’는 채점 후 오답에 포함됩니다.</p>
      </div>
    </section>

    <section className="prof-card">
      <header className="prof-card__head"><h2><Icon name="microscope" size={17} />어떤 세포에서 많이 틀렸나요?</h2></header>
      <div className="stu-review__explanation">정답 유형별로 비교합니다. 예를 들어 Band 행은 <strong>정답이 Band인 문항</strong>의 결과이며, 오답 수가 많은 순입니다.</div>
      {!analysis.classes.length ? <p className="prof-empty">아직 분석할 수 있는 채점 결과가 없습니다.</p> : (
        <div className="prof-table-wrap"><table className="prof-table prof-table--stack stu-review__table">
          <thead><tr><th scope="col">정답 유형</th><th scope="col">채점 문항</th><th scope="col">정답 / 오답</th><th scope="col">정답률</th><th scope="col"><span className="prof-sr">복습</span></th></tr></thead>
          <tbody>{analysis.classes.map((row, rowIndex) => {
            const expanded = expandedClass === row.key;
            const rowExamples = expanded ? scoped.filter(entry => matchesAnalysisFocus(entry, { kind: 'class', key: row.key })) : [];
            const panelId = `stu-class-details-${rowIndex}`;
            return <Fragment key={row.key}><tr className={expanded ? 'is-selected' : ''}>
            <td data-label="정답 유형"><strong>{row.label}</strong>{row.total < SMALL_SAMPLE_SIZE && <small className="stu-review__sample-note">표본 {row.total}문항</small>}</td>
            <td data-label="채점 문항" className="prof-mono">{row.total}개</td>
            <td data-label="정답 / 오답"><span className="stu-correct prof-mono">{row.correct}</span> / <span className="stu-wrong prof-mono">{row.wrong}</span>
              {row.unknown > 0 && <small className="stu-review__sample-note">모르겠어요 {row.unknown}개 포함</small>}</td>
            <td data-label="정답률"><div className="stu-review__rate"><strong className="prof-mono">{row.accuracy}%</strong><span className="prof-bar" aria-hidden="true"><span style={{ width: `${row.accuracy}%` }} /></span></div></td>
            <td><button type="button" className="prof-btn stu-review__small-btn" disabled={!row.wrong} aria-expanded={expanded} aria-controls={panelId}
              onClick={() => onChange({ ...view, expandedClass: expanded ? null : row.key, focus: null, focusLabel: '', limit: 12 })}>
              {expanded ? '접기' : row.wrong ? `오답 ${row.wrong}개 보기` : '오답 없음'}<Icon name="chevronDown" size={12} /></button></td>
          </tr>{expanded && <tr className="stu-review__inline-row"><td colSpan={5}>
            <div id={panelId} className="stu-review__inline-examples" role="region" aria-label={`${row.label} 유형의 오답`}>
              <p><strong>정답이 {row.label}인 문항의 오답</strong><span className="prof-muted">{rowExamples.length}개 · 사진을 누르면 해당 과제의 세포를 확인합니다.</span></p>
              <div className="stu-review__cell-grid">{rowExamples.slice(0, view.limit).map(entry => <ReviewCellCard key={entry.key} entry={entry} onOpen={onOpen} />)}</div>
              {rowExamples.length > view.limit && <button type="button" className="prof-btn stu-review__load-more" onClick={() => onChange({ ...view, limit: view.limit + 12 })}>더 보기 · 남은 세포 {rowExamples.length - view.limit}개</button>}
            </div>
          </td></tr>}</Fragment>;
          })}</tbody>
        </table></div>
      )}
      <footer className="prof-card__foot"><span className="prof-muted">문항 수를 함께 확인하세요. 5문항 미만은 표본 수를 표시하며, 누적 정답률만으로 실력이나 취약 유형을 단정하지 않습니다.</span></footer>
    </section>

    <section className="prof-card">
      <header className="prof-card__head"><h2><Icon name="layers" size={17} />자주 헷갈린 조합</h2><span className="prof-muted">내 답 → 정답</span></header>
      <div className="prof-card__body">
        {analysis.pairs.length ? <div className="stu-review__pairs">{analysis.pairs.slice(0, 5).map(pair => (
          <button key={pair.key} type="button" aria-pressed={view.focus?.key === pair.key}
            onClick={() => focus({ kind: 'pair', key: pair.key }, `내 답 ${pair.answer} → 정답 ${pair.correct}`)}>
            <span><small>내 답</small><strong>{pair.answer}</strong></span><Icon name="arrowRight" size={16} />
            <span><small>정답</small><strong>{pair.correct}</strong></span><span className="prof-nav__badge prof-mono">{pair.count}회</span>
          </button>
        ))}</div> : <p className="prof-muted">채점된 응답에서 다른 분류명으로 답한 오답 조합이 없습니다.</p>}
        <div className="stu-review__unknown"><span>채점된 오답 중 <strong>모르겠어요 {analysis.summary.gradedUnknown}개</strong></span></div>
      </div>
    </section>

    {!expandedClass && <section className="prof-card" aria-labelledby="stu-analysis-examples">
      <header className="prof-card__head"><h2 id="stu-analysis-examples"><Icon name="book" size={17} />분석한 세포 복습 <span className="prof-nav__badge prof-mono">{examples.length}</span></h2>
        {view.focus && <button type="button" className="prof-btn stu-review__small-btn" onClick={() => focus(null, '')}>전체 오답 보기</button>}</header>
      {view.focusLabel && <p className="stu-review__focus-label">{view.focusLabel}</p>}
      {!examples.length ? <p className="prof-empty">선택한 범위에서 복습할 오답이 없습니다.</p> : (
        <div className="prof-card__body"><div className="stu-review__cell-grid">
          {examples.slice(0, view.limit).map(entry => <ReviewCellCard key={entry.key} entry={entry} onOpen={onOpen} />)}
        </div>{examples.length > view.limit && <button type="button" className="prof-btn stu-review__load-more" onClick={() => onChange({ ...view, limit: view.limit + 12 })}>
          더 보기 · 남은 세포 {examples.length - view.limit}개</button>}</div>
      )}
    </section>}
  </div>;
}
