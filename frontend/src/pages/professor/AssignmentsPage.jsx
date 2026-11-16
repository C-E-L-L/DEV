import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskApi } from '../../api';
import AuthImage from '../../components/AuthImage';
import Icon from '../../components/login/icons';
import { useConsoleBase } from '../../components/console/ConsoleContext';
import { imageUrl } from '../../constants';
import { isDiagnostic } from '../../utils/coursework';
import { courseworkDeadline, courseworkPhase, courseworkTitle, deadlineInfo, submissionSummary } from '../../utils/professorDashboard';
import { pageNumbers, paginate } from '../../utils/smearData';
import { useProfessorData } from './ProfessorData';
import './assignmentsList.css';

const PAGE_SIZE = 10;
const TYPES = [['all', '전체'], ['practice', '과제'], ['diagnostic', '진단평가']];
const errorMessage = error => error?.response?.data?.message || error.message || '요청을 처리하지 못했습니다. 다시 시도해주세요.';
const PAGES = {
  DRAFT: { title: '임시 저장된 과제', icon: 'edit', text: '학생에게 공개하기 전, 문항과 정답을 준비하는 과제입니다.', empty: '임시 저장된 과제가 없습니다.', note: '임시 저장된 과제는 학생에게 보이지 않습니다. 준비 화면에서 검토한 뒤 게시할 수 있습니다.' },
  ACTIVE: { title: '진행 중 과제', icon: 'clipboard', text: '게시된 과제의 제출 현황을 확인하고 마감일과 정답을 관리합니다.', empty: '진행 중인 과제가 없습니다.', note: '제출 현황은 학생의 최종 제출 기준입니다. 미제출 인원을 누르면 해당 과제의 학생별 진행 상황을 확인할 수 있습니다.' },
  CLOSED: { title: '완료된 과제', icon: 'checkCircle', text: '마감된 과제의 제출 기록과 응답·채점 결과를 확인합니다.', empty: '마감된 과제가 없습니다.', note: '완료는 마감일이 지난 과제를 뜻합니다. 정답 미확정 문항은 결과 화면에서 확정하고 다시 채점할 수 있습니다.' },
};

function localMinute(value = new Date()) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function CourseworkName({ group, to, disabled }) {
  const smears = group.tasks.filter(task => task.originalFilename);
  const diagnostic = isDiagnostic(group);
  const species = [...new Set(group.tasks.map(task => task.speciesName).filter(Boolean))].join(', ');
  return <div className="prof-assignment-list__name">
    <span className={`prof-assignment-list__thumb${diagnostic || !smears.length ? ' is-icon' : ''}`} aria-hidden="true">
      {diagnostic || !smears.length ? <Icon name={diagnostic ? 'layers' : 'droplet'} size={19} />
        : <AuthImage src={imageUrl.thumbnail(smears[0].originalFilename)} fallbackSrc={imageUrl.original(smears[0].originalFilename)} alt="" errorText="이미지 없음" />}
      {!diagnostic && smears.length > 1 && <span className="prof-assignment-list__more">+{smears.length - 1}</span>}
    </span>
    <div><Link to={to} aria-disabled={disabled || undefined} onClick={event => { if (disabled) event.preventDefault(); }}>{courseworkTitle(group)}</Link>
      <small>{species && `${species} · `}{!diagnostic && `도말 ${group.tasks.length}장 · `}{group.cropCount}문항{group.excludedCount > 0 && ` · 제외 ${group.excludedCount}`}</small>
    </div>
  </div>;
}

