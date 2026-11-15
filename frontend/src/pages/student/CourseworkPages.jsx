import { Link } from 'react-router-dom';
import Icon from '../../components/login/icons';
import AuthImage from '../../components/AuthImage';
import { useAuth } from '../../context/AuthContext';
import { imageUrl } from '../../constants';
import { deadlineInfo } from '../../utils/professorDashboard';
import { courseworkState, useStudentData } from './StudentData';

const BADGE_TONE = { indigo: ' is-indigo', amber: ' is-amber', emerald: ' is-emerald', closed: '' };

function speciesOf(item) {
  return [...new Set(item.tasks.map(task => task.speciesName).filter(Boolean))].join(', ');
}

function metaOf(item, state) {
  const kind = item.diagnostic ? '진단평가' : item.kind === 'assignment' ? `분류 실습 · 도말 ${item.tasks.length}장` : '분류 실습';
  const species = speciesOf(item);
  return `${kind}${species ? ` · ${species}` : ''} · ${state.total}문항`;
}

/** Finished or closed coursework opens its results; anything else opens the classification workspace. */
const targetOf = (item, state) => (state.openReview ? '/student/results' : item.path);

function ProgressBar({ state }) {
  return (
    <span className="prof-bar" role="progressbar" aria-label="응답 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.percent}>
      <span className={state.completed ? 'is-done' : ''} style={{ width: `${state.percent}%` }} />
    </span>
  );
}

function CourseworkCard({ item }) {
  const { progress } = useStudentData();
  const loaded = Boolean(progress[item.key]);
  const state = courseworkState(item, progress[item.key]);
  const due = deadlineInfo(item.deadlineAt);
  const accuracy = progress[item.key]?.accuracy;

  return (
    <Link to={targetOf(item, state)} className="prof-card stu-cw">
      {item.thumbnail ? (
        <AuthImage src={imageUrl.thumbnail(item.thumbnail)} fallbackSrc={imageUrl.original(item.thumbnail)} alt="" className="stu-cw__thumb" />
      ) : (
        <span className="stu-cw__thumb stu-cw__thumb--empty"><Icon name="microscope" size={26} /></span>
      )}
      <span className="stu-cw__body">
        <span className="stu-cw__top">
          <strong className="stu-cw__title">{item.title}</strong>
          {loaded && <span className={`prof-badge${BADGE_TONE[state.tone]}`}>{state.label}</span>}
        </span>
        <span className="stu-cw__meta">{loaded ? metaOf(item, state) : '불러오는 중…'}</span>
        <ProgressBar state={state} />
        <span className="stu-cw__foot prof-mono">
          <span>{state.solved} / {state.total}</span>
          <span className={`stu-cw__due is-${due.tone}`}>{due.label}{due.dateText && ` · ${due.dateText}`}</span>
        </span>
        {state.completed && accuracy != null && (
          <span className="stu-cw__score">정답률 <strong className="prof-mono">{accuracy}%</strong></span>
        )}
      </span>
    </Link>
  );
}

function CardGrid({ items, empty }) {
  if (!items.length) return <p className="prof-empty prof-empty--compact">{empty}</p>;
  return <div className="stu-cw-grid">{items.map(item => <CourseworkCard key={item.key} item={item} />)}</div>;
}

export function AssignmentsPage() {
  const { items, loading } = useStudentData();
  const diagnostics = items.filter(item => item.diagnostic);
  const assignments = items.filter(item => !item.diagnostic && item.kind === 'assignment');
  const singles = items.filter(item => !item.diagnostic && item.kind === 'task');

  return (
    <>
      <div className="prof-page-head">
        <div>
          <span className="prof-eyebrow prof-mono">과제</span>
          <h1>전체 과제</h1>
          <p>과제를 선택해 세포 분류를 진행하세요. 답안은 자동 저장되어 언제든 이어서 할 수 있습니다.</p>
        </div>
      </div>

      {loading ? <p role="status" className="prof-empty">과제를 불러오는 중…</p> : (
        <>
          <section className="stu-section" aria-labelledby="stu-diagnostics">
            <header className="stu-section__head">
              <h2 id="stu-diagnostics">진단평가</h2>
              <p className="prof-muted">학생 수준을 확인하는 과제입니다. 먼저 진단평가를 진행해주세요.</p>
            </header>
            <CardGrid items={diagnostics} empty="게시된 진단평가가 없습니다." />
          </section>

          <section className="stu-section" aria-labelledby="stu-practice">
            <header className="stu-section__head">
              <h2 id="stu-practice">분류 실습</h2>
              <p className="prof-muted">도말 이미지에서 감지된 세포를 분류합니다. 마감되거나 결과가 공개된 과제는 결과 화면으로 이동합니다.</p>
            </header>
            {!assignments.length && !singles.length && <p className="prof-empty prof-empty--compact">게시된 분류 실습이 없습니다.</p>}
            {assignments.length > 0 && <><h3 className="prof-subhead">과제 목록</h3><CardGrid items={assignments} /></>}
            {singles.length > 0 && <><h3 className="prof-subhead">개별 과제</h3><CardGrid items={singles} /></>}
          </section>
        </>
      )}
    </>
  );
}

