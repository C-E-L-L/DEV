import { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/login/icons';
import { submissionApi } from '../../../api';
import { matchesCellFilter, resolveReviewLink, reviewEntries, reviewKey, reviewSmears } from '../../../utils/studentReview';
import { useStudentData } from '../StudentData';
import ReviewAnalysis from './ReviewAnalysis';
import ReviewDetail from './ReviewDetail';
import { SmearThumb } from './ReviewParts';
import './studentReview.css';

export default function StudentResults({ initialReview, initialCropId, initialFocus, initialView }) {
  const [rawReviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState(initialView === 'wrong' ? 'analysis' : 'tasks');
  const [selection, setSelection] = useState(null);
  const [linkApplied, setLinkApplied] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [analysisView, setAnalysisView] = useState({ species: '', course: 'all', focus: null, focusLabel: '', expandedClass: null, limit: 12 });
  const studentData = useStudentData();
  const items = studentData?.items;
  const reviews = useMemo(() => {
    const titles = new Map((items || []).map(item => [
      `${item.diagnostic ? 'DIAGNOSTIC' : item.kind === 'assignment' ? 'ASSIGNMENT' : 'TASK'}-${item.id}`, item.title,
    ]));
    return rawReviews.map(review => ({ ...review, title: titles.get(reviewKey(review)) || review.title }));
  }, [rawReviews, items]);
  const entries = useMemo(() => reviewEntries(reviews), [reviews]);
  const selectedReview = reviews.find(review => reviewKey(review) === selection?.key);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    submissionApi.getMyReviews().then(({ data }) => { if (!cancelled) setReviews(data.reviews || []); })
      .catch(() => { if (!cancelled) setError('학습 결과를 불러오지 못했습니다.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [version]);

  useEffect(() => {
    const reload = () => { if (document.visibilityState === 'visible') setVersion(value => value + 1); };
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, []);

  useEffect(() => {
    if (loading || error || linkApplied) return;
    setLinkApplied(true);
    if (initialView === 'wrong') { setTab('analysis'); return; }
    setSelection(resolveReviewLink(reviews, { review: initialReview, cell: initialCropId, focus: initialFocus }));
  }, [loading, error, linkApplied, reviews, initialReview, initialCropId, initialFocus, initialView]);

  const openReview = (review, filter, index) => setSelection(resolveReviewLink([review], {
    review: reviewKey(review), cell: index != null ? review.cells[index]?.cropId : undefined,
    focus: filter === 'wrong' ? 'wrong' : undefined,
  }));
  const filtered = reviews.filter(review => (type === 'all' || (type === 'diagnostic' ? review.scopeType === 'DIAGNOSTIC' : review.scopeType !== 'DIAGNOSTIC'))
    && review.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  return <div className="stu-review">
    {loading ? <div className="prof-card prof-empty" role="status">학습 결과를 불러오는 중…</div>
      : error ? <div className="prof-alert" role="alert"><span>{error}</span><button type="button" className="prof-btn" onClick={() => setVersion(value => value + 1)}>다시 시도</button></div>
        : selectedReview ? <ReviewDetail key={selection.key} review={selectedReview} selectedIndex={selection.index} filter={selection.filter}
          onSelect={index => setSelection(current => ({ ...current, index }))}
          onFilter={filter => setSelection(current => ({ ...current, filter,
            index: selectedReview.cells[current.index] && matchesCellFilter(selectedReview.cells[current.index], filter) ? current.index
              : Math.max(0, selectedReview.cells.findIndex(cell => matchesCellFilter(cell, filter))),
          }))}
          onBack={() => setSelection(null)} backLabel={tab === 'analysis' ? '세포별 분석으로' : '과제 목록으로'} />
          : <>
            <div className="stu-review__toolbar"><div className="prof-tabs" role="group" aria-label="결과 보기 방식">
              <button type="button" aria-pressed={tab === 'tasks'} onClick={() => setTab('tasks')}>과제별</button>
              <button type="button" aria-pressed={tab === 'analysis'} onClick={() => setTab('analysis')}>세포별 분석</button>
            </div></div>
            {tab === 'analysis' ? <ReviewAnalysis entries={entries} view={analysisView} onChange={setAnalysisView}
              onOpen={entry => openReview(entry.review, 'wrong', entry.index)} /> : (
              <section className="prof-card">
                <header className="prof-card__head"><h2><Icon name="clipboard" size={17} />과제별 결과 <span className="prof-nav__badge prof-mono">{filtered.length}</span></h2></header>
                <div className="stu-review__filters stu-review__course-filters">
                  <label className="stu-review__search"><span className="prof-sr">과제명 검색</span><input type="search" placeholder="과제명으로 검색" value={search} onChange={event => setSearch(event.target.value)} /></label>
                  <div className="prof-tabs" role="group" aria-label="결과 유형">{[['all', '전체'], ['practice', '과제'], ['diagnostic', '진단평가']].map(([key, label]) => (
                    <button key={key} type="button" aria-pressed={type === key} onClick={() => setType(key)}>{label}</button>
                  ))}</div>
                </div>
                {!filtered.length ? <p className="prof-empty">{reviews.length ? '조건에 맞는 결과가 없습니다.' : '아직 공개된 학습 결과가 없습니다.'}</p> : (
                  <div className="prof-table-wrap"><table className="prof-table prof-table--stack stu-review__table">
                    <thead><tr><th scope="col">과제명</th><th scope="col">유형</th><th scope="col">정답 / 오답</th><th scope="col">채점 상태</th><th scope="col">정답률</th><th scope="col"><span className="prof-sr">결과 확인</span></th></tr></thead>
                    <tbody>{filtered.map(review => { const smears = review.scopeType === 'DIAGNOSTIC' ? [] : reviewSmears(review); return <tr key={reviewKey(review)}>
                      <td data-label="과제명" className="prof-table__title"><div className="stu-review__course">
                        <SmearThumb filename={smears[0]} className="is-course" />
                        <div><button type="button" className="stu-review__title-link" onClick={() => openReview(review)}>{review.title}</button>
                          <small className="stu-review__sample-note">응답 {review.answeredCells} / {review.totalCells}문항{smears.length > 1 ? ` · 도말 ${smears.length}장` : ''}</small></div>
                      </div></td>
                      <td data-label="유형"><span className="prof-badge">{review.scopeType === 'DIAGNOSTIC' ? '진단평가' : '과제'}</span></td>
                      <td data-label="정답 / 오답" className="prof-mono"><span className="stu-correct">{review.correct}</span> / <span className="stu-wrong">{review.wrong}</span></td>
                      <td data-label="채점 상태"><span className={`prof-badge ${review.pendingAnswers ? 'is-amber' : 'is-emerald'}`}>{review.pendingAnswers ? `채점 대기 ${review.pendingAnswers}` : '채점 완료'}</span></td>
                      <td data-label="정답률" className="prof-mono"><strong>{review.accuracy == null ? '—' : `${review.accuracy}%`}</strong></td>
                      <td><div className="stu-review__row-actions"><button type="button" className="prof-btn stu-review__small-btn" onClick={() => openReview(review)}>결과 보기</button>
                        {review.wrong > 0 && <button type="button" className="prof-btn stu-review__small-btn" onClick={() => openReview(review, 'wrong')}>오답 보기</button>}</div></td>
                    </tr>; })}</tbody>
                  </table></div>
                )}
                <footer className="prof-card__foot"><span className="prof-muted">공개된 결과만 표시합니다. 오답 보기는 해당 과제의 오답만 모아서 엽니다.</span></footer>
              </section>
            )}
          </>}
  </div>;
}