function LabelCell({ group, draft, now }) {
  const pending = Math.max(0, group.cropCount - group.labeledCount);
  const deadline = courseworkDeadline(group);
  const expired = deadline && new Date(deadline).getTime() <= now.getTime();
  // Publishing can allow unconfirmed labels for practice; diagnostics always require them.
  const requiresLabels = isDiagnostic(group) || group.tasks.some(task => task.requireLabels);
  const needsDeadline = group.tasks.some(task => task.resultsAfterDeadline) && !deadline;
  const label = draft
    ? !group.cropCount ? '문항 준비 필요' : expired ? '마감일 확인 필요' : needsDeadline ? '마감일 설정 필요' : pending && requiresLabels ? '정답 확정 필요' : '게시 검토 가능'
    : pending ? `채점 대기 ${pending}문항` : group.cropCount ? '정답 확정 완료' : '출제 문항 없음';
  const ready = group.cropCount > 0 && (draft ? !expired && !needsDeadline && (!requiresLabels || !pending) : !pending);
  return <div className="prof-assignment-list__labels"><span className={`prof-badge ${ready ? 'is-emerald' : 'is-amber'}`}>{label}</span>
    <small>정답 확정 <span className="prof-mono">{group.labeledCount} / {group.cropCount}</span>{draft && pending > 0 && !requiresLabels && <span> · 게시 후 확정 가능</span>}</small>
  </div>;
}

function SubmissionCell({ group, progress, item, basePath }) {
  const summary = submissionSummary(item, progress.students);
  if (!summary.total) return <span className="prof-muted">등록된 학생 없음</span>;
  const percent = Math.round(summary.submitted / summary.total * 100);
  return <div className="prof-assignment-list__submission">
    <strong className="prof-mono">{summary.submitted} / {summary.total}명 <span>{percent}%</span></strong>
    {summary.missing.length ? <Link to={`${basePath}/students/progress?item=${group.id}`}>미제출 {summary.missing.length}명</Link> : <small className="is-complete">전원 제출</small>}
  </div>;
}

