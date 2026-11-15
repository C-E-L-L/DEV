import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { taskApi } from '../../api';
import { isDiagnostic } from '../../utils/coursework';
import { courseworkDeadline, courseworkPhase, courseworkTitle, pendingLabelCount, submissionSummary } from '../../utils/professorDashboard';
import { useProfessorData } from './ProfessorData';

const errorMessage = error => error?.response?.data?.message || error.message || '요청을 처리하지 못했습니다. 다시 시도해주세요.';

const PAGES = {
  DRAFT: { title: '임시 저장된 과제', text: '작성 중인 과제는 학생에게 보이지 않습니다. 게시할 때 공개됩니다.', empty: '임시 저장된 과제가 없습니다.' },
  ACTIVE: { title: '진행중인 과제', text: '학생에게 게시되어 응답을 받고 있는 과제입니다.', empty: '진행중인 과제가 없습니다. 과제를 만들어보세요.' },
  CLOSED: { title: '완료된 과제', text: '마감일이 지난 과제입니다. 응답과 채점 결과를 확인할 수 있습니다.', empty: '마감된 과제가 없습니다.' },
};

function minimumDeadline() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** Deadline of an open coursework. The server rejects changes once the deadline has passed. */
function DeadlineEditor({ group, deadline, onSaved, onError }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async next => {
    setSaving(true);
    try {
      const deadlineAt = next ? `${next}:00` : null;
      if (group.assignmentId) await taskApi.updateAssignmentDeadline(group.assignmentId, deadlineAt);
      else await taskApi.updateDeadline(group.id, deadlineAt);
      setEditing(false);
      await onSaved();
    } catch (e) { onError(errorMessage(e)); } finally { setSaving(false); }
  };
  if (!editing) return <button onClick={() => { setValue(deadline ? String(deadline).slice(0, 16) : ''); setEditing(true); }}>{deadline ? '마감일 변경' : '마감일 설정'}</button>;
  return <>
    <input type="datetime-local" aria-label={`${courseworkTitle(group)} 마감일`} min={minimumDeadline()} value={value} onChange={e => setValue(e.target.value)} disabled={saving} />
    <button className="pw-primary" disabled={saving || !value} onClick={() => save(value)}>저장</button>
    {deadline && <button disabled={saving} onClick={() => save('')}>마감일 해제</button>}
    <button disabled={saving} onClick={() => setEditing(false)}>취소</button>
  </>;
}

/** Coursework list for one phase (sidebar: 임시 저장 / 진행중 / 완료). */
export default function AssignmentsPage({ phase }) {
  const navigate = useNavigate();
  const { groups, loading, progress, progressByTask, reload } = useProfessorData();
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const page = PAGES[phase];
  const now = new Date();
  const shown = groups.filter(group => courseworkPhase(group, now) === phase);

  const remove = async group => {
    const name = courseworkTitle(group);
    const warning = group.status === 'DRAFT'
      ? `임시 저장된 과제 "${name}"을(를) 삭제할까요?\n준비한 도말과 라벨이 모두 삭제됩니다.`
      : `과제 "${name}"을(를) 삭제할까요?\n도말 이미지, 학생 제출 기록, 혼동행렬이 모두 삭제되며 되돌릴 수 없습니다.`;
    if (!window.confirm(warning)) return;
    setBusyId(group.id); setError('');
    try {
      if (group.assignmentId) await taskApi.deleteAssignment(group.assignmentId);
      else await taskApi.delete(group.id);
      await reload({ silent: true });
    } catch (e) { setError(errorMessage(e)); } finally { setBusyId(null); }
  };

  return <div className="professor-workspace prof-embedded">
    <div className="pw-section-heading"><div><h2>{page.title}</h2><p>{page.text}</p></div><button className="pw-primary" onClick={() => navigate('/expert/assignments/new')}>+ 과제 만들기</button></div>
    {error && <div role="alert" className="pw-error">{error}</div>}
    {loading ? <p role="status">과제를 불러오는 중…</p> : !shown.length ? <div className="pw-empty">{page.empty}</div> : <div className="pw-cards">{shown.map(group => {
      const deadline = courseworkDeadline(group);
      const pending = pendingLabelCount(group);
      const summary = submissionSummary(progressByTask.get(group.id), progress.students);
      const busy = busyId === group.id;
      return <article className="pw-card" key={group.id}>
        <div className="pw-card-top"><span className={`pw-badge ${isDiagnostic(group) ? 'diagnostic' : ''}`}>{isDiagnostic(group) ? '진단평가' : '분류 실습'}</span><span className="pw-badge">{phase === 'DRAFT' ? '작성 중 · 비공개' : phase === 'ACTIVE' ? '게시됨' : '마감됨'}</span>{pending > 0 && <span className="pw-badge prof-badge-wait">채점 대기</span>}</div>
        <h3>{courseworkTitle(group)}</h3>
        <p>{[...new Set(group.tasks.map(t => t.speciesName))].join(', ')} · {isDiagnostic(group) ? '' : `도말 ${group.tasks.length}장 · `}{group.cropCount}문항</p>
        <p>정답 확정 {group.labeledCount}/{group.cropCount} · 출제 제외 {group.excludedCount}</p>
        <p>{deadline ? `마감 ${new Date(deadline).toLocaleString('ko-KR')}` : '마감일 없음'}</p>
        {phase !== 'DRAFT' && <p>{summary.total ? <>제출 {summary.submitted}/{summary.total}명{summary.missing.length > 0 && <> · <Link className="prof-inline-link" to={`/expert/students/progress?item=${group.id}`}>미제출 {summary.missing.length}명 보기</Link></>}</> : '등록된 학생 없음'}</p>}
        <div className="pw-actions">
          {phase === 'DRAFT'
            ? <button className="pw-primary" disabled={busy} onClick={() => navigate(`/expert/assignments/${group.id}/edit`)}>이어서 준비하기</button>
            : <button disabled={busy} onClick={() => navigate(`/expert/assignments/${group.id}/results`)}>응답·채점 결과</button>}
          {phase === 'ACTIVE' && <DeadlineEditor group={group} deadline={deadline} onSaved={() => reload({ silent: true })} onError={setError} />}
          <button className="prof-danger" disabled={busy} onClick={() => remove(group)}>{busy ? '삭제 중…' : '삭제'}</button>
        </div>
      </article>;
    })}</div>}
  </div>;
}
