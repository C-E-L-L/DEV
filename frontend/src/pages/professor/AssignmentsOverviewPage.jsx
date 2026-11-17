import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConsoleBase } from '../../components/console/ConsoleContext';
import Icon from '../../components/login/icons';
import { attentionItems, courseworkRows, courseworkTitle, deadlineInfo } from '../../utils/professorDashboard';
import { pageNumbers, paginate } from '../../utils/smearData';
import { CourseworkThumb, CourseworkTitleCell, SubmissionCell } from './CourseworkCells';
import { useProfessorData } from './ProfessorData';

const PAGE_SIZE = 8;
const ATTENTION_LIMIT = 5;
const TABS = [['ALL', '전체'], ['DRAFT', '임시 저장'], ['ACTIVE', '진행중'], ['CLOSED', '완료']];
const SORTS = [['NEWEST', '최신순'], ['DEADLINE', '마감 빠른순'], ['MISSING', '미제출 많은순']];
const PHASE = {
  DRAFT: { label: '작성 중 · 비공개', tone: '', path: 'edit', action: '이어서 준비' },
  ACTIVE: { label: '게시됨', tone: ' is-indigo', path: 'results', action: '응답·채점 결과' },
  CLOSED: { label: '마감됨', tone: '', path: 'results', action: '응답·채점 결과' },
};
const STATS = [
  { key: 'drafts', label: '임시 저장', note: '학생에게 보이지 않음', to: 'drafts', tone: '' },
  { key: 'active', label: '진행중', note: '응답 받는 중', to: 'active', tone: ' is-indigo' },
  { key: 'completed', label: '완료', note: '마감됨', to: 'completed', tone: ' is-emerald' },
];
const longDate = value => new Date(value).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

/** One line of "확인이 필요한 과제": why, which coursework, and the one thing to do about it. */
function AttentionRow({ item, basePath }) {
  const { group } = item;
  const kinds = {
    DUE: {
      badge: '마감 임박', tone: ' is-amber', to: `${basePath}/students/progress?item=${group.id}`, action: '미제출 학생 보기',
      facts: <><span>마감 <span className="prof-mono">{longDate(item.deadline)}</span></span><strong className="is-urgent">미제출 {item.missing}명</strong></>,
    },
    UNCONFIRMED: {
      badge: '정답 미확정', tone: ' is-indigo', to: `${basePath}/assignments/${group.id}/results`, action: '정답 확정하기',
      facts: <><span>게시됨</span><span>정답 확정 <span className="prof-mono">{group.labeledCount}/{group.cropCount}</span></span></>,
    },
    READY: {
      badge: '게시 전', tone: '', to: `${basePath}/assignments/${group.id}/edit`, action: '검토하고 게시',
      facts: <><span>임시 저장</span><span><span className="prof-mono">{group.cropCount}</span>문항 준비 완료</span></>,
    },
  };
  const kind = kinds[item.type];
  return (
    <li className="prof-attention__row">
      <span className={`prof-badge${kind.tone}`}>{kind.badge}</span>
      <CourseworkThumb group={group} />
      <span className="prof-attention__text">
        <strong>{courseworkTitle(group)}</strong>
        <span className="prof-attention__facts">{kind.facts}</span>
      </span>
      <Link to={kind.to} className="prof-btn prof-btn--sm">{kind.action}</Link>
    </li>
  );
}