function DeadlineCell({ deadline, now, draft }) {
  if (!deadline) return <span className="prof-muted">마감일 없음</span>;
  const date = new Date(deadline);
  const due = deadlineInfo(deadline, now);
  return <div className="prof-assignment-list__deadline" title={date.toLocaleString('ko-KR')}>
    <time dateTime={deadline}>{date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</time>
    <small className={due.tone === 'urgent' || (draft && due.tone === 'closed') ? 'is-urgent' : ''}>{date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} · {draft && due.tone === 'closed' ? '기한 지남' : due.label}</small>
  </div>;
}

function DeadlineEditor({ group, deadline, busy, onSave, onCancel }) {
  const [value, setValue] = useState(deadline ? localMinute(deadline) : '');
  const [error, setError] = useState('');
  const save = event => {
    event.preventDefault();
    if (!value || new Date(value).getTime() <= Date.now()) { setError('마감일은 현재 시각 이후로 설정해주세요.'); return; }
    setError(''); onSave(`${value}:00`);
  };
  return <form className="prof-assignment-list__deadline-form" onSubmit={save} aria-label={`${courseworkTitle(group)} 마감일 변경`}>
    <div><label htmlFor={`deadline-${group.id}`}>마감일 변경</label><p>마감 전인 과제만 변경할 수 있습니다.</p></div>
    <input id={`deadline-${group.id}`} type="datetime-local" aria-label="새 마감일" autoFocus required min={localMinute()} value={value} onChange={event => { setValue(event.target.value); setError(''); }} disabled={busy} />
    <div className="prof-actions"><button type="submit" className="prof-btn prof-btn--sm prof-btn--primary" disabled={busy || !value}>{busy ? '저장 중…' : '저장'}</button>
      {deadline && <button type="button" className="prof-btn prof-btn--sm" disabled={busy} onClick={() => onSave(null)}>마감일 해제</button>}
      <button type="button" className="prof-btn prof-btn--sm" disabled={busy} onClick={onCancel}>취소</button></div>
    {error && <p className="prof-assignment-list__field-error" role="alert">{error}</p>}
  </form>;
}

/** The three phase menus share the student's compact result-table layout. */
export default function AssignmentsPage({ phase }) {
  const basePath = useConsoleBase();
  const { groups, loading, error: dataError, progress, progressByTask, reload } = useProfessorData();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deadlineId, setDeadlineId] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const operation = useRef(false);
  const page = PAGES[phase];
  const draft = phase === 'DRAFT';
  const working = busyId !== null || refreshing;
  const phaseGroups = groups.filter(group => courseworkPhase(group, now) === phase);
  const filtered = phaseGroups.filter(group => (type === 'all' || (type === 'diagnostic') === isDiagnostic(group))
    && courseworkTitle(group).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a, b) => b.id - a.id);
  const paged = paginate(filtered, pageNumber, PAGE_SIZE);

  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer); }, []);
  const filter = (setter, value) => { setter(value); setPageNumber(1); setDeadlineId(null); };
  const refresh = async () => {
    if (operation.current) return;
    operation.current = true; setRefreshing(true); setNotice(''); setError('');
    try { await reload({ silent: true }); setNow(new Date()); } finally { operation.current = false; setRefreshing(false); }
  };
  const mutate = async (group, request, message) => {
    if (operation.current) return;
    operation.current = true; setBusyId(group.id); setError(''); setNotice('');
    try { await request(); setDeadlineId(null); setNotice(message); await reload({ silent: true }); setNow(new Date()); }
    catch (e) { setError(errorMessage(e)); }
    finally { operation.current = false; setBusyId(null); }
  };
  const remove = group => {
    if (operation.current) return;
    const warning = draft ? '준비한 도말과 라벨이 모두 삭제됩니다.' : '도말 이미지, 학생 제출 기록, 혼동행렬이 모두 삭제되며 되돌릴 수 없습니다.';
    if (!window.confirm(`과제 "${courseworkTitle(group)}"을(를) 삭제할까요?\n${warning}`)) return;
    mutate(group, () => group.assignmentId ? taskApi.deleteAssignment(group.assignmentId) : taskApi.delete(group.id), '과제를 삭제했습니다.');
  };
  const saveDeadline = (group, value) => mutate(group,
    () => group.assignmentId ? taskApi.updateAssignmentDeadline(group.assignmentId, value) : taskApi.updateDeadline(group.id, value),
    value ? '마감일을 변경했습니다.' : '마감일을 해제했습니다.');

  return <>
    <div className="prof-page-head"><div><h1>{page.title}</h1><p>{page.text}</p></div><Link className="prof-btn prof-btn--primary" to={`${basePath}/assignments/new`}><Icon name="plusCircle" size={16} />과제 만들기</Link></div>
    {error && <div className="prof-alert" role="alert">{error}</div>}
    {notice && <div className="prof-note is-success" role="status"><Icon name="checkCircle" size={16} />{notice}</div>}
    <section className="prof-card prof-assignment-list" aria-label={page.title} aria-busy={loading || refreshing}>
      <header className="prof-card__head"><h2><Icon name={page.icon} size={17} />과제 목록{!loading && !dataError && <span className="prof-nav__badge prof-mono">{filtered.length}</span>}</h2>
        <button type="button" className="prof-btn prof-btn--sm" disabled={loading || working} onClick={refresh}><Icon name="refresh" size={14} />{refreshing ? '불러오는 중…' : '새로고침'}</button></header>
      <div className="prof-assignment-list__filters">
        <label className="prof-assignment-list__search"><span className="prof-sr">과제명 검색</span><input type="search" placeholder="과제명으로 검색" value={search} disabled={working} onChange={event => filter(setSearch, event.target.value)} /></label>
        <div className="prof-tabs" role="group" aria-label="과제 유형">{TYPES.map(([key, label]) => <button type="button" key={key} aria-pressed={type === key} disabled={working} onClick={() => filter(setType, key)}>{label}</button>)}</div>
      </div>
      {loading ? <p className="prof-empty" role="status">과제를 불러오는 중…</p> : dataError ? <p className="prof-empty">과제 목록을 표시할 수 없습니다. 상단의 ‘다시 불러오기’로 재시도해주세요.</p>
        : !filtered.length ? <div className="prof-empty"><Icon name={page.icon} size={27} /><strong>{phaseGroups.length ? '조건에 맞는 과제가 없습니다.' : page.empty}</strong><p>{phaseGroups.length ? '검색어나 과제 유형을 바꿔보세요.' : draft ? '과제를 만들고 저장하면 이곳에서 이어서 준비할 수 있습니다.' : phase === 'ACTIVE' ? '임시 저장된 과제를 게시하면 이곳에 표시됩니다.' : '진행 중 과제의 마감일이 지나면 이곳에 표시됩니다.'}</p></div>
          : <div className="prof-table-wrap"><table className="prof-table prof-table--stack prof-assignment-list__table">
            <thead><tr><th scope="col">과제명</th><th scope="col">유형</th>{!draft && <th scope="col">제출 현황</th>}<th scope="col">{draft ? '준비 상태' : '채점 상태'}</th><th scope="col">마감일</th><th scope="col"><span className="prof-sr">과제 관리</span></th></tr></thead>
            <tbody>{paged.items.map(group => {
              const deadline = courseworkDeadline(group);
              const to = `${basePath}/assignments/${group.id}/${draft ? 'edit' : 'results'}`;
              return <Fragment key={group.id}><tr>
                <td className="prof-table__title" data-label="과제명"><CourseworkName group={group} to={to} disabled={working} /></td>
                <td data-label="유형"><span className="prof-badge">{isDiagnostic(group) ? '진단평가' : '과제'}</span></td>
                {!draft && <td data-label="제출 현황"><SubmissionCell group={group} progress={progress} item={progressByTask.get(group.id)} basePath={basePath} /></td>}
                <td data-label={draft ? '준비 상태' : '채점 상태'}><LabelCell group={group} draft={draft} now={now} /></td>
                <td data-label="마감일"><DeadlineCell deadline={deadline} now={now} draft={draft} /></td>
                <td><div className="prof-assignment-list__actions">
                  <Link className="prof-btn prof-btn--sm" to={to} aria-disabled={working || undefined} onClick={event => { if (working) event.preventDefault(); }}>{draft ? '이어서 준비' : '응답·채점 결과'}</Link>
                  {phase === 'ACTIVE' && <button type="button" className="prof-btn prof-btn--sm" disabled={working} aria-expanded={deadlineId === group.id} aria-controls={`deadline-editor-${group.id}`} onClick={() => { setDeadlineId(deadlineId === group.id ? null : group.id); setError(''); }}>{deadline ? '마감일 변경' : '마감일 설정'}</button>}
                  <button type="button" className="prof-btn prof-btn--sm prof-assignment-list__delete" disabled={working} aria-label={`${courseworkTitle(group)} 삭제`} title="과제 삭제" onClick={() => remove(group)}><Icon name="trash" size={14} /><span className="prof-sr">{busyId === group.id ? '처리 중' : '삭제'}</span></button>
                </div></td>
              </tr>{phase === 'ACTIVE' && deadlineId === group.id && <tr className="prof-assignment-list__editor-row" id={`deadline-editor-${group.id}`}><td colSpan={6}>
                <DeadlineEditor key={`${group.id}-${deadline}`} group={group} deadline={deadline} busy={working} onSave={value => saveDeadline(group, value)} onCancel={() => { setDeadlineId(null); setError(''); }} />
              </td></tr>}</Fragment>;
            })}</tbody>
          </table></div>}
      <footer className="prof-card__foot"><span className="prof-muted">{page.note}</span>
        {!loading && !dataError && paged.pages > 1 && <nav className="prof-assignment-list__pagination" aria-label="과제 목록 페이지"><span className="prof-mono">{paged.from}–{paged.to} / {paged.total}</span>
          <button type="button" className="prof-btn prof-btn--sm" aria-label="이전 페이지" disabled={working || paged.page === 1} onClick={() => { setPageNumber(paged.page - 1); setDeadlineId(null); }}><Icon name="chevronLeft" size={14} /></button>
          {pageNumbers(paged.page, paged.pages).map((number, index) => number === '…' ? <span key={`gap-${index}`}>…</span> : <button type="button" key={number} className="prof-btn prof-btn--sm" aria-current={number === paged.page ? 'page' : undefined} disabled={working} onClick={() => { setPageNumber(number); setDeadlineId(null); }}>{number}</button>)}
          <button type="button" className="prof-btn prof-btn--sm" aria-label="다음 페이지" disabled={working || paged.page === paged.pages} onClick={() => { setPageNumber(paged.page + 1); setDeadlineId(null); }}><Icon name="chevronRight" size={14} /></button>
        </nav>}
      </footer>
    </section>
  </>;
}
