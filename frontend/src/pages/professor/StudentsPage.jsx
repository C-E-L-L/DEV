import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { professorApi } from '../../api/professor';
import { useConsoleBase } from '../../components/console/ConsoleContext';
import Icon from '../../components/login/icons';
import {
  buildGradebook, cellState, classRates, filterCounts, filterRows, gradebookCsv, resultKey, sections, sortRows, visibleItems,
} from '../../utils/gradebook';
import { pageNumbers, paginate } from '../../utils/smearData';
import { useProfessorData } from './ProfessorData';
import useGradebook from './useGradebook';
import './students.css';

const PAGE_SIZE = 20;
const FILTERS = [['ALL', '전체'], ['OPEN_MISSING', '미제출 있음'], ['MISSED', '마감 후 미제출'], ['UNREGISTERED', '미가입']];
const FILTER_HELP = {
  OPEN_MISSING: '마감 전 과제 중 아직 최종 제출하지 않은 과제가 있는 학생',
  MISSED: '마감된 과제를 최종 제출하지 않은 학생',
  UNREGISTERED: '명부에는 있지만 회원가입하지 않은 학생',
};
const RANGES = [['RECENT', '최근 과제 6개'], ['OPEN', '마감 전 과제만'], ['ALL', '전체 과제']];
const SORTS = [['ID', '학번순'], ['NAME', '이름순'], ['RATE', '정답률 낮은순'], ['MISSING', '미제출 많은순']];
const shortDate = value => {
  const date = new Date(value);
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** One gradebook cell; it links to the student's result for that coursework. */
function GradeCell({ state, to }) {
  const content = {
    SCORED: <span className="prof-mono">{state.rate}%</span>,
    WAITING: <>제출 <span className="prof-gb__wait">대기</span></>,
    ANSWERING: <span className="prof-muted">응답 <span className="prof-mono">{state.answered}</span></span>,
    NOT_STARTED: <span className="prof-gb__none">–</span>,
    MISSED: <span className="prof-gb__missed">미제출</span>,
  }[state.kind];
  const title = {
    SCORED: `정답 ${state.correct}/${state.graded}`, WAITING: `정답 확정 전 ${state.pending}문항`,
    ANSWERING: `응답 ${state.answered}문항 · 아직 최종 제출 전`, NOT_STARTED: '시작 전', MISSED: state.answered ? `마감 후 미제출 · 응답 ${state.answered}문항` : '마감 후 미제출',
  }[state.kind];
  return <Link to={to} className="prof-gb__cell" title={title}>{content}</Link>;
}

/** Class-wide accuracy per cell class and the confusion matrix; loaded only when opened. */
function ClassAccuracy() {
  const { species } = useProfessorData();
  const active = useMemo(() => species.filter(item => item.active !== false), [species]);
  const [open, setOpen] = useState(false);
  const [speciesId, setSpeciesId] = useState('');
  const [state, setState] = useState({ loading: false, data: null, error: false });
  const selected = speciesId || active.find(item => item.code === 'DOG')?.id || active[0]?.id || '';

  useEffect(() => {
    if (!open || !selected) return undefined;
    let cancelled = false;
    setState({ loading: true, data: null, error: false });
    professorApi.calibration({ speciesId: selected, source: 'ALL' })
      .then(({ data }) => { if (!cancelled) setState({ loading: false, data, error: false }); })
      .catch(error => { if (!cancelled && !axios.isCancel(error)) setState({ loading: false, data: null, error: true }); });
    return () => { cancelled = true; };
  }, [open, selected]);

  const labels = state.data?.labels || [];
  const total = state.data?.studentMatrices?.find(student => student.studentId === 'ALL');
  const rates = classRates(total?.confusionMatrix, labels);
  const answers = rates.reduce((sum, row) => sum + row.total, 0);

  return (
    <section className="prof-card prof-gb-class">
      <button type="button" className="prof-gb-class__toggle" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <span>세포 종류별 정확도 <span className="prof-muted">(반 전체)</span></span>
        <span className="prof-muted">{open ? '접기' : '펼치기'}<Icon name="chevronDown" size={15} className={`prof-nav__chevron${open ? ' is-open' : ''}`} /></span>
      </button>
      {open && (
        <div className="prof-gb-class__body">
          <div className="prof-gb-class__head">
            <label className="prof-select">동물 종
              <select value={selected} onChange={event => setSpeciesId(Number(event.target.value))}>
                {active.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            {answers > 0 && <span className="prof-muted">최종 제출·정답 확정된 응답 <span className="prof-mono">{answers.toLocaleString()}</span>개 기준</span>}
          </div>
          {state.loading ? <p role="status" className="prof-empty prof-empty--compact">불러오는 중…</p>
            : state.error ? <p role="alert" className="prof-alert">정확도를 불러오지 못했습니다.</p>
              : !answers ? <p className="prof-empty prof-empty--compact">채점된 응답이 아직 없습니다.</p>
                : (
                  <div className="prof-gb-class__grid">
                    <ClassBars rates={rates} />
                    <ConfusionTable matrix={total.confusionMatrix} labels={labels} />
                  </div>
                )}
        </div>
      )}
    </section>
  );
}

export function ClassBars({ rates }) {
  return (
    <ul className="prof-gb-bars">
      {rates.map(row => (
        <li key={row.label}>
          <span className="prof-gb-bars__top">
            <span>{row.label}</span>
            <span className={`prof-mono${row.rate != null && row.rate < 70 ? ' is-low' : ''}`}>{row.rate == null ? '–' : `${row.rate}%`} <small>({row.correct}/{row.total})</small></span>
          </span>
          <span className="prof-bar"><span className={row.rate != null && row.rate < 70 ? 'is-warn' : ''} style={{ width: `${row.rate || 0}%` }} /></span>
        </li>
      ))}
    </ul>
  );
}

export function ConfusionTable({ matrix, labels }) {
  const max = Math.max(1, ...labels.flatMap(from => labels.filter(to => to !== from).map(to => matrix?.[from]?.[to] || 0)));
  return (
    <div className="prof-table-wrap">
      <table className="prof-gb-matrix">
        <caption className="prof-muted">세로: 정답 · 가로: 학생 답</caption>
        <thead><tr><th scope="col"><span className="prof-sr">정답</span></th>{labels.map(label => <th key={label} scope="col" title={label}>{label.slice(0, 5)}</th>)}</tr></thead>
        <tbody>
          {labels.map(from => (
            <tr key={from}>
              <th scope="row">{from}</th>
              {labels.map(to => {
                const count = matrix?.[from]?.[to] || 0;
                const hot = from !== to && count > 0 && count >= max * 0.5;
                return <td key={to} className={`prof-mono${from === to ? ' is-hit' : ''}${hot ? ' is-hot' : ''}`}>{count}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Students x published coursework, with submission state and score in every cell. */
export default function StudentsPage() {
  const basePath = useConsoleBase();
  const gradebook = useGradebook();
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('');
  const [range, setRange] = useState('RECENT');
  const [sort, setSort] = useState('ID');
  const [page, setPage] = useState(1);
  const now = Date.now();

  const { items, rows, byKey } = useMemo(() => buildGradebook(gradebook.data, now), [gradebook.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const columns = visibleItems(items, range, now);
  const counts = filterCounts(rows, { query, section });
  const shown = sortRows(filterRows(rows, { filter, query, section }), sort);
  const paged = paginate(shown, page, PAGE_SIZE);
  const sectionList = sections(rows);
  useEffect(() => { setPage(1); }, [filter, query, section, sort]);

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    download(gradebookCsv(shown, items, byKey, now), `cell_gradebook_${stamp}.csv`);
  };

  return (
    <>
      <div className="prof-page-head">
        <div>
          <h1>학생</h1>
          <p>학생별로 과제 제출 여부와 정답률을 확인합니다. 학생 이름을 누르면 자세히 볼 수 있습니다.</p>
        </div>
        <div className="prof-actions">
          <button type="button" className="prof-btn" onClick={exportCsv} disabled={!shown.length} title="지금 걸러진 학생과 게시된 모든 과제를 CSV로 받습니다.">
            <Icon name="download" size={16} />CSV 내보내기
          </button>
          <Link to={`${basePath}/students/register`} className="prof-btn prof-btn--primary"><Icon name="userPlus" size={16} />학생 등록</Link>
        </div>
      </div>

      <div className="prof-gb-tools">
        <div className="prof-tabs" role="group" aria-label="학생 필터">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} title={FILTER_HELP[key]}>
              {label} <span className="prof-mono">{counts[key]}</span>
            </button>
          ))}
        </div>
        <label className="prof-data__search">
          <Icon name="search" size={15} />
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="이름 또는 학번 검색" aria-label="이름 또는 학번 검색" />
        </label>
        {sectionList.length > 0 && (
          <label className="prof-select"><span className="prof-sr">분반</span>
            <select value={section} onChange={event => setSection(event.target.value)}>
              <option value="">전체 분반</option>
              {sectionList.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
        <label className="prof-select"><span className="prof-sr">과제 범위</span>
          <select value={range} onChange={event => setRange(event.target.value)}>
            {RANGES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="prof-select"><span className="prof-sr">정렬</span>
          <select value={sort} onChange={event => setSort(event.target.value)}>
            {SORTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
      </div>
      {filter !== 'ALL' && <p className="prof-muted prof-gb-help">{FILTER_HELP[filter]}</p>}

      <section className="prof-card" aria-label="성적부">
        {gradebook.loading && !gradebook.data ? <p role="status" className="prof-empty">학생 성적을 불러오는 중…</p>
          : gradebook.error ? <div className="prof-card__body"><div role="alert" className="prof-alert"><span>{gradebook.error}</span><button type="button" className="prof-btn prof-btn--sm" onClick={gradebook.reload}>다시 불러오기</button></div></div>
            : !rows.length ? (
              <div className="prof-empty">
                <p>등록된 학생이 없습니다.</p>
                <Link to={`${basePath}/students/register`} className="prof-btn prof-btn--primary"><Icon name="userPlus" size={15} />학생 등록</Link>
              </div>
            ) : !shown.length ? <p className="prof-empty">조건에 맞는 학생이 없습니다.</p> : (
              <>
                <div className="prof-gb-wrap">
                  <table className="prof-gb">
                    <thead>
                      <tr>
                        <th scope="col" className="prof-gb__student">학생 <span className="prof-muted">({shown.length}명)</span></th>
                        {columns.map(item => (
                          <th key={item.id} scope="col" className="prof-gb__item">
                            <Link to={`${basePath}/assignments/${item.id}/results`} title={item.title}>{item.title}</Link>
                            <small>{item.kind === 'DIAGNOSTIC' ? '진단평가' : '분류 실습'} · {item.deadlineAt ? `마감 ${shortDate(item.deadlineAt)}` : '마감 없음'}</small>
                          </th>
                        ))}
                        {!columns.length && <th scope="col" className="prof-gb__item"><small>{items.length ? '이 범위에 해당하는 과제가 없습니다.' : '게시된 과제가 없습니다.'}</small></th>}
                        <th scope="col" className="prof-gb__total" title="게시된 과제 전체 기준">제출</th>
                        <th scope="col" className="prof-gb__total prof-gb__rate" title="최종 제출하고 정답이 확정된 문항 기준">정답률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.items.map(row => {
                        const detail = `${basePath}/students/${encodeURIComponent(row.studentId)}`;
                        return (
                          <tr key={row.studentId}>
                            <th scope="row" className="prof-gb__student">
                              <Link to={detail} className="prof-gb__name">{row.name || row.studentId}</Link>
                              {!row.registered && <span className="prof-badge">미가입</span>}
                              {(row.name && row.name !== row.studentId) || row.section ? <small>{row.name && row.name !== row.studentId && <span className="prof-mono">{row.studentId}</span>}{row.name && row.name !== row.studentId && row.section && ' · '}{row.section}</small> : null}
                            </th>
                            {columns.map(item => (
                              <td key={item.id}><GradeCell state={cellState(byKey.get(resultKey(row.studentId, item.id)), item, now)} to={`${detail}?item=${item.id}`} /></td>
                            ))}
                            {!columns.length && <td />}
                            <td className="prof-gb__total prof-mono">{row.summary.submitted}/{row.summary.total}</td>
                            <td className="prof-gb__total prof-gb__rate prof-mono"><strong>{row.summary.rate == null ? '–' : `${row.summary.rate}%`}</strong></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="prof-gb-legend prof-muted">
                  <span><span className="prof-mono">85%</span> 채점 완료</span>
                  <span>제출 <span className="prof-gb__wait">대기</span> 정답 확정 전</span>
                  <span>응답 <span className="prof-mono">n</span> 최종 제출 전</span>
                  <span>– 시작 전</span>
                  <span><span className="prof-gb__missed">미제출</span> 마감 후 미제출</span>
                </p>
                <nav className="prof-pager prof-pager--inline" aria-label="학생 페이지">
                  <span className="prof-muted">총 <strong className="prof-mono">{paged.total}</strong>명 중 <strong className="prof-mono">{paged.from}–{paged.to}</strong></span>
                  {paged.pages > 1 && (
                    <div className="prof-pager__pages">
                      <button type="button" disabled={paged.page === 1} onClick={() => setPage(paged.page - 1)} aria-label="이전 페이지"><Icon name="chevronLeft" size={16} /></button>
                      {pageNumbers(paged.page, paged.pages).map((item, index) => (item === '…'
                        ? <span key={`gap-${index}`} className="prof-mono">…</span>
                        : <button key={item} type="button" className="prof-mono" aria-current={item === paged.page ? 'page' : undefined} onClick={() => setPage(item)}>{item}</button>))}
                      <button type="button" disabled={paged.page === paged.pages} onClick={() => setPage(paged.page + 1)} aria-label="다음 페이지"><Icon name="chevronRight" size={16} /></button>
                    </div>
                  )}
                </nav>
              </>
            )}
      </section>

      <ClassAccuracy />
    </>
  );
}
