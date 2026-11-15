import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/login/icons';
import AuthImage from '../../components/AuthImage';
import { useAuth } from '../../context/AuthContext';
import { submissionApi } from '../../api';
import { imageUrl } from '../../constants';
import { deadlineInfo, relativeTime } from '../../utils/professorDashboard';
import {
  accuracyTrend, activityFeed, confusionPairs, displayLabel, matchesPair, todoSummary, wrongCells,
} from '../../utils/studentDashboard';
import { courseworkState, useStudentData } from './StudentData';

/* ---------- Shared pieces ---------- */

const STATUS_BADGE = { indigo: ' is-indigo', amber: ' is-amber', emerald: ' is-emerald', closed: '' };
const shortSpecies = name => (name || '').replace(/\s*\(.*\)\s*$/, '');

function metaOf(item, state) {
  const species = [...new Set(item.tasks.map(task => shortSpecies(task.speciesName)).filter(Boolean))].join(', ');
  const smears = item.diagnostic ? null : `도말 ${item.tasks.length}장`;
  return [species, smears, `${state.total}문항`].filter(Boolean).join(' · ');
}

/** What the student does next with a coursework, and where that happens. */
function nextStep(item, state) {
  if (state.openReview) return { label: '결과 보기', to: resultsLink(item), tone: '' };
  if (state.submitted) return { label: '답안 보기', to: item.path, tone: '' };
  if (state.completed) return { label: '최종 제출하기', to: item.path, tone: ' stu-btn--amber', icon: 'send' };
  if (state.solved > 0) return { label: '이어하기', to: item.path, tone: ' prof-btn--primary', icon: 'arrowRight' };
  return { label: '학습 시작', to: item.path, tone: '', icon: 'play' };
}

/** Status shown next to the coursework type. Not started reads as plain text, like the design. */
function statusOf(state) {
  if (state.expired) return [null, '']; // the deadline badge already says it is closed
  if (state.submitted) return ['최종 제출 완료', ' is-emerald'];
  if (state.completed) return ['응답 완료', ' is-emerald'];
  if (state.solved > 0) return ['응답 중', ' is-amber'];
  return ['시작 전', ''];
}

const reviewKey = review => `${review.scopeType}-${review.scopeId}`;
const scopeOf = item => `${item.diagnostic ? 'DIAGNOSTIC' : item.kind === 'assignment' ? 'ASSIGNMENT' : 'TASK'}-${item.id}`;
function resultsLink(item) { return `/student/results?review=${scopeOf(item)}`; }

