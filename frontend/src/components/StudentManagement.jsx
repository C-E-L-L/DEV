import { useCallback, useEffect, useState } from 'react';
import { diagnosticApi } from '../api';
import { studentAnalyticsApi } from '../api/studentAnalytics';
import { CELL_KEYS, imageUrl } from '../constants';
import { learningStatus, LEARNING_STATUS_LABELS, learningScore, summarizeLearningHistory } from '../utils/studentLearning';
import AuthImage from './AuthImage';
import './StudentManagement.css';

const TYPE_LABELS = { ASSIGNMENT: '과제', TASK: 'Task', DIAGNOSTIC: '진단평가' };

function useApiData(loader) {
  const [state, setState] = useState({ loading: true, data: null, error: false });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, data: null, error: false });
    loader().then(({ data }) => {
      if (!cancelled) setState({ loading: false, data, error: false });
    }).catch(() => {
      if (!cancelled) setState({ loading: false, data: null, error: true });
    });
    return () => { cancelled = true; };
  }, [loader, version]);
  return { ...state, reload: () => setVersion(value => value + 1) };
}

function LoadState({ request }) {
  return request.loading ? <p role="status" className="sm-empty">불러오는 중입니다…</p> : (
    <div role="alert" className="sm-empty">정보를 불러오지 못했습니다. <button onClick={request.reload}>다시 시도</button></div>
  );
}

