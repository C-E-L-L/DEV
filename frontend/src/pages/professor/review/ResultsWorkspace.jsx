import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cropApi, labelingApi, statsApi, taskApi } from '../../../api';
import { courseworkApi } from '../../../api/coursework';
import AuthImage from '../../../components/AuthImage';
import { useImageDisplaySettings } from '../../../components/ImageDisplayControls';
import Icon from '../../../components/login/icons';
import { imageUrl } from '../../../constants';
import { answerLabel, cellChoices } from '../../../utils/cellClasses';
import { isDiagnostic } from '../../../utils/coursework';
import { deadlineInfo, submissionSummary } from '../../../utils/professorDashboard';
import { accuracyTone, answerState, cellAccuracy, nextIndex, studentAnswers, voteRows } from '../../../utils/review';
import SmearViewer, { revealInside } from '../../student/SmearViewer';
import { useProfessorData } from '../ProfessorData';
import {
  AdjustPanel, Flash, MoreMenu, SmearThumb, Stepper, WorkHeader, WorkModal, errorMessage, isAdjusted, saveBlob, useWorkKeys,
} from './ReviewParts';

const FILTERS = [['ALL', '전체'], ['OPEN', '미확정'], ['LOW', '정답률 낮은 순']];
const STATE_TONE = { correct: 'good', wrong: 'low', waiting: 'plain', missing: undefined };
const STATE_TEXT = { correct: '정답', wrong: '오답', waiting: '대기', missing: '–' };

const nowLocal = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const studentName = student => student?.name || student?.studentId || '';

