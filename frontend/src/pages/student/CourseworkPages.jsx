import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/login/icons';
import AuthImage from '../../components/AuthImage';
import Announcements from '../../components/Announcements';
import { submissionApi } from '../../api';
import { imageUrl } from '../../constants';
import { deadlineInfo } from '../../utils/professorDashboard';
import {
  accuracyTrend, activityFeed, byNewestPublished, confusionPairs, COURSEWORK_STAGES, courseworkStage, displayLabel,
  matchesCourseworkStatus, matchesPair, wrongCells,
} from '../../utils/studentDashboard';
import StudentActivityList from './StudentActivity';
import { courseworkState, useStudentData } from './StudentData';

/* ---------- Shared pieces ---------- */

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
      </div>
      {/* Progress sits beside the title, before the action, as a compact column. */}
      <div className="stu-row__progress">
        <div className="stu-row__progress-text prof-mono">
          <span>{state.completed ? `${state.solved} / ${state.total} 완료` : `응답 ${state.solved} / ${state.total}`}</span>
          {state.completed
            ? (accuracy != null ? <span className="stu-row__score">정답률 {accuracy}%</span> : <span className="is-muted">남은 세포 0</span>)
            : <span className={left > 0 && state.solved > 0 ? 'is-left' : 'is-muted'}>남은 세포 {left}</span>}
        </div>
        <span className="prof-bar stu-row__bar" role="progressbar" aria-label="응답 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.percent}>
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

const STAGES = {
  ongoing: { tab: '진행 중', title: '진행 중 과제', icon: 'clock', empty: '진행 중인', note: '마감 전이며 아직 최종 제출하지 않은 과제입니다. 최근에 게시된 순으로 표시합니다.' },
  submitted: { tab: '제출 완료', title: '제출 완료 과제', icon: 'send', empty: '제출 완료한', note: '최종 제출했고 채점 결과를 기다리는 과제입니다. 제출한 답안을 확인할 수 있습니다.' },
  graded: { tab: '채점 완료', title: '채점 완료 과제', icon: 'checkCircle', empty: '채점 완료된', note: '결과가 공개된 과제입니다. 마감된 과제도 여기에 표시됩니다.' },
};
const GROUPS = [
  { key: 'diagnostic', label: '진단평가', icon: 'crosshair', match: item => item.diagnostic },
  { key: 'practice', label: '분류 과제', icon: 'clipboard', match: item => !item.diagnostic },
];
const GROUPS_KEY = 'cell-student-assignment-groups';
// Links made before the page was merged (?status=) still open the matching tab.
const LEGACY_STATUS = { ongoing: 'ongoing', completed: 'submitted' };
const tabId = stage => `stu-assign-tab-${stage}`;

function readGroups() {
  try { return JSON.parse(window.localStorage.getItem(GROUPS_KEY)) || {}; } catch { return {}; }
}

function StageGroup({ stage, group, items, open, onToggle }) {
  const panel = `stu-assign-${stage}-${group.key}`;
  return (
    <div className="stu-assign__group">
      <button type="button" className="stu-assign__group-head" aria-expanded={open} aria-controls={panel} onClick={onToggle}>
        <Icon name={group.icon} size={15} />
        <span className="stu-assign__group-label">{group.label}</span>
        <span className="prof-nav__badge prof-mono">{items.length}</span>
        <Icon name="chevronDown" size={14} className={`stu-assign__chevron${open ? ' is-open' : ''}`} />
      </button>
      {open && (
        <div id={panel}>
          {items.length ? <RowList items={items} /> : <p className="stu-assign__empty">{STAGES[stage].empty} {group.label}가 없습니다.</p>}
        </div>
      )}
    </div>
  );
}

