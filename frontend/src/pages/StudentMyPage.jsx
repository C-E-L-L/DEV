import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentHistoryApi } from '../api/studentHistory';
import StudentReviewPanel from '../components/StudentReviewPanel';
import ReportsPanel from '../components/ReportsPanel';
import AuthImage from '../components/AuthImage';
import { imageUrl } from '../constants';
import '../components/ReportsPanel.css';

function useLoad(load, dependency) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let canceled = false;
    setState({ loading: true, data: null, error: '' });
    load().then(({ data }) => { if (!canceled) setState({ loading: false, data, error: '' }); })
      .catch(() => { if (!canceled) setState({ loading: false, data: null, error: '기록을 불러오지 못했습니다.' }); });
    return () => { canceled = true; };
  }, [dependency, version]);
  return { ...state, retry: () => setVersion(v => v + 1) };
}

function LoadStatus({ state }) {
  if (state.loading) return <p role="status">Loading…</p>;
  if (state.error) return <p className="report-error" role="alert">{state.error} <button onClick={state.retry}>Retry</button></p>;
  return null;
}

function MyAnswers({ taskId }) {
  const state = useLoad(() => studentHistoryApi.getAnswers(taskId), taskId);
  if (!state.data) return <LoadStatus state={state} />;
  return <div className="my-history-cells">{state.data.length ? state.data.map(cell => <div key={cell.cropId} className="my-history-cell">
    <AuthImage src={imageUrl.crop(cell.cropFilename)} alt={`Cell #${cell.cropId}`} style={{ width: 64, height: 64, objectFit: 'contain' }} />
    <div><div className="report-muted">Cell #{cell.cropId}</div><strong>{cell.studentLabel}</strong>{cell.submittedAt && <div className="report-muted">{new Date(cell.submittedAt).toLocaleString('ko-KR')}</div>}</div>
  </div>) : <p className="report-muted">아직 제출한 응답이 없습니다.</p>}</div>;
}

function TaskHistory({ task }) {
  const [open, setOpen] = useState(false);
  return <div><button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} disabled={!task.answeredCells}>
    {open ? '▾' : '▸'} Task #{task.taskId} · {task.filename} · {task.answeredCells}/{task.totalCells} answered
  </button>{open && <MyAnswers taskId={task.taskId} />}</div>;
}

export function MyLearningHistory() {
  const state = useLoad(studentHistoryApi.getHistory, 'history');
  const [filter, setFilter] = useState('all');
  const activities = state.data?.activities || [];
  const filtered = activities.filter(item => filter === 'all' || item.scopeType === filter);
  return <section>
    <div className="report-actions"><h3>Learning History</h3><button disabled={state.loading} onClick={state.retry}>Refresh</button></div>
    <p className="report-muted">응답한 과제·Task·진단평가의 진행 상태와 내가 선택한 답을 확인하세요. 공개된 채점 결과는 Results에서 볼 수 있습니다.</p>
    <div className="report-filters"><label>Type <select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All</option><option value="ASSIGNMENT">Assignments</option><option value="TASK">Tasks</option><option value="DIAGNOSTIC">Diagnostics</option></select></label>
      {state.data && <span className="report-muted">{activities.length} activities · {activities.reduce((sum, item) => sum + item.answeredCells, 0)} answered cells</span>}
    </div>
    <LoadStatus state={state} />
    {state.data && (filtered.length ? filtered.map(item => <details className="my-history-card" key={`${item.scopeType}-${item.scopeId}`}>
      <summary><strong>{item.title}</strong> <span className="report-status">{item.scopeType}</span> <span className={`report-status ${item.answeredCells === item.totalCells ? 'answered' : ''}`}>{item.answeredCells === item.totalCells ? 'Completed' : item.scopeType !== 'DIAGNOSTIC' && item.deadlineAt && new Date(item.deadlineAt).getTime() <= Date.now() ? 'Closed' : 'In progress'}</span><br />
        <span className="report-muted">{item.answeredCells}/{item.totalCells} answered{item.deadlineAt && item.scopeType !== 'DIAGNOSTIC' ? ` · Deadline: ${new Date(item.deadlineAt).toLocaleString('ko-KR')}` : ''}</span>
      </summary>
      <div className="my-history-tasks">{item.tasks.map(task => <TaskHistory key={task.taskId} task={task} />)}</div>
    </details>) : <p className="report-empty">{activities.length ? '해당 유형의 학습 기록이 없습니다.' : '아직 응답한 문제나 과제가 없습니다.'}</p>)}
  </section>;
}

export default function StudentMyPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('history');
  return <div className="my-page">
    <div className="my-page-header"><div><h2>My Page</h2><span>{user?.name || user?.username} · {user?.username} · Student</span></div><Link to="/student">← Task Dashboard</Link></div>
    <div className="my-page-tabs">{[['history', 'Learning History'], ['results', 'Results'], ['reports', 'My Reports']].map(([key, label]) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>
    {tab === 'history' && <MyLearningHistory />}
    {tab === 'results' && <StudentReviewPanel />}
    {tab === 'reports' && <ReportsPanel student />}
  </div>;
}
