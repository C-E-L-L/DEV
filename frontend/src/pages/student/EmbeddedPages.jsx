// Existing student screens, shown inside the console frame. Their data and behaviour are unchanged.
import { useEffect, useState } from 'react';
import { studentHistoryApi } from '../../api/studentHistory';
import { imageUrl } from '../../constants';
import { answerLabel } from '../../utils/cellClasses';
import Icon from '../../components/login/icons';
import AuthImage from '../../components/AuthImage';
import ReportsPanel from '../../components/ReportsPanel';
import StudentReviewPanel from '../../components/StudentReviewPanel';

const SCOPE_LABEL = { ASSIGNMENT: '과제', TASK: '개별 과제', DIAGNOSTIC: '진단평가' };

function useLoad(load, dependency) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let canceled = false;
    setState({ loading: true, data: null, error: '' });
    load().then(({ data }) => { if (!canceled) setState({ loading: false, data, error: '' }); })
      .catch(() => { if (!canceled) setState({ loading: false, data: null, error: '기록을 불러오지 못했습니다.' }); });
    return () => { canceled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency, version]);
  return { ...state, retry: () => setVersion(value => value + 1) };
}

function LoadStatus({ state }) {
  if (state.loading) return <p role="status" className="prof-empty prof-empty--compact">불러오는 중…</p>;
  if (state.error) return <div role="alert" className="prof-alert"><span>{state.error}</span><button type="button" className="prof-btn" onClick={state.retry}>다시 시도</button></div>;
  return null;
}

function MyAnswers({ taskId }) {
  const state = useLoad(() => studentHistoryApi.getAnswers(taskId), taskId);
  if (!state.data) return <LoadStatus state={state} />;
  if (!state.data.length) return <p className="prof-muted">아직 제출한 응답이 없습니다.</p>;
  return (
    <ul className="stu-history__cells">
      {state.data.map(cell => (
        <li key={cell.cropId}>
          <AuthImage src={imageUrl.crop(cell.cropFilename)} alt="" className="stu-history__crop" />
          <span>
            <small className="prof-mono">Cell #{cell.cropId}</small>
            <strong>{answerLabel(cell.studentLabel)}</strong>
            {cell.submittedAt && <small>{new Date(cell.submittedAt).toLocaleString('ko-KR')}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TaskHistory({ task }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="stu-history__task">
      <button type="button" className="stu-history__toggle" aria-expanded={open} onClick={() => setOpen(value => !value)} disabled={!task.answeredCells}>
        <Icon name="chevronDown" size={14} className={`prof-nav__chevron${open ? ' is-open' : ''}`} />
        <span className="stu-history__file">{task.filename || `Task #${task.taskId}`}</span>
        <span className="prof-mono">{task.answeredCells}/{task.totalCells}</span>
      </button>
      {open && <MyAnswers taskId={task.taskId} />}
    </div>
  );
}

function historyStatus(item) {
  if (item.answeredCells === item.totalCells) return ['응답 완료', ' is-emerald'];
  const closed = item.scopeType !== 'DIAGNOSTIC' && item.deadlineAt && new Date(item.deadlineAt).getTime() <= Date.now();
  return closed ? ['마감', ''] : ['진행 중', ' is-indigo'];
}

export function HistoryPage() {
  const state = useLoad(studentHistoryApi.getHistory, 'history');
  const [filter, setFilter] = useState('all');
  const activities = state.data?.activities || [];
  const filtered = activities.filter(item => filter === 'all' || item.scopeType === filter);

  return (
    <>
      <div className="prof-page-head">
        <div>
          <span className="prof-eyebrow prof-mono">과제</span>
          <h1>수행한 과제 목록</h1>
          <p>응답한 과제·진단평가의 진행 상태와 내가 선택한 답을 확인하세요. 공개된 채점 결과는 내 결과 분석/확인에서 볼 수 있습니다.</p>
        </div>
        <button type="button" className="prof-btn" disabled={state.loading} onClick={state.retry}><Icon name="refresh" size={15} />새로고침</button>
      </div>

      <section className="prof-card" aria-label="수행한 과제">
        <header className="prof-card__head">
          <div className="prof-tabs" role="group" aria-label="유형 필터">
            {[['all', '전체'], ['ASSIGNMENT', '과제'], ['TASK', '개별 과제'], ['DIAGNOSTIC', '진단평가']].map(([key, label]) => (
              <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
            ))}
          </div>
          {state.data && <span className="prof-muted prof-mono">{activities.length}개 과제 · 응답 {activities.reduce((sum, item) => sum + item.answeredCells, 0)}개</span>}
        </header>
        {!state.data ? <div className="prof-card__body"><LoadStatus state={state} /></div> : !filtered.length ? (
          <p className="prof-empty">{activities.length ? '해당 유형의 학습 기록이 없습니다.' : '아직 응답한 문제나 과제가 없습니다.'}</p>
        ) : (
          <ul className="stu-history">
            {filtered.map(item => {
              const [label, tone] = historyStatus(item);
              return (
                <li key={`${item.scopeType}-${item.scopeId}`}>
                  <details>
                    <summary>
                      <Icon name="chevronDown" size={15} className="stu-history__chevron" />
                      <span className="stu-history__title">
                        <strong>{item.title}</strong>
                        <small>{SCOPE_LABEL[item.scopeType] || item.scopeType} · <span className="prof-mono">{item.answeredCells}/{item.totalCells}</span> 응답
                          {item.deadlineAt && item.scopeType !== 'DIAGNOSTIC' ? ` · 마감 ${new Date(item.deadlineAt).toLocaleString('ko-KR')}` : ''}</small>
                      </span>
                      <span className={`prof-badge${tone}`}>{label}</span>
                    </summary>
                    <div className="stu-history__tasks">{item.tasks.map(task => <TaskHistory key={task.taskId} task={task} />)}</div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

export function ResultsPage() {
  return (
    <>
      <div className="prof-page-head">
        <div>
          <span className="prof-eyebrow prof-mono">마이페이지</span>
          <h1>내 결과 분석/확인</h1>
          <p>완료되거나 마감된 과제에서 내 응답과 확정된 정답을 비교하세요.</p>
        </div>
      </div>
      <div className="stu-embedded"><StudentReviewPanel /></div>
    </>
  );
}

export function QuestionsPage() {
  return <div className="professor-workspace prof-embedded stu-embedded"><ReportsPanel student /></div>;
}