export function AssignmentsPage() {
  const { rows, ready } = useStudentData();
  const [params, setParams] = useSearchParams();
  const tabs = useRef({});
  const [openGroups, setOpenGroups] = useState(readGroups);
  // The selected tab lives in the address (?tab=), so dashboard links and reloads open the same tab.
  const active = COURSEWORK_STAGES.includes(params.get('tab')) ? params.get('tab') : LEGACY_STATUS[params.get('status')] || 'ongoing';
  const select = stage => setParams({ tab: stage }, { replace: true });

  useEffect(() => {
    try { window.localStorage.setItem(GROUPS_KEY, JSON.stringify(openGroups)); } catch { /* not persisted */ }
  }, [openGroups]);

  // Arrow keys, Home and End move between the tabs, as in a standard tab list.
  const onTabKey = event => {
    const index = COURSEWORK_STAGES.indexOf(active);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: COURSEWORK_STAGES.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const stage = COURSEWORK_STAGES[(next + COURSEWORK_STAGES.length) % COURSEWORK_STAGES.length];
    select(stage);
    tabs.current[stage]?.focus();
  };

  const byStage = Object.fromEntries(COURSEWORK_STAGES.map(stage => [stage,
    rows.filter(row => courseworkStage(row.state) === stage).map(row => row.item).sort(byNewestPublished)]));

  return (
    <>
      <div className="prof-page-head">
        <div>
          <span className="prof-eyebrow prof-mono">과제</span>
          <h1>과제</h1>
          <p>진행 중, 제출 완료, 채점 완료 탭으로 과제를 확인하세요. 답안은 자동 저장되어 언제든 이어서 할 수 있습니다.</p>
        </div>
      </div>

      <Announcements />

      {!ready ? <p role="status" className="prof-empty">과제를 불러오는 중…</p> : (
        <>
          <div className="stu-assign__bar">
            <div className="prof-tabs stu-assign__tabs" role="tablist" aria-label="과제 상태" onKeyDown={onTabKey}>
              {COURSEWORK_STAGES.map(stage => (
                <button key={stage} type="button" role="tab" id={tabId(stage)} ref={node => { tabs.current[stage] = node; }}
                  aria-selected={active === stage} aria-controls="stu-assign-panel" tabIndex={active === stage ? 0 : -1} onClick={() => select(stage)}>
                  {STAGES[stage].tab}<span className="prof-mono">{byStage[stage].length}</span>
                </button>
              ))}
            </div>
          </div>

          <section id="stu-assign-panel" role="tabpanel" className="prof-card stu-assign__section" aria-labelledby={tabId(active)}>
            <header className="prof-card__head">
              <h2>
                <Icon name={STAGES[active].icon} size={17} />{STAGES[active].title}
                <span className="prof-nav__badge prof-mono is-strong">{byStage[active].length}</span>
              </h2>
              <span className="prof-muted">{STAGES[active].note}</span>
            </header>
            {GROUPS.map(group => {
              const key = `${active}-${group.key}`;
              return (
                <StageGroup key={key} stage={active} group={group} items={byStage[active].filter(group.match)}
                  open={openGroups[key] !== false}
                  onToggle={() => setOpenGroups(current => ({ ...current, [key]: current[key] === false }))} />
              );
            })}
          </section>
        </>
      )}
    </>
  );
}

/* ---------- Dashboard ---------- */

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
        <StudentActivityList events={feed} />
      )}
    </section>
  );
}

export function DashboardPage() {
  const { items, rows, counts, ready } = useStudentData();
  const reviews = useLoad(() => submissionApi.getMyReviews());
  const todo = rows.filter(row => matchesCourseworkStatus(row.state, 'ongoing')).map(row => row.item).sort(byDeadline);
  const completed = rows.filter(row => matchesCourseworkStatus(row.state, 'completed')).map(row => row.item)
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || '') || b.id - a.id);
  // Completed work is split into two tabs on the coursework page; open the one that has something.
  const completedLink = `/student/assignments?tab=${counts.submitted ? 'submitted' : 'graded'}`;
  const titleOf = review => {
    const match = items.find(item => scopeOf(item) === reviewKey(review));
    return match?.title || review.title;
  };

  return (
    <>
      <h1 className="prof-sr">학생 대시보드</h1>
      <Announcements />

      <div className="prof-dash stu-dash">
        <div className="prof-dash__main">
          <section className="prof-card stu-card--todo" aria-labelledby="stu-todo">
            <header className="prof-card__head">
              <h2 id="stu-todo"><Icon name="clock" size={17} />진행 중 과제 {ready && <span className="prof-nav__badge prof-mono is-strong">{todo.length}</span>}</h2>
              <Link to="/student/assignments?tab=ongoing" className="prof-link">전체 보기 <Icon name="arrowRight" size={14} /></Link>
            </header>
            {!ready ? <p role="status" className="prof-empty">과제를 불러오는 중…</p>
              : <RowList items={todo.slice(0, 3)} featureFirst empty={items.length ? '진행할 과제를 모두 제출했어요.' : '게시된 과제가 없습니다.'} />}
            {ready && todo.length > 3 && (
              <footer className="prof-card__foot">
                <span className="prof-muted">마감이 가까운 순으로 3개만 보여줍니다.</span>
                <Link to="/student/assignments?tab=ongoing" className="prof-link">나머지 {todo.length - 3}개 보기 <Icon name="arrowRight" size={14} /></Link>
              </footer>
            )}
          </section>
          <section className="prof-card stu-card--completed" aria-labelledby="stu-completed">
            <header className="prof-card__head">
              <h2 id="stu-completed"><Icon name="checkCircle" size={17} />완료된 과제 {ready && <span className="prof-nav__badge prof-mono is-strong">{completed.length}</span>}</h2>
              <Link to={completedLink} className="prof-link">전체 보기 <Icon name="arrowRight" size={14} /></Link>
            </header>
            {!ready ? <p role="status" className="prof-empty">과제를 불러오는 중…</p>
              : <RowList items={completed.slice(0, 3)} empty="아직 최종 제출한 과제가 없습니다." />}
            <footer className="prof-card__foot">
              <span className="prof-muted">최종 제출한 과제입니다. 공개된 결과 또는 제출한 답안을 확인하세요.</span>
              {ready && completed.length > 3 && <Link to={completedLink} className="prof-link">나머지 {completed.length - 3}개 보기 <Icon name="arrowRight" size={14} /></Link>}
            </footer>
          </section>
          <ResultsCard reviews={reviews} titleOf={titleOf} />
        </div>
        <div className="prof-dash__side">
          <WrongNotes reviews={reviews} titleOf={titleOf} />
          <ActivityCard rows={ready ? rows : []} />
        </div>
      </div>
    </>
  );
}