const QUICK = [
  { to: '/student/results', icon: 'chart', tone: 'violet', title: '내 결과 분석/확인', text: '채점 결과와 오답을 확인합니다' },
  { to: '/student/questions', icon: 'help', tone: 'amber', title: '내 질문 관리', text: '보낸 질문·신고와 답변을 확인합니다' },
  { to: '/student/assignments/history', icon: 'history', tone: 'slate', title: '수행한 과제 목록', text: '응답한 과제와 내가 고른 답을 봅니다' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const { items, progress, loading } = useStudentData();
  const rows = items.filter(item => progress[item.key]).map(item => ({ item, state: courseworkState(item, progress[item.key]) }));
  const todo = rows.filter(row => row.state.todo)
    .sort((a, b) => (a.item.deadlineAt || '9999').localeCompare(b.item.deadlineAt || '9999'));
  const stats = [
    ['진행할 과제', todo.length],
    ['제출 필요', todo.filter(row => row.state.completed).length],
    ['최종 제출 완료', rows.filter(row => row.state.submitted).length],
    ['마감된 과제', rows.filter(row => row.state.expired).length],
  ];
  const ready = !loading && rows.length === items.length;

  return (
    <>
      <div className="prof-page-head">
        <div>
          <span className="prof-eyebrow prof-mono">학생</span>
          <h1>대시보드</h1>
          <p>{user?.name || user?.username}님, 진행할 과제와 학습 현황을 확인하세요.</p>
        </div>
        <Link to="/student/assignments" className="prof-btn prof-btn--primary"><Icon name="clipboard" size={16} />전체 과제 보기</Link>
      </div>

      <ul className="stu-stats">
        {stats.map(([label, value]) => (
          <li key={label} className="prof-card">
            <span className="prof-score__label">{label}</span>
            <strong className="prof-score__value prof-mono">{ready ? value : '–'}</strong>
          </li>
        ))}
      </ul>

      <div className="prof-dash">
        <div className="prof-dash__main">
          <section className="prof-card" aria-labelledby="stu-todo">
            <header className="prof-card__head"><h2 id="stu-todo"><Icon name="clock" size={17} />진행할 과제</h2></header>
            {!ready ? <p role="status" className="prof-empty">과제를 불러오는 중…</p> : !todo.length ? (
              <div className="prof-empty"><p>{items.length ? '모든 과제를 제출했습니다.' : '게시된 과제가 없습니다.'}</p></div>
            ) : (
              <ul className="stu-todo">
                {todo.map(({ item, state }) => {
                  const due = deadlineInfo(item.deadlineAt);
                  return (
                    <li key={item.key}>
                      <Link to={targetOf(item, state)} className="stu-todo__row">
                        <span className="stu-todo__title">
                          <strong>{item.title}</strong>
                          <small>{metaOf(item, state)}</small>
                        </span>
                        <span className="stu-todo__progress">
                          <span className="prof-mono"><strong>{state.solved}</strong>/{state.total} · {state.percent}%</span>
                          <ProgressBar state={state} />
                        </span>
                        <span className="prof-table__due">
                          <strong className={`is-${due.tone}`}>{due.label}</strong>
                          {due.dateText && <span className="prof-mono">{due.dateText}</span>}
                        </span>
                        <span className={`prof-badge${BADGE_TONE[state.tone]}`}>{state.label}</span>
                        <Icon name="chevronRight" size={16} className="prof-quick__arrow" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <footer className="prof-card__foot">
              <span className="prof-muted">답안은 자동 저장되며, 최종 제출 전까지 수정할 수 있습니다.</span>
              <Link to="/student/assignments" className="prof-link">과제 전체 보기 <Icon name="arrowRight" size={14} /></Link>
            </footer>
          </section>
        </div>

        <div className="prof-dash__side">
          <section className="prof-card" aria-labelledby="stu-quick">
            <header className="prof-card__head"><h2 id="stu-quick">바로가기</h2></header>
            <ul className="prof-quick">
              {QUICK.map(action => (
                <li key={action.to}>
                  <Link to={action.to} className="prof-quick__item">
                    <span className={`prof-quick__icon is-${action.tone}`}><Icon name={action.icon} size={17} /></span>
                    <span className="prof-quick__text"><strong>{action.title}</strong><small>{action.text}</small></span>
                    <Icon name="chevronRight" size={16} className="prof-quick__arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