function useLoad(load, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: false });
  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, data: null, error: false });
    load().then(({ data }) => { if (!cancelled) setState({ loading: false, data, error: false }); })
      .catch(() => { if (!cancelled) setState({ loading: false, data: null, error: true }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

/**
 * One coursework, the same on the dashboard and in the coursework list.
 * `featured`: the coursework to do first (tinted).
 */
function CourseworkRow({ item, featured = false }) {
  const { progress } = useStudentData();
  const loaded = Boolean(progress[item.key]);
  const state = courseworkState(item, progress[item.key]);
  const due = deadlineInfo(item.deadlineAt);
  const step = nextStep(item, state);
  const [status, statusTone] = statusOf(state);
  const left = state.total - state.solved;
  const accuracy = progress[item.key]?.accuracy;

  return (
    <li className={`stu-row${featured ? ' is-featured' : ''}${state.completed ? ' is-complete' : ''}`}>
      {item.thumbnail ? (
        <AuthImage src={imageUrl.thumbnail(item.thumbnail)} fallbackSrc={imageUrl.original(item.thumbnail)} alt="" className="stu-row__thumb" />
      ) : (
        <span className="stu-row__thumb stu-row__thumb--empty"><Icon name="microscope" size={20} /></span>
      )}
      <div className="stu-row__main">
        <div className="stu-row__tags">
          <span className={`prof-badge prof-mono stu-due-badge is-${due.tone}`} title={due.dateText ? `마감 ${due.dateText}` : undefined}>
            {due.tone === 'none' ? '마감 없음' : due.label}
          </span>
          <span className="prof-badge">{item.diagnostic ? '진단평가' : '과제'}</span>
          {loaded && status && <span className={`prof-badge${statusTone}`}>{status}</span>}
        </div>
        <h3 className="stu-row__title"><Link to={step.to}>{item.title}</Link></h3>
        <p className="stu-row__meta">
          {loaded ? metaOf(item, state) : '불러오는 중…'}
          {due.dateText && <span className="prof-mono"> · {due.dateText} 마감</span>}
        </p>
        <div className="stu-row__progress prof-mono">
          <span>{state.completed ? `${state.solved} / ${state.total} 완료` : `응답 ${state.solved} / ${state.total}`}</span>
          {state.completed
            ? (accuracy != null ? <span className="stu-row__score">정답률 {accuracy}%</span> : <span className="is-muted">남은 세포 0</span>)
            : <span className={left > 0 && state.solved > 0 ? 'is-left' : 'is-muted'}>남은 세포 {left}</span>}
        </div>
        <span className="prof-bar" role="progressbar" aria-label="응답 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.percent}>
          <span className={state.completed ? 'is-done' : ''} style={{ width: `${state.percent}%` }} />
        </span>
      </div>
      <Link to={step.to} className={`prof-btn stu-row__action${step.tone}`}>
        {loaded ? step.label : '열기'}{step.icon && <Icon name={step.icon} size={14} />}
      </Link>
    </li>
  );
}

function RowList({ items, empty, featureFirst = false }) {
  if (!items.length) return <div className="prof-empty">{empty}</div>;
  return <ul className="stu-rows">{items.map((item, index) => <CourseworkRow key={item.key} item={item} featured={featureFirst && index === 0} />)}</ul>;
}

const byDeadline = (a, b) => (a.deadlineAt || '9999').localeCompare(b.deadlineAt || '9999') || a.title.localeCompare(b.title, 'ko');

/* ---------- Coursework list ---------- */

export function AssignmentsPage() {
  const { items, loading } = useStudentData();
  const diagnostics = items.filter(item => item.diagnostic);
  const practice = items.filter(item => !item.diagnostic).sort(byDeadline);

  return (
    <>
      <div className="prof-page-head">
        <div>
          <span className="prof-eyebrow prof-mono">과제</span>
          <h1>전체 과제 관리</h1>
          <p>과제를 선택해 세포 분류를 진행하세요. 답안은 자동 저장되어 언제든 이어서 할 수 있습니다.</p>
        </div>
      </div>

      {loading ? <p role="status" className="prof-empty">과제를 불러오는 중…</p> : (
        <>
          <section className="prof-card" aria-labelledby="stu-diagnostics">
            <header className="prof-card__head">
              <h2 id="stu-diagnostics"><Icon name="crosshair" size={17} />진단평가</h2>
              <span className="prof-muted">학생 수준을 확인하는 과제입니다. 먼저 진행해주세요.</span>
            </header>
            <RowList items={diagnostics} empty="게시된 진단평가가 없습니다." />
          </section>

          <section className="prof-card" aria-labelledby="stu-practice">
            <header className="prof-card__head">
              <h2 id="stu-practice"><Icon name="clipboard" size={17} />과제</h2>
              <span className="prof-muted">마감되거나 결과가 공개된 과제는 결과 화면으로 이동합니다.</span>
            </header>
            <RowList items={practice} empty="게시된 과제가 없습니다." />
          </section>
        </>
      )}
    </>
  );
}

/* ---------- Dashboard ---------- */

function Summary({ summary, rows }) {
  const firstToSubmit = rows.find(row => row.state.todo && row.state.completed && !row.state.submitted);
  const parts = [
    { key: 'active', label: '진행 중', count: summary.active, to: '/student/assignments' },
    { key: 'dueSoon', label: '마감 임박', count: summary.dueSoon, to: '/student/assignments', tone: 'is-urgent' },
    { key: 'toSubmit', label: '제출 필요', count: summary.toSubmit, to: firstToSubmit?.item.path || '/student/assignments', tone: 'is-warn' },
    { key: 'newReplies', label: '새 답변', count: summary.newReplies, to: '/student/questions' },
  ].filter(part => part.count > 0);
  if (!parts.length) return <p className="stu-summary">오늘 할 일을 모두 마쳤어요.</p>;
  return (
    <p className="stu-summary">
      {parts.map(part => (
        <Link key={part.key} to={part.to} className="stu-summary__item">
          {part.label} <strong className={`prof-mono ${part.tone || ''}`}>{part.count}</strong>건
        </Link>
      ))}
    </p>
  );
}

function ContinueButton({ rows }) {
  const next = rows.filter(row => row.state.todo).sort((a, b) => byDeadline(a.item, b.item))[0];
  if (!next) return <Link to="/student/assignments" className="prof-btn stu-head__cta"><Icon name="clipboard" size={15} />전체 과제 보기</Link>;
  const { item, state } = next;
  const step = nextStep(item, state);
  const left = state.total - state.solved;
  const text = state.completed ? `최종 제출하기 · ${item.title}` : `${step.label} · ${item.title}${left > 0 ? ` · 남은 세포 ${left}개` : ''}`;
  return (
    <Link to={item.path} className="prof-btn prof-btn--primary stu-head__cta" title={text}>
      <Icon name="play" size={15} /><span>{text}</span>
    </Link>
  );
}

function Sparkline({ points, titleOf }) {
  if (points.length < 2) return null;
  const width = 240;
  const height = 64;
  const pad = 6;
  const x = index => pad + (index * (width - pad * 2)) / (points.length - 1);
  const y = value => height - pad - (value / 100) * (height - pad * 2);
  const line = points.map((point, index) => `${x(index)},${y(point.accuracy)}`).join(' ');
  return (
    <svg className="stu-spark" viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={`과제별 정답률: ${points.map(point => `${titleOf(point.review)} ${point.accuracy}%`).join(', ')}`}>
      <polygon className="stu-spark__area" points={`${x(0)},${height - pad} ${line} ${x(points.length - 1)},${height - pad}`} />
      <polyline className="stu-spark__line" points={line} />
      {points.map((point, index) => (
        <circle key={index} className={`stu-spark__dot${index === points.length - 1 ? ' is-last' : ''}`} cx={x(index)} cy={y(point.accuracy)} r="3.5">
          <title>{titleOf(point.review)}: {point.accuracy}%</title>
        </circle>
      ))}
    </svg>
  );
}

function reviewStatus(review) {
  if (review.pendingAnswers > 0) return [`채점 대기 ${review.pendingAnswers}`, ' is-amber'];
  if (review.availabilityReason === 'DEADLINE_PASSED') return ['마감', ''];
  return ['채점 완료', ''];
}

function ResultsCard({ reviews, titleOf }) {
  const list = reviews.data?.reviews || [];
  const trend = accuracyTrend(list);
  return (
    <section className="prof-card stu-card--results" aria-labelledby="stu-results">
      <header className="prof-card__head">
        <h2 id="stu-results"><Icon name="award" size={17} />최근 학습 성취</h2>
        <Link to="/student/results" className="prof-link">내 결과 분석/확인 <Icon name="arrowRight" size={14} /></Link>
      </header>
      {reviews.loading ? <p role="status" className="prof-empty prof-empty--compact">학습 결과를 불러오는 중…</p>
        : reviews.error ? <p role="alert" className="prof-empty prof-empty--compact">학습 결과를 불러오지 못했습니다.</p>
          : !list.length ? <p className="prof-empty prof-empty--compact">최종 제출 후 채점이 끝나면 결과가 표시됩니다.</p> : (
            <>
              {trend.overall != null && (
                <div className="stu-trend">
                  <div className="stu-trend__value">
                    <span className="prof-score__label">전체 정답률</span>
                    <span className="stu-trend__line">
                      <strong className="prof-score__value prof-mono">{trend.overall}%</strong>
                      {trend.delta != null && trend.delta !== 0 && (
                        <span className={`prof-badge ${trend.delta > 0 ? 'is-emerald' : 'stu-badge-rose'}`}>
                          직전 과제 대비 {trend.delta > 0 ? '+' : ''}{trend.delta}%p
                        </span>
                      )}
                    </span>
                  </div>
                  <Sparkline points={trend.points} titleOf={titleOf} />
                </div>
              )}
              <div className="prof-table-wrap">
                <table className="prof-table prof-table--stack stu-results-table">
                  <thead>
                    <tr><th scope="col">과제명</th><th scope="col">정답 / 오답</th><th scope="col">상태</th><th scope="col" className="is-right">정답률</th><th scope="col" className="is-right"><span className="prof-sr">결과</span></th></tr>
                  </thead>
                  <tbody>
                    {list.slice(0, 5).map(review => {
                      const [label, tone] = reviewStatus(review);
                      const link = `/student/results?review=${reviewKey(review)}${review.wrong > 0 ? '&focus=wrong' : ''}`;
                      return (
                        <tr key={reviewKey(review)}>
                          <td className="prof-table__title"><Link to={`/student/results?review=${reviewKey(review)}`}>{titleOf(review)}</Link></td>
                          <td className="prof-mono"><span className="stu-correct">{review.correct}</span> / <span className="stu-wrong">{review.wrong}</span></td>
                          <td><span className={`prof-badge${tone}`}>{label}</span></td>
                          <td className="is-right prof-mono"><strong>{review.accuracy == null ? '–' : `${review.accuracy}%`}</strong></td>
                          <td className="is-right"><Link to={link} className={review.wrong > 0 ? 'prof-link' : 'stu-link-muted'}>{review.wrong > 0 ? '오답 보기' : '결과 확인'}</Link></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
    </section>
  );
}

/** Graded wrong answers as cell pictures: the student's answer, struck through, and the correct one. */
function WrongNotes({ reviews, titleOf }) {
  const [pair, setPair] = useState(null);
  const wrong = wrongCells(reviews.data?.reviews);
  const pairs = confusionPairs(wrong).filter(entry => entry.count > 1).slice(0, 3);
  const shown = wrong.filter(({ cell }) => matchesPair(cell, pair)).slice(0, 6);

  return (
    <section className="prof-card stu-card--wrong" aria-labelledby="stu-wrong">
      <header className="prof-card__head">
        <h2 id="stu-wrong"><Icon name="book" size={17} />오답 노트</h2>
        <Link to="/student/results?view=wrong" className="prof-link">전체 보기 <Icon name="arrowRight" size={14} /></Link>
      </header>
      {reviews.loading ? <p role="status" className="prof-empty prof-empty--compact">불러오는 중…</p>
        : !wrong.length ? (
          <div className="prof-empty prof-empty--compact">
            <Icon name="microscope" size={22} />
            <p>아직 틀린 세포가 없어요. 채점이 끝나면 여기에서 다시 볼 수 있어요.</p>
          </div>
        ) : (
          <div className="prof-card__body stu-wrong">
            {pairs.length > 0 && (
              <div className="prof-tabs stu-wrong__filters" role="group" aria-label="자주 헷갈린 조합">
                <button type="button" aria-pressed={!pair} onClick={() => setPair(null)}>전체 <span className="prof-mono">{wrong.length}</span></button>
                {pairs.map(entry => (
                  <button key={entry.key} type="button" aria-pressed={pair === entry.key} onClick={() => setPair(current => (current === entry.key ? null : entry.key))}
                    title={`정답 ${displayLabel(entry.correct)}을(를) ${displayLabel(entry.answer)}(으)로 답한 경우`}>
                    {displayLabel(entry.answer)}→{displayLabel(entry.correct)} <span className="prof-mono">{entry.count}</span>
                  </button>
                ))}
              </div>
            )}
            <ul className="stu-wrong__grid">
              {shown.map(({ review, cell }) => (
                <li key={`${reviewKey(review)}-${cell.cropId}`}>
                  <Link to={`/student/results?review=${reviewKey(review)}&cell=${cell.cropId}`} className="stu-wrong__cell"
                    title={`${titleOf(review)} · 내 답 ${displayLabel(cell.studentLabel)} → 정답 ${cell.correctLabel}`}>
                    <AuthImage src={imageUrl.crop(cell.cropFilename)} alt={`정답 ${cell.correctLabel}인 세포`} className="stu-wrong__image" />
                    <span className="stu-wrong__answer"><s>{displayLabel(cell.studentLabel)}</s> →</span>
                    <strong className="stu-wrong__correct">{cell.correctLabel}</strong>
                    <small className="stu-wrong__source">{titleOf(review)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
    </section>
  );
}

const ACTIVITY = {
  reply: { icon: 'mail', title: event => `${event.author || '교수'} 교수 답변 등록`, text: event => event.text },
  question: { icon: 'help', title: () => '내 질문 접수', text: event => event.text },
  published: { icon: 'clipboard', title: () => '새 과제 게시', text: event => `${event.title} 과제가 등록되었습니다.` },
  due: { icon: 'alarm', title: () => '마감 임박', text: event => (event.days > 0 ? `${event.title} 마감까지 ${event.days}일 남았습니다.` : `${event.title} 오늘 마감입니다.`) },
};

function ActivityCard({ rows }) {
  const { reports } = useStudentData();
  const feed = activityFeed({ rows, reports });
  return (
    <section className="prof-card stu-card--activity" aria-labelledby="stu-activity">
      <header className="prof-card__head">
        <h2 id="stu-activity"><Icon name="history" size={17} />최근 활동</h2>
        <Link to="/student/questions" className="prof-link">내 질문 관리 <Icon name="arrowRight" size={14} /></Link>
      </header>
      {!feed.length ? <p className="prof-empty prof-empty--compact">아직 활동이 없습니다.</p> : (
        <ul className="prof-activity">
          {feed.map(event => {
            const kind = ACTIVITY[event.type];
            const tone = event.type === 'reply' ? ' is-indigo' : event.type === 'due' ? ' stu-activity--due' : '';
            return (
              <li key={event.key}>
                <Link to={event.to} className="prof-activity__item">
                  <span className={`prof-activity__icon${tone}`}><Icon name={kind.icon} size={14} /></span>
                  <span className="prof-activity__body">
                    <span className={`prof-activity__text stu-activity__title${tone}`}><strong>{kind.title(event)}</strong></span>
                    <span className="prof-activity__detail stu-activity__detail">{kind.text(event)}</span>
                    <span className="prof-activity__time">{relativeTime(event.at)}</span>
                  </span>
                  {event.fresh && <span className="prof-activity__dot" title="최근 7일 이내 답변" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { items, progress, loading, reports } = useStudentData();
  const reviews = useLoad(() => submissionApi.getMyReviews());
  // Wait for every coursework before choosing what to show, so the list and the button do not jump.
  const ready = !loading && items.every(item => progress[item.key]);
  const rows = ready ? items.map(item => ({ item, state: courseworkState(item, progress[item.key]) })) : [];
  const todo = rows.filter(row => row.state.todo).map(row => row.item).sort(byDeadline);
  const titleOf = review => {
    const match = items.find(item => scopeOf(item) === reviewKey(review));
    return match?.title || review.title;
  };

  return (
    <>
      <section className="prof-card stu-head">
        <div className="stu-head__text">
          <span className="prof-eyebrow prof-mono">학생</span>
          <h1>대시보드</h1>
          <p className="prof-muted">안녕하세요, {user?.name || user?.username}님. 오늘 할 일을 확인하세요.</p>
          {ready && <Summary summary={todoSummary(rows, reports)} rows={rows} />}
        </div>
        {ready && <ContinueButton rows={rows} />}
      </section>

      <div className="prof-dash stu-dash">
        <div className="prof-dash__main">
          <section className="prof-card stu-card--todo" aria-labelledby="stu-todo">
            <header className="prof-card__head">
              <h2 id="stu-todo"><Icon name="clock" size={17} />진행 중 과제 {ready && <span className="prof-nav__badge prof-mono is-strong">{todo.length}</span>}</h2>
              <Link to="/student/assignments" className="prof-link">전체 과제 관리 <Icon name="arrowRight" size={14} /></Link>
            </header>
            {!ready ? <p role="status" className="prof-empty">과제를 불러오는 중…</p>
              : <RowList items={todo.slice(0, 3)} featureFirst empty={items.length ? '진행할 과제를 모두 제출했어요.' : '게시된 과제가 없습니다.'} />}
            {ready && todo.length > 3 && (
              <footer className="prof-card__foot">
                <span className="prof-muted">마감이 가까운 순으로 3개만 보여줍니다.</span>
                <Link to="/student/assignments" className="prof-link">나머지 {todo.length - 3}개 보기 <Icon name="arrowRight" size={14} /></Link>
              </footer>
            )}
          </section>
          <ResultsCard reviews={reviews} titleOf={titleOf} />
        </div>
        <div className="prof-dash__side">
          <WrongNotes reviews={reviews} titleOf={titleOf} />
          <ActivityCard rows={rows} />
        </div>
      </div>
    </>
  );
}