function DeadlineDialog({ deadlineAt, onSave, onClose }) {
  const [value, setValue] = useState(deadlineAt?.slice(0, 16) || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async next => {
    setSaving(true); setError('');
    try { await onSave(next ? `${next}:00` : null); onClose(); } catch (e) { setError(errorMessage(e, '마감일을 바꾸지 못했습니다.')); setSaving(false); }
  };
  return (
    <WorkModal title="마감일 변경" busy={saving} onClose={onClose} actions={<>
      {deadlineAt && <button type="button" className="prof-btn prof-btn--danger rv-modal__left" disabled={saving} onClick={() => save('')}>마감 해제</button>}
      <button type="button" className="prof-btn" disabled={saving} onClick={onClose}>취소</button>
      <button type="button" className="prof-btn prof-btn--primary" disabled={saving || !value} onClick={() => save(value)}>저장</button>
    </>}>
      <label className="stu-field"><span>마감 일시</span>
        <input type="datetime-local" min={nowLocal()} value={value} autoFocus onChange={event => setValue(event.target.value)} />
      </label>
      <p className="prof-muted">마감이 지나면 학생은 답을 바꾸거나 최종 제출할 수 없습니다.</p>
      {error && <p role="alert" className="stu-modal__error">{error}</p>}
    </WorkModal>
  );
}

/**
 * Results of a published coursework in the student workspace's frame. Each cell shows how the
 * students answered; the professor confirms (or changes) its correct answer, which grades them.
 * The 학생 tab shows one student's answers on the same smear.
 */
export default function ResultsWorkspace({ id, basePath, onBack }) {
  const navigate = useNavigate();
  const { progress, progressByTask, reload } = useProfessorData();
  const [workspace, setWorkspace] = useState(null);
  const [stats, setStats] = useState(() => new Map());
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('cells');
  const [studentId, setStudentId] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [autoNext, setAutoNext] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [votersOpen, setVotersOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const cellList = useRef(null);

  const load = useCallback(async () => {
    const { data } = await courseworkApi.get(id);
    const lists = await Promise.all(data.tasks.map(part => statsApi.getByTaskId(part.task.id).then(response => response.data || [])));
    const byCrop = new Map(lists.flat().map(item => [item.cropId, item]));
    setWorkspace(data);
    setStats(byCrop);
    return { data, byCrop };
  }, [id]);

  useEffect(() => {
    let active = true;
    setLoadError('');
    load().then(({ data, byCrop }) => {
      if (!active) return;
      // Start at the first cell that still needs a confirmed answer.
      const crops = data.tasks.flatMap(part => part.crops.filter(crop => !crop.excluded));
      setSelectedId((crops.find(crop => !(byCrop.get(crop.id)?.finalLabel ?? crop.finalLabel)) || crops[0])?.id ?? null);
    }).catch(error => active && setLoadError(errorMessage(error, '과제 결과를 불러오지 못했습니다.')));
    return () => { active = false; };
  }, [load]);

  // Excluded cells were never asked, so the results leave them out.
  const parts = useMemo(() => (workspace?.tasks || [])
    .map(part => ({ task: part.task, crops: part.crops.filter(crop => !crop.excluded) }))
    .filter(part => part.crops.length > 0), [workspace]);
  const cells = useMemo(() => parts.flatMap(part => part.crops.map(crop => {
    const cellStats = stats.get(crop.id);
    return { ...crop, taskId: part.task.id, stats: cellStats, finalLabel: cellStats ? cellStats.finalLabel : crop.finalLabel };
  })), [parts, stats]);
  const students = useMemo(() => studentAnswers(cells), [cells]);

  const index = Math.max(0, cells.findIndex(cell => cell.id === selectedId));
  const current = cells[index];
  const part = parts.find(item => item.crops.some(crop => crop.id === current?.id)) || parts[0];
  const first = workspace?.tasks[0]?.task;
  const diagnostic = isDiagnostic(first);
  const student = view === 'students' ? students.find(item => item.studentId === studentId) : null;
  const display = useImageDisplaySettings(part?.task.originalFilename || `task-${first?.id || 'none'}`);
  const adjusted = isAdjusted(display.settings);

  useEffect(() => { setCandidate(null); }, [selectedId]);
  useEffect(() => {
    revealInside(cellList.current, cellList.current?.querySelector('[aria-current="true"]'));
  }, [selectedId, filter]);

  const step = delta => { const next = cells[Math.min(cells.length - 1, Math.max(0, index + delta))]; if (next) setSelectedId(next.id); };
  const goNextOpen = () => { const target = nextIndex(cells, index, cell => !cell.finalLabel); if (target !== -1) setSelectedId(cells[target].id); };
  const pick = key => { if (!current || busy) return; setCandidate(key === current.finalLabel ? null : key); };

  const confirm = async () => {
    if (!current || !candidate || busy) return;
    const cell = current;
    const wasOpen = !cell.finalLabel;
    setBusy(true); setFlash(null);
    try {
      await cropApi.confirm(cell.id, candidate);
      const { data } = await statsApi.getByTaskId(cell.taskId);
      setStats(previous => { const next = new Map(previous); for (const item of data || []) next.set(item.cropId, item); return next; });
      setCandidate(null);
      reload({ silent: true });
      if (autoNext && wasOpen) {
        const target = nextIndex(cells, index, other => other.id !== cell.id && !other.finalLabel);
        if (target !== -1) setSelectedId(cells[target].id);
      }
    } catch (error) {
      setFlash({ kind: 'error', text: errorMessage(error, '정답을 저장하지 못했습니다. 다시 시도해주세요.') });
    } finally { setBusy(false); }
  };

  const exportZip = async () => {
    try {
      const { data } = await labelingApi.exportTask(part.task.id);
      saveBlob(data, `task_${part.task.id}_${(part.task.speciesCode || 'DOG').toLowerCase()}_labeling.zip`);
    } catch { setFlash({ kind: 'error', text: '라벨링 ZIP을 만들지 못했습니다.' }); }
  };
  const importJson = async file => {
    setBusy(true); setFlash(null);
    try {
      const manifest = JSON.parse(await file.text());
      const { data } = await labelingApi.importTask(part.task.id, manifest);
      await load();
      reload({ silent: true });
      setFlash({ kind: 'ok', text: `${data.updated}개 세포의 정답을 반영했습니다.` });
    } catch (error) {
      setFlash({ kind: 'error', text: errorMessage(error, 'annotations.json 형식 또는 라벨 값을 확인해주세요.') });
    } finally { setBusy(false); }
  };
  const saveDeadline = async deadlineAt => {
    if (first.assignmentId) await taskApi.updateAssignmentDeadline(first.assignmentId, deadlineAt);
    else await taskApi.updateDeadline(first.id, deadlineAt);
    await load();
    reload({ silent: true });
    setFlash({ kind: 'ok', text: deadlineAt ? '마감일을 바꿨습니다.' : '마감일을 해제했습니다.' });
  };
  const remove = async () => {
    const what = first.assignmentId ? `도말 ${workspace.tasks.length}장과 학생 제출 기록이 모두 삭제됩니다.` : '학생 제출 기록과 혼동행렬도 모두 삭제됩니다.';
    if (!window.confirm(`과제 "${first.title}"를 삭제할까요?\n${what}`)) return;
    setBusy(true);
    try {
      if (first.assignmentId) await taskApi.deleteAssignment(first.assignmentId); else await taskApi.delete(first.id);
      reload({ silent: true });
      navigate(`${basePath}/assignments`, { replace: true });
    } catch (error) {
      setFlash({ kind: 'error', text: errorMessage(error, '과제를 삭제하지 못했습니다.') });
      setBusy(false);
    }
  };

  useWorkKeys((event, tag) => {
    if (!current || deadlineOpen) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); return; }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); return; }
    if (event.key === ' ' && tag !== 'BUTTON' && tag !== 'A') { event.preventDefault(); step(1); return; }
    if (view !== 'cells') return;
    if (event.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A' && candidate) { event.preventDefault(); confirm(); return; }
    const choice = /^[1-9]$/.test(event.key) ? cellChoices(current)[Number(event.key) - 1] : null;
    if (choice) pick(choice.key);
  });

  if (!workspace || !current) {
    return (
      <div className="stu-work rv-work">
        <WorkHeader title={first?.title || '과제 결과'} onBack={onBack} backLabel="과제 목록으로" />
        <div className="prof-empty stu-work__state" role={loadError ? 'alert' : 'status'}>
          <p>{loadError || (workspace ? '이 과제에는 출제된 세포가 없습니다.' : '과제 결과를 불러오는 중…')}</p>
          {(loadError || workspace) && <button type="button" className="prof-btn" onClick={onBack}>과제 목록으로</button>}
        </div>
      </div>
    );
  }

  const number = cell => cells.indexOf(cell) + 1;
  const confirmedCount = cells.filter(cell => cell.finalLabel).length;
  const openCount = cells.length - confirmedCount;
  const due = deadlineInfo(first.deadlineAt);
  const summary = submissionSummary(progressByTask.get(first.id), progress?.students || []);
  const scope = diagnostic ? cells : cells.filter(cell => cell.taskId === part.task.id);
  const hereOpen = scope.filter(cell => !cell.finalLabel).length;
  const listed = filter === 'OPEN' ? scope.filter(cell => !cell.finalLabel)
    : filter === 'LOW' ? [...scope].sort((a, b) => (cellAccuracy(a.stats) ?? 101) - (cellAccuracy(b.stats) ?? 101))
      : scope;
  const goToSmear = target => {
    const next = parts[target];
    if (next) setSelectedId((next.crops.find(crop => !cells.find(cell => cell.id === crop.id)?.finalLabel) || next.crops[0]).id);
  };
  const smearIndex = parts.indexOf(part);

  const studentState = cell => answerState(student?.answers.get(cell.id), cell.finalLabel);
  const tile = cell => {
    if (student) {
      const state = studentState(cell);
      return { tone: STATE_TONE[state] || 'missing', text: STATE_TEXT[state], textTone: STATE_TONE[state] || 'none' };
    }
    const accuracy = cellAccuracy(cell.stats);
    const tone = accuracyTone(accuracy);
    return { tone: cell.finalLabel ? tone : 'open', text: accuracy != null ? `${accuracy}%` : '–', textTone: tone };
  };
  const viewerCells = (part?.crops || []).map(crop => {
    const cell = cells.find(item => item.id === crop.id);
    const n = number(cell);
    const isCurrent = cell.id === current.id;
    if (student) {
      const answer = student.answers.get(cell.id);
      const state = studentState(cell);
      return {
        id: cell.id, index: cells.indexOf(cell), number: n, bbox: cell.bbox, state: isCurrent ? 'current' : 'todo',
        tone: isCurrent ? undefined : STATE_TONE[state], tag: answer ? `${n} ${answerLabel(answer)}` : n,
        description: answer ? `학생 답 ${answerLabel(answer)} · ${STATE_TEXT[state]}` : '미응답',
      };
    }
    const accuracy = cellAccuracy(cell.stats);
    return {
      id: cell.id, index: cells.indexOf(cell), number: n, bbox: cell.bbox,
      state: isCurrent ? 'current' : cell.finalLabel ? 'done' : 'todo',
      tone: !isCurrent && cell.finalLabel ? (accuracy != null ? accuracyTone(accuracy) : 'plain') : undefined,
      tag: accuracy != null ? `${n} ${accuracy}%` : n,
      description: cell.finalLabel ? `정답 ${cell.finalLabel}${accuracy != null ? ` · 정답률 ${accuracy}%` : ' · 응답 없음'}` : '정답 미확정',
    };
  });

  const choices = cellChoices(current);
  const votes = voteRows(choices, current.stats);
  const accuracy = cellAccuracy(current.stats);
  const voters = current.stats?.votersByLabel || {};
  const candidateLabel = choices.find(choice => choice.key === candidate)?.label;
  const responders = new Set(students.map(item => item.studentId));
  const silent = (progress?.students || []).filter(item => !responders.has(item.studentId));
  const nameOf = new Map((progress?.students || []).map(item => [item.studentId, item.name]));
  const status = first.status === 'DRAFT' ? { text: '임시저장', tone: '' }
    : due.tone === 'closed' ? { text: `마감됨 · ${due.dateText}`, tone: '' }
      : { text: first.deadlineAt ? `진행중 · ${due.dateText} 마감` : '진행중 · 마감 없음', tone: ' is-indigo' };
  const percent = cells.length ? Math.round((confirmedCount / cells.length) * 100) : 0;
  const detailLink = item => `${basePath}/students/${encodeURIComponent(item.studentId)}?item=${first.id}`;

  return (
    <div className={`stu-work rv-work${diagnostic ? ' is-diagnostic' : ''}`}>
      <WorkHeader title={first.title || '과제 결과'} onBack={onBack} backLabel="과제 목록으로"
        status={progress && <span className="rv-pill" title="최종 제출한 학생 / 대상 학생">제출 <strong className="prof-mono">{summary.submitted}/{summary.total}</strong>명</span>}
        menu={<MoreMenu label="과제 메뉴" items={[
          { key: 'deadline', icon: 'clock', text: '마감일 변경', onClick: () => setDeadlineOpen(true), disabled: busy },
          !diagnostic && { key: 'zip', icon: 'download', text: `도말 ${smearIndex + 1} 라벨 ZIP 내보내기`, onClick: exportZip, disabled: busy },
          !diagnostic && { key: 'json', icon: 'upload', text: `도말 ${smearIndex + 1} 라벨 JSON 가져오기`, disabled: busy, file: { accept: 'application/json,.json', onFile: importJson } },
          { key: 'grades', icon: 'chart', text: '학생별 성적 보기', onClick: () => navigate(`${basePath}/students`) },
          { key: 'delete', icon: 'trash', text: '과제 삭제', onClick: remove, danger: true, disabled: busy },
        ]} />}>
        <span className={`prof-badge${status.tone}`}>{status.text}</span>
        {diagnostic && <span className="prof-badge is-indigo">진단평가</span>}
      </WorkHeader>

      <Flash flash={flash} onClose={() => setFlash(null)} />

      <div className="stu-work__body">
        <section className="stu-pane stu-pane--left" aria-label="도말과 세포 목록">
          {!diagnostic && (
            <>
              <header className="stu-pane__head"><h2>도말 리스트</h2><span className="prof-mono">{parts.length}개</span></header>
              <ul className="stu-smears">
                {parts.map((item, itemIndex) => {
                  const own = cells.filter(cell => cell.taskId === item.task.id);
                  const done = own.filter(cell => cell.finalLabel).length;
                  const active = item === part;
                  return (
                    <li key={item.task.id}>
                      <button type="button" className={`stu-smear${active ? ' is-active' : ''}`} aria-current={active} onClick={() => goToSmear(itemIndex)}
                        title={item.task.uploadedFilename || item.task.originalFilename || undefined}>
                        <SmearThumb filename={item.task.originalFilename} />
                        <span className="stu-smear__body">
                          <span className="stu-smear__top">
                            <strong>도말 {itemIndex + 1}</strong>
                            <span className={`prof-mono${done === own.length ? ' is-done' : ''}`}>정답 {done}/{own.length}</span>
                          </span>
                          {item.task.speciesName && <span className="stu-smear__sub">{item.task.speciesName}</span>}
                          {active && <span className="prof-bar"><span className={done === own.length ? 'is-done' : ''} style={{ width: `${own.length ? (done / own.length) * 100 : 0}%` }} /></span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <header className="stu-pane__head">
            <h2>세포 목록</h2>
            <span className={`prof-mono stu-pane__count${hereOpen ? ' rv-count--open' : ''}`}>{hereOpen ? `미확정 ${hereOpen}` : '모두 확정'}</span>
          </header>
          <div className="rv-chips" role="group" aria-label="세포 거르기">
            {FILTERS.map(([key, text]) => (
              <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {text}{key !== 'LOW' && <> <span className="prof-mono">{key === 'ALL' ? scope.length : hereOpen}</span></>}
              </button>
            ))}
          </div>
          <ul className="stu-cells" ref={cellList}>
            {listed.map(cell => {
              const selected = cell.id === current.id;
              const look = tile(cell);
              return (
                <li key={cell.id}>
                  <button type="button" aria-current={selected} className={`stu-cell rv-cell--${look.tone}${selected ? ' is-current' : ''}`}
                    title={student ? `학생 답: ${answerLabel(student.answers.get(cell.id)) || '없음'}` : cell.finalLabel ? `정답 ${cell.finalLabel}` : '정답 미확정'}
                    onClick={() => setSelectedId(cell.id)}>
                    <AuthImage src={imageUrl.crop(cell.cropFilename)} alt="" className="stu-cell__image" style={{ filter: display.filter }} />
                    <span className="rv-cell__cap">
                      <span className="prof-mono">#{number(cell)}</span>
                      <span className={`prof-mono rv-rate is-${look.textTone}`}>{look.text}</span>
                    </span>
                    {!student && (cell.finalLabel
                      ? <span className="stu-cell__check" aria-hidden="true"><Icon name="check" size={9} /></span>
                      : <span className="rv-cell__mark is-open" aria-hidden="true" />)}
                    <span className="prof-sr">{cell.finalLabel ? `정답 확정 ${cell.finalLabel}` : '정답 미확정'}</span>
                  </button>
                </li>
              );
            })}
            {!listed.length && <li className="rv-cells__empty">정답이 비어 있는 세포가 없습니다.</li>}
          </ul>
        </section>

        <section className="stu-pane stu-pane--center" aria-label={diagnostic ? '세포 이미지' : '혈액 도말 이미지'}>
          {diagnostic ? (
            <div className="stu-cropstage">
              <AuthImage key={current.id} src={imageUrl.crop(current.cropFilename)} alt={`세포 ${index + 1}`} className="stu-cropstage__image" style={{ filter: display.filter }}
                loadingText="세포 이미지를 불러오는 중…" errorText="세포 이미지를 불러오지 못했습니다." />
            </div>
          ) : part.task.originalFilename ? (
            <SmearViewer filename={part.task.originalFilename} filter={display.filter} cells={viewerCells} onSelect={cellIndex => setSelectedId(cells[cellIndex].id)} />
          ) : <p className="prof-empty">도말 이미지가 없습니다.</p>}
          {!diagnostic && parts.length > 1 && (
            <div className="stu-smearnav prof-mono" role="group" aria-label="도말 이동">
              <button type="button" onClick={() => goToSmear(smearIndex - 1)} disabled={smearIndex <= 0} title="이전 도말" aria-label="이전 도말"><Icon name="arrowLeft" size={14} /></button>
              <span>도말 {smearIndex + 1} / {parts.length}</span>
              <button type="button" onClick={() => goToSmear(smearIndex + 1)} disabled={smearIndex >= parts.length - 1} title="다음 도말" aria-label="다음 도말"><Icon name="arrowRight" size={14} /></button>
            </div>
          )}
          {student && (
            <div className="rv-viewchip" role="status">
              <span><strong>{studentName(student)}</strong> 학생 응답 보는 중</span>
              <button type="button" onClick={() => setStudentId(null)} aria-label="학생 응답 보기 닫기" title="닫기"><Icon name="close" size={13} /></button>
            </div>
          )}
          {!diagnostic && (
            <div className="rv-legend" aria-label="박스 색 안내">
              {student ? <>
                <span><i className="is-good" />정답</span><span><i className="is-low" />오답</span><span><i className="is-plain" />확정 전</span><span><i className="is-open" />미응답</span>
              </> : <>
                <span><i className="is-good" />80% 이상</span><span><i className="is-mid" />50–79%</span><span><i className="is-low" />50% 미만</span><span><i className="is-open" />정답 미확정</span>
              </>}
            </div>
          )}
        </section>

        <section className="stu-pane stu-pane--right" aria-label={view === 'cells' ? '세포 응답과 정답 확정' : '학생별 응답'}>
          <div className="rv-tabs" role="tablist" aria-label="보기">
            <button type="button" role="tab" aria-selected={view === 'cells'} onClick={() => setView('cells')}>세포</button>
            <button type="button" role="tab" aria-selected={view === 'students'} onClick={() => setView('students')}>학생 <span className="prof-mono">{students.length}</span></button>
          </div>
          <div className="stu-classify">
            {view === 'cells' ? <>
              <figure className="stu-target">
                <AuthImage key={current.id} src={imageUrl.crop(current.cropFilename)} alt={`세포 ${index + 1}`} className="stu-target__image" style={{ filter: display.filter }} />
                <figcaption className="stu-target__text">
                  <span className="stu-target__top">
                    <strong className="prof-mono">Cell #{index + 1}</strong>
                    <span className={`prof-badge${current.finalLabel ? ' is-emerald' : ' is-amber'}`}>{current.finalLabel ? '정답 확정' : '미확정'}</span>
                    <span className="rv-target__pos prof-mono">{diagnostic ? '' : `도말 ${smearIndex + 1} · `}{index + 1}/{cells.length}</span>
                  </span>
                  <small>
                    응답 <strong>{votes.total}명</strong>
                    {current.finalLabel ? (accuracy != null && <> · 정답률 <strong className={`rv-rate is-${accuracyTone(accuracy)}`}>{accuracy}%</strong></>) : ' · 정답 확정 전'}
                    {current.pseudoLabel && <> · AI 제안 {current.pseudoLabel}</>}
                  </small>
                </figcaption>
              </figure>

              <header className="stu-pane__title"><h2>학생 응답 · 정답 확정</h2><span className="rv-hint">1–{Math.min(choices.length, 9)} 선택 · Enter 확정</span></header>
              <div className="stu-choices">
                {votes.rows.map(row => {
                  const answer = current.finalLabel === row.key;
                  const chosen = candidate === row.key;
                  return (
                    <button key={row.key} type="button" aria-pressed={chosen} disabled={busy}
                      className={`stu-choice rv-vote${answer ? ' is-answer' : ''}${chosen ? ' is-selected' : ''}${row.count === 0 ? ' is-empty' : ''}`}
                      title={answer ? '확정된 정답' : `${row.label}을(를) 정답 후보로 선택`} onClick={() => pick(row.key)}>
                      <span className="rv-choice__name">
                        {row.label}{current.pseudoLabel === row.key && <em className="rv-ai" title="AI 제안">AI</em>}
                        {answer && <span className="rv-vote__mark"><Icon name="check" size={11} />정답</span>}
                      </span>
                      <span className="rv-vote__count prof-mono">{row.count}명{row.count > 0 && <small> {row.share}%</small>}</span>
                      <span className="rv-vote__bar" style={{ width: `${row.share}%` }} aria-hidden="true" />
                    </button>
                  );
                })}
                <div className="stu-choice stu-choice--unknown rv-vote is-static" title="모르겠어요는 점수에서 오답으로 처리됩니다">
                  <span>모르겠어요</span><span className="rv-vote__count prof-mono">{votes.unknown}명</span>
                </div>
              </div>

              {candidate ? (
                <div className="rv-confirm">
                  {current.finalLabel && <p className="rv-warn">정답을 {current.finalLabel}에서 {candidateLabel}(으)로 바꾸면 이 세포에 응답한 학생 {votes.total}명의 점수가 다시 계산됩니다.</p>}
                  <button type="button" className="prof-btn prof-btn--primary" disabled={busy} onClick={confirm}>
                    {busy ? '저장 중…' : current.finalLabel ? `${candidateLabel}(으)로 정답 변경` : `${candidateLabel}을(를) 정답으로 확정`}<kbd className="prof-mono">Enter</kbd>
                  </button>
                </div>
              ) : (
                <p className="rv-hint rv-confirm__hint">{current.finalLabel ? '정답을 바꾸려면 다른 종류를 고르세요.' : '정답으로 확정할 종류를 고르세요.'}</p>
              )}
              <label className="rv-check"><input type="checkbox" className="prof-check" checked={autoNext} onChange={event => setAutoNext(event.target.checked)} />확정 후 다음 미확정 세포로 이동</label>

              <div className="stu-tools">
                <button type="button" className={`stu-tool${adjustOpen || adjusted ? ' is-on' : ''}`} aria-expanded={adjustOpen} onClick={() => setAdjustOpen(value => !value)}>
                  <Icon name="contrast" size={14} />화질 조정{adjusted && <span className="stu-tool__dot" aria-label="조정됨" />}
                </button>
                <button type="button" className={`stu-tool${votersOpen ? ' is-on' : ''}`} aria-expanded={votersOpen} onClick={() => setVotersOpen(value => !value)} disabled={!votes.total}>
                  <Icon name="users" size={14} />응답한 학생
                </button>
              </div>
              {adjustOpen && <AdjustPanel display={display} />}
              {votersOpen && votes.total > 0 && (
                <div className="rv-voters">
                  {[...votes.rows.filter(row => row.count > 0), ...(votes.unknown ? [{ key: 'UNKNOWN', label: '모르겠어요', count: votes.unknown }] : [])]
                    .sort((a, b) => Number(b.key === candidate) - Number(a.key === candidate) || b.count - a.count)
                    .map(row => (
                      <div key={row.key} className={`rv-voters__group${row.key === current.finalLabel ? ' is-answer' : ''}${row.key === candidate ? ' is-candidate' : ''}`}>
                        <strong>{row.label} <span className="prof-mono">{row.count}명</span>{row.key === current.finalLabel && <em>정답</em>}</strong>
                        <div className="rv-voters__chips">
                          {(voters[row.key] || []).map(voter => {
                            const voterId = typeof voter === 'string' ? voter : voter.studentId;
                            return <Link key={voterId} to={detailLink({ studentId: voterId })} className="rv-chip" title={`${voterId} 학생 상세`}>{(typeof voter !== 'string' && voter.studentName) || nameOf.get(voterId) || voterId}</Link>;
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <p className="rv-keys">←/→ 세포 이동 · 1–6 정답 후보 · Enter 확정</p>
            </> : student ? <>
              <div className="rv-student-head">
                <button type="button" className="prof-link-btn" onClick={() => setStudentId(null)}><Icon name="arrowLeft" size={13} />학생 목록</button>
                <h2>{studentName(student)} {student.name && <span className="prof-mono">{student.studentId}</span>}</h2>
                <p>응답 {student.answered}/{cells.length} · {student.rate != null ? <>정답 {student.correct}/{student.graded} (<strong className={`rv-rate is-${accuracyTone(student.rate)}`}>{student.rate}%</strong>)</> : '채점 대기'}</p>
              </div>
              <figure className="stu-target">
                <AuthImage key={current.id} src={imageUrl.crop(current.cropFilename)} alt={`세포 ${index + 1}`} className="stu-target__image" style={{ filter: display.filter }} />
                <figcaption className="stu-target__text">
                  <span className="stu-target__top"><strong className="prof-mono">Cell #{index + 1}</strong><span className="rv-target__pos prof-mono">{index + 1}/{cells.length}</span></span>
                </figcaption>
              </figure>
              {(() => {
                const answer = student.answers.get(current.id);
                const state = studentState(current);
                return (
                  <div className={`rv-answer is-${state}`}>
                    <span>학생 답 <strong>{answer ? answerLabel(answer) : '응답 없음'}</strong></span>
                    <Icon name="arrowRight" size={13} />
                    <span>정답 <strong>{current.finalLabel || '확정 전'}</strong></span>
                    <span className={`prof-badge${state === 'correct' ? ' is-emerald' : state === 'wrong' ? ' rv-badge-rose' : ''}`}>{STATE_TEXT[state] === '–' ? '미응답' : STATE_TEXT[state]}</span>
                  </div>
                );
              })()}
              <Link to={detailLink(student)} className="prof-btn rv-wide">학생 상세 보기<Icon name="arrowRight" size={14} /></Link>
              <p className="rv-keys">←/→ 세포 이동 · 도말의 박스 색이 이 학생 기준으로 바뀝니다</p>
            </> : <>
              <p className="rv-hint">{confirmedCount === cells.length ? '정답 수 / 응답한 문항 기준입니다.' : `정답이 확정된 문항만 채점합니다 (확정 ${confirmedCount}/${cells.length}).`}</p>
              {students.length ? (
                <ul className="rv-students">
                  {students.map(item => (
                    <li key={item.studentId}>
                      <button type="button" className="rv-student" onClick={() => setStudentId(item.studentId)}>
                        <span className="rv-student__name"><strong>{studentName(item)}</strong>{item.name && <span className="prof-mono">{item.studentId}</span>}</span>
                        <span className="rv-student__score prof-mono">
                          {item.rate != null ? <><strong className={`rv-rate is-${accuracyTone(item.rate)}`}>{item.rate}%</strong><small>{item.correct}/{item.graded}</small></> : <small>채점 대기</small>}
                        </span>
                        <span className="rv-student__sub">응답 {item.answered}/{cells.length}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="prof-empty prof-empty--compact">아직 응답한 학생이 없습니다.</p>}
              {silent.length > 0 && (
                <details className="rv-silent">
                  <summary>응답 없음 {silent.length}명</summary>
                  <ul>{silent.map(item => <li key={item.studentId}><Link to={detailLink(item)}>{item.name || item.studentId}</Link>{item.name && <span className="prof-mono">{item.studentId}</span>}</li>)}</ul>
                </details>
              )}
            </>}
          </div>
        </section>
      </div>

      <footer className="stu-work__foot">
        <div className="stu-foot__progress">
          <span>정답 확정</span>
          <span className="prof-mono"><strong>{confirmedCount}</strong> / {cells.length}</span>
          <span className="prof-bar" role="progressbar" aria-label="정답 확정 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <span className={openCount ? '' : 'is-done'} style={{ width: `${percent}%` }} />
          </span>
          {openCount > 0 && <span className="prof-badge is-amber prof-mono">미확정 {openCount}</span>}
        </div>
        <Stepper index={index} total={cells.length} onStep={step} />
        <div className="stu-foot__submit">
          {openCount > 0 ? (
            <button type="button" className="prof-btn prof-btn--primary" onClick={goNextOpen} disabled={openCount === 1 && !current.finalLabel}>
              다음 미확정 세포<Icon name="chevronRight" size={15} />
            </button>
          ) : (
            <>
              <span className="rv-done"><Icon name="checkCircle" size={15} />모든 세포 정답 확정됨</span>
              <Link to={`${basePath}/students`} className="prof-btn">학생별 성적 보기</Link>
            </>
          )}
        </div>
      </footer>

      {deadlineOpen && <DeadlineDialog deadlineAt={first.deadlineAt} onSave={saveDeadline} onClose={() => setDeadlineOpen(false)} />}
    </div>
  );
}