export default function StudentManagement() {
  const request = useApiData(diagnosticApi.getStudentMatrices);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('history');
  const matrices = request.data?.studentMatrices || [];
  const students = matrices.filter(student => student.studentId !== 'ALL');
  const selected = matrices.find(student => student.studentId === selectedId);
  const filtered = students.filter(student => `${student.studentId} ${student.studentName || ''} ${student.studentDisplayName || ''}`.toLowerCase().includes(search.toLowerCase().trim()));

  return (
    <div className="student-management">
      <div className="sm-heading"><div><h3>학생 관리</h3><p>학생별 학습 이력과 채점 결과를 확인합니다.</p></div><button onClick={request.reload} disabled={request.loading}>새로고침</button></div>
      {request.loading || request.error ? <LoadState request={request} /> : (
        <div className="sm-layout">
          <aside className="sm-card sm-students">
            <h4>학생 목록 <span className="sm-muted">{students.length}명</span></h4>
            <input aria-label="학생 검색" placeholder="학번 또는 이름 검색" value={search} onChange={event => setSearch(event.target.value)} />
            <div className="sm-student-list">
              {filtered.map(student => (
                <button key={student.studentId} className={selectedId === student.studentId ? 'sm-selected' : ''} aria-pressed={selectedId === student.studentId} onClick={() => { setSelectedId(student.studentId); setSection('history'); }}>
                  <strong>{student.studentDisplayName || student.studentId}</strong>
                  <small>채점된 응답 {student.totalSolved}개{student.totalSolved > 0 ? ` · ${student.accuracy}%` : ''}</small>
                </button>
              ))}
              {!filtered.length && <p className="sm-muted">{students.length ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}</p>}
            </div>
            {matrices.some(student => student.studentId === 'ALL') && <button className="sm-total" aria-pressed={selectedId === 'ALL'} onClick={() => { setSelectedId('ALL'); setSection('matrix'); }}>전체 누적 혼동행렬</button>}
          </aside>
          <section className="sm-card sm-content">
            {!selected ? <p className="sm-empty">왼쪽에서 학생을 선택하면 학습 이력과 채점 결과가 표시됩니다.</p> : (
              <>
                <h3>{selected.studentDisplayName || selected.studentId}</h3>
                <div className="sm-tabs" role="group" aria-label="학생 정보 메뉴">
                  {selectedId !== 'ALL' && <button aria-pressed={section === 'history'} className={section === 'history' ? 'sm-selected' : ''} onClick={() => setSection('history')}>학습 이력</button>}
                  <button aria-pressed={section === 'matrix'} className={section === 'matrix' ? 'sm-selected' : ''} onClick={() => setSection('matrix')}>누적 혼동행렬</button>
                </div>
                {section === 'history' && selectedId !== 'ALL' ? <StudentHistory key={selectedId} studentId={selectedId} /> : <StudentMatrix student={selected} />}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StudentMatrix({ student }) {
  return (
    <>
      <p className="sm-muted">채점된 응답 {student.totalSolved}개 · 정답률 {student.totalSolved > 0 ? `${student.accuracy}%` : '—'}<br />행은 정답, 열은 학생 응답입니다. 미응답과 채점 대기 문항은 제외됩니다.</p>
      <div className="sm-table-wrap"><table className="sm-matrix"><thead><tr><th>정답 / 응답</th>{CELL_KEYS.map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{CELL_KEYS.map(actual => {
          const total = CELL_KEYS.reduce((sum, label) => sum + (student.confusionMatrix?.[actual]?.[label] || 0), 0);
          return <tr key={actual}><th>{actual}</th>{CELL_KEYS.map(predicted => {
            const count = student.confusionMatrix?.[actual]?.[predicted] || 0;
            const correct = actual === predicted;
            const ratio = total ? count / total : 0;
            return <td key={predicted} title={`${count} (${Math.round(ratio * 100)}%)`} style={{ background: count ? `rgba(${correct ? '40,167,69' : '220,53,69'},${0.15 + ratio * 0.85})` : '#fff', color: count ? correct ? '#155724' : '#721c24' : '#adb5bd' }}>{count}</td>;
          })}</tr>;
        })}</tbody>
      </table></div>
    </>
  );
}

function StudentHistory({ studentId }) {
  const loader = useCallback(() => studentAnalyticsApi.getHistory(studentId), [studentId]);
  const request = useApiData(loader);
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [expanded, setExpanded] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  if (request.loading || request.error) return <LoadState request={request} />;
  const activities = request.data.activities;
  const totals = summarizeLearningHistory(activities);
  const filtered = activities.filter(activity => (type === 'ALL' || type === activity.scopeType)
    && (status === 'ALL' || status === learningStatus(activity.summary, activity.scopeType === 'DIAGNOSTIC' ? null : activity.deadlineAt)));
  return (
    <>
      <div className="sm-summary">{[[totals.answered, '응답한 문항'], [totals.assignments, '완료 과제'], [totals.tasks, '완료 Task (과제 내 포함)'], [totals.diagnostics, '완료 진단평가']].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      <div className="sm-filters">
        <label>유형 <select aria-label="학습 유형" value={type} onChange={event => setType(event.target.value)}><option value="ALL">전체</option>{Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>풀이 상태 <select aria-label="풀이 상태" value={status} onChange={event => setStatus(event.target.value)}><option value="ALL">전체</option>{Object.entries(LEARNING_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </div>
      <p className="sm-muted">풀이 완료는 모든 문항에 응답한 상태입니다. 전체 정답률은 정답 라벨이 모두 확정되면 표시되며, 미응답도 전체 문항 수에 포함됩니다.</p>
      {!filtered.length && <p className="sm-empty">{activities.length ? '해당 조건의 학습 이력이 없습니다.' : '출제된 과제나 진단평가가 없습니다.'}</p>}
      <div className="sm-activities">{filtered.map(activity => {
        const key = `${activity.scopeType}-${activity.scopeId}`;
        const open = expanded === key;
        const summary = activity.summary;
        const deadline = activity.scopeType === 'DIAGNOSTIC' ? null : activity.deadlineAt;
        const progress = learningStatus(summary, deadline);
        return <article className="sm-activity" key={key}>
          <button className="sm-activity-heading" aria-expanded={open} onClick={() => { setExpanded(open ? null : key); setSelectedTask(null); }}>
            <span><span className="sm-badge">{TYPE_LABELS[activity.scopeType]}</span><strong>{activity.title}</strong><small>{activity.createdAt ? `출제 ${new Date(activity.createdAt).toLocaleDateString('ko-KR')}` : ''}{activity.deadlineAt ? ` · 마감 ${new Date(activity.deadlineAt).toLocaleString('ko-KR')}` : ''}</small></span>
            <span className="sm-activity-score"><span className={`sm-badge sm-${progress.toLowerCase()}`}>{LEARNING_STATUS_LABELS[progress]}</span><strong>{learningScore(summary)}</strong><small>응답 {summary.answeredCells} / {summary.totalCells}개 {open ? '▴' : '▾'}</small></span>
          </button>
          {open && <div className="sm-activity-body">
            <p className="sm-muted">정답 {summary.correct} · 오답 {summary.wrong} · 채점 대기 응답 {summary.pendingAnswers} · 미응답 {summary.totalCells - summary.answeredCells}</p>
            <div className="sm-table-wrap"><table className="sm-tasks"><thead><tr><th>Task / 도말</th><th>풀이</th><th>채점 결과</th><th>상세</th></tr></thead><tbody>{activity.tasks.map(task => <tr key={task.taskId}>
              <td><strong>Task #{task.taskId}</strong><small>{task.filename || task.title}</small><small>{task.speciesName || task.speciesCode || ''}</small></td>
              <td>{task.summary.answeredCells} / {task.summary.totalCells}<small>{LEARNING_STATUS_LABELS[learningStatus(task.summary, deadline)]}</small></td>
              <td>{learningScore(task.summary)}</td>
              <td><button aria-pressed={selectedTask === task.taskId} onClick={() => setSelectedTask(selectedTask === task.taskId ? null : task.taskId)}>{selectedTask === task.taskId ? '닫기' : '세포별 응답'}</button></td>
            </tr>)}</tbody></table></div>
            {selectedTask != null && <TaskAnswers key={`${studentId}-${selectedTask}`} studentId={studentId} taskId={selectedTask} />}
          </div>}
        </article>;
      })}</div>
    </>
  );
}

function TaskAnswers({ studentId, taskId }) {
  const loader = useCallback(() => studentAnalyticsApi.getTaskDetail(studentId, taskId), [studentId, taskId]);
  const request = useApiData(loader);
  const [filter, setFilter] = useState('ALL');
  if (request.loading || request.error) return <LoadState request={request} />;
  const cells = request.data.cells.map((cell, index) => ({ ...cell, index: index + 1 })).filter(cell => filter === 'ALL'
    || (filter === 'WRONG' && cell.isCorrect === false) || (filter === 'UNANSWERED' && !cell.studentLabel)
    || (filter === 'PENDING' && cell.studentLabel && cell.isCorrect == null));
  return <section className="sm-answers">
    <div className="sm-heading"><h4>Task #{taskId} · 세포별 응답</h4><select aria-label="세포 응답 필터" value={filter} onChange={event => setFilter(event.target.value)}><option value="ALL">전체 문항</option><option value="WRONG">오답</option><option value="UNANSWERED">미응답</option><option value="PENDING">채점 대기</option></select></div>
    <div className="sm-cells">{cells.map(cell => <div className="sm-cell" key={cell.cropId}>
      <AuthImage src={imageUrl.crop(cell.cropFilename)} alt={`Cell ${cell.index}`} style={{ width: '76px', height: '76px', objectFit: 'contain', flexShrink: 0, borderRadius: '6px' }} errorText="이미지 없음" />
      <div><strong>Cell #{cell.index}</strong><span className={`sm-cell-result ${cell.isCorrect === true ? 'sm-correct' : cell.isCorrect === false ? 'sm-wrong' : ''}`}>{!cell.studentLabel ? '미응답' : cell.isCorrect == null ? '채점 대기' : cell.isCorrect ? '정답' : '오답'}</span><small>학생 응답: <b>{cell.studentLabel || '미응답'}</b></small><small>정답: {cell.correctLabel || '미확정'}</small>{cell.submittedAt && <small className="sm-muted">{new Date(cell.submittedAt).toLocaleString('ko-KR')}</small>}</div>
    </div>)}</div>
    {!cells.length && <p className="sm-empty">해당하는 문항이 없습니다.</p>}
  </section>;
}