/** Every coursework in one place: counts, what needs attention, and the full list. */
export default function AssignmentsOverviewPage() {
  const basePath = useConsoleBase();
  const { groups, loading, progress, progressByTask, counts } = useProfessorData();
  const [phase, setPhase] = useState('ALL');
  const [kind, setKind] = useState('ALL');
  const [sort, setSort] = useState('NEWEST');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const now = new Date();

  const attention = useMemo(() => attentionItems(groups, progressByTask, progress.students), [groups, progressByTask, progress.students]);
  const tabCounts = useMemo(() => Object.fromEntries(TABS.map(([key]) =>
    [key, courseworkRows(groups, progressByTask, progress.students, { phase: key, kind, query }).length])), [groups, progressByTask, progress.students, kind, query]);
  const rows = useMemo(() => courseworkRows(groups, progressByTask, progress.students, { phase, kind, query, sort }),
    [groups, progressByTask, progress.students, phase, kind, query, sort]);
  const paged = paginate(rows, page, PAGE_SIZE);
  useEffect(() => { setPage(1); }, [phase, kind, query, sort]);

  return (
    <>
      <div className="prof-page-head">
        <div>
          <h1>과제</h1>
          <p>준비 중인 과제부터 마감된 과제까지 한곳에서 확인합니다.</p>
        </div>
        <Link to={`${basePath}/assignments/new`} className="prof-btn prof-btn--primary"><Icon name="plusCircle" size={16} />과제 만들기</Link>
      </div>

      <ul className="prof-stats">
        {STATS.map(stat => (
          <li key={stat.key}>
            <Link to={`${basePath}/assignments/${stat.to}`} className={`prof-stat${stat.tone}`}>
              <span className="prof-stat__label">{stat.label}<span className="prof-stat__dot" aria-hidden="true" /></span>
              <span className="prof-stat__value"><strong className="prof-mono">{loading ? '–' : counts[stat.key]}</strong>{stat.note}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="prof-card" aria-labelledby="overview-attention">
        <header className="prof-card__head">
          <h2 id="overview-attention">확인이 필요한 과제{attention.length > 0 && <span className="prof-badge is-amber prof-mono">{attention.length}건</span>}</h2>
          <span className="prof-muted">마감 임박 · 정답 미확정 · 게시 전</span>
        </header>
        {loading ? <p role="status" className="prof-empty prof-empty--compact">과제를 불러오는 중…</p>
          : !attention.length ? <p className="prof-empty prof-empty--compact">지금 확인할 과제가 없습니다.</p>
            : (
              <>
                <ul className="prof-attention">{attention.slice(0, ATTENTION_LIMIT).map(item => <AttentionRow key={`${item.type}-${item.group.id}`} item={item} basePath={basePath} />)}</ul>
                {attention.length > ATTENTION_LIMIT && <p className="prof-attention__more prof-muted">외 {attention.length - ATTENTION_LIMIT}건은 아래 목록에서 확인할 수 있습니다.</p>}
              </>
            )}
      </section>

      <section className="prof-card" aria-label="과제 목록">
        <div className="prof-overview__tabs" role="group" aria-label="과제 상태">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={phase === key} onClick={() => setPhase(key)}>
              {label}<span className="prof-mono">{tabCounts[key]}</span>
            </button>
          ))}
        </div>
        <div className="prof-overview__filters">
          <label className="prof-data__search">
            <Icon name="search" size={15} />
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="과제 제목 검색" aria-label="과제 제목 검색" />
          </label>
          <label className="prof-select">종류
            <select value={kind} onChange={event => setKind(event.target.value)}>
              <option value="ALL">전체</option><option value="DIAGNOSTIC">진단평가</option><option value="PRACTICE">분류 실습</option>
            </select>
          </label>
          <label className="prof-select">정렬
            <select value={sort} onChange={event => setSort(event.target.value)}>
              {SORTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        </div>

        {loading ? <p role="status" className="prof-empty">과제를 불러오는 중…</p> : !paged.total ? (
          <div className="prof-empty">
            <p>{groups.length ? '조건에 맞는 과제가 없습니다.' : '아직 만든 과제가 없습니다.'}</p>
            {!groups.length && <Link to={`${basePath}/assignments/new`} className="prof-btn prof-btn--primary"><Icon name="plusCircle" size={15} />과제 만들기</Link>}
          </div>
        ) : (
          <div className="prof-table-wrap">
            <table className="prof-table prof-table--stack prof-overview__table">
              <thead><tr>
                <th scope="col">과제</th><th scope="col">제출 현황</th><th scope="col">마감</th>
                <th scope="col">정답 확정</th><th scope="col">상태</th><th scope="col" className="is-right"><span className="prof-sr">열기</span></th>
              </tr></thead>
              <tbody>
                {paged.items.map(({ group, phase: rowPhase, deadline }) => {
                  const info = PHASE[rowPhase];
                  const due = deadlineInfo(deadline, now);
                  const to = `${basePath}/assignments/${group.id}/${info.path}`;
                  const complete = group.cropCount > 0 && group.labeledCount >= group.cropCount;
                  return (
                    <tr key={group.id}>
                      <td className="prof-table__title"><CourseworkTitleCell group={group} to={to} title={courseworkTitle(group)} /></td>
                      <td>{rowPhase === 'DRAFT' ? <span className="prof-muted">게시 전</span> : <SubmissionCell group={group} />}</td>
                      <td className="prof-table__due">
                        <strong className={`is-${due.tone}`}>{due.label}</strong>
                        {due.dateText && <span className="prof-mono">{due.dateText}</span>}
                      </td>
                      <td><span className={`prof-mono prof-overview__labels${complete ? '' : ' is-pending'}`}>{group.labeledCount}/{group.cropCount}</span></td>
                      <td><span className={`prof-badge${info.tone}`}>{info.label}</span></td>
                      <td className="is-right"><Link to={to} className="prof-link">{info.action} <Icon name="arrowRight" size={14} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {paged.total > 0 && (
          <nav className="prof-pager prof-pager--inline" aria-label="과제 페이지">
            <span className="prof-muted">총 <strong className="prof-mono">{paged.total}</strong>개 중 <strong className="prof-mono">{paged.from}–{paged.to}</strong> 표시</span>
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
        )}
      </section>
    </>
  );
}
