import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Icon from '../../components/login/icons';
import { professorApi } from '../../api/professor';
import { isDiagnostic } from '../../utils/coursework';
import {
  classAccuracy, courseworkDeadline, courseworkPhase, courseworkTitle, deadlineInfo,
  pendingLabelCount, studentLabel, submissionSummary,
} from '../../utils/professorDashboard';
import ActivityList from './ActivityList';
import { useProfessorData } from './ProfessorData';

const FILTERS = [['ALL', '전체'], ['ACTIVE', '진행중'], ['GRADING', '채점 대기']];

function SubmissionCell({ group }) {
  const { progress, progressByTask } = useProfessorData();
  const summary = submissionSummary(progressByTask.get(group.id), progress.students);
  if (!summary.total) return <span className="prof-muted">등록된 학생 없음</span>;
  const percent = Math.round((summary.submitted / summary.total) * 100);
  return (
    <div className="prof-submit">
      <div className="prof-submit__top">
        <span className="prof-mono"><strong>{summary.submitted}</strong>/{summary.total}명</span>
        {summary.missing.length > 0
          ? <Link to={`/expert/students/progress?item=${group.id}`} className="prof-submit__missing">미제출 {summary.missing.length}명</Link>
          : <span className="prof-submit__all">전원 제출</span>}
      </div>
      <div className="prof-bar" role="progressbar" aria-label="제출률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <span className={percent === 100 ? 'is-done' : ''} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CourseworkTable() {
  const { groups, loading } = useProfessorData();
  const [filter, setFilter] = useState('ALL');
  const now = new Date();
  // What needs attention: open coursework, plus closed coursework that still waits for answers to be confirmed.
  const rows = groups.map(group => ({ group, phase: courseworkPhase(group, now), pending: pendingLabelCount(group), deadline: courseworkDeadline(group) }))
    .filter(row => row.phase === 'ACTIVE' || (row.phase === 'CLOSED' && row.pending > 0))
    .sort((a, b) => (a.phase === b.phase ? 0 : a.phase === 'ACTIVE' ? -1 : 1)
      || (a.deadline || '9999').localeCompare(b.deadline || '9999') || b.group.id - a.group.id);
  const matches = { ALL: () => true, ACTIVE: row => row.phase === 'ACTIVE', GRADING: row => row.pending > 0 };
  const shown = rows.filter(matches[filter]);

  return (
    <section className="prof-card" aria-labelledby="dash-coursework">
      <header className="prof-card__head">
        <h2 id="dash-coursework"><Icon name="clock" size={17} />진행중인 과제 현황</h2>
        <div className="prof-tabs" role="group" aria-label="과제 필터">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label} <span className="prof-mono">({rows.filter(matches[key]).length})</span>
            </button>
          ))}
        </div>
      </header>

      {loading ? <p role="status" className="prof-empty">과제를 불러오는 중…</p> : !shown.length ? (
        <div className="prof-empty">
          <p>{rows.length ? '해당하는 과제가 없습니다.' : '진행중인 과제가 없습니다.'}</p>
          {!rows.length && <Link to="/expert/assignments/new" className="prof-btn prof-btn--primary"><Icon name="plusCircle" size={15} />과제 만들기</Link>}
        </div>
      ) : (
        <div className="prof-table-wrap">
          <table className="prof-table prof-table--stack">
            <thead><tr><th scope="col">과제명</th><th scope="col">제출</th><th scope="col">마감</th><th scope="col" className="is-right">상태</th></tr></thead>
            <tbody>
              {shown.map(({ group, phase, pending, deadline }) => {
                const due = deadlineInfo(deadline, now);
                const species = [...new Set(group.tasks.map(task => task.speciesName).filter(Boolean))].join(', ');
                return (
                  <tr key={group.id}>
                    <td className="prof-table__title">
                      <Link to={`/expert/assignments/${group.id}/results`}>{courseworkTitle(group)}</Link>
                      <span className="prof-table__meta">
                        {isDiagnostic(group) ? '진단평가' : `분류 실습 · 도말 ${group.tasks.length}장`}{species && ` · ${species}`} · {group.cropCount}문항
                      </span>
                    </td>
                    <td><SubmissionCell group={group} /></td>
                    <td className="prof-table__due">
                      <strong className={`is-${due.tone}`}>{due.label}</strong>
                      {due.dateText && <span className="prof-mono">{due.dateText}</span>}
                    </td>
                    <td className="is-right">
                      <span className="prof-table__status">
                        {phase === 'ACTIVE' && <span className="prof-badge is-indigo">진행중</span>}
                        {pending > 0 && <span className="prof-badge is-amber" title={`정답이 확정되지 않은 문항 ${pending}개`}>채점 대기 {pending}</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <footer className="prof-card__foot">
        <span className="prof-muted">제출은 학생의 최종 제출 기준입니다.</span>
        <Link to="/expert/assignments/active" className="prof-link">과제 전체 보기 <Icon name="arrowRight" size={14} /></Link>
      </footer>
    </section>
  );
}

function AchievementCard() {
  const { species } = useProfessorData();
  const active = useMemo(() => species.filter(item => item.active !== false), [species]);
  const [speciesId, setSpeciesId] = useState('');
  const [state, setState] = useState({ loading: true, data: null, error: false });
  const selected = speciesId || active.find(item => item.code === 'DOG')?.id || active[0]?.id || '';

  useEffect(() => {
    if (!selected) return undefined;
    let cancelled = false;
    setState({ loading: true, data: null, error: false });
    // "ALL": every published coursework with confirmed answers, final submissions only.
    professorApi.calibration({ speciesId: selected, source: 'ALL' })
      .then(({ data }) => { if (!cancelled) setState({ loading: false, data, error: false }); })
      .catch(error => { if (!cancelled && !axios.isCancel(error)) setState({ loading: false, data: null, error: true }); });
    return () => { cancelled = true; };
  }, [selected]);

  const result = classAccuracy(state.data);
  const lowest = result.students.slice(0, 5);

  return (
    <section className="prof-card" aria-labelledby="dash-achievement">
      <header className="prof-card__head">
        <h2 id="dash-achievement"><Icon name="chart" size={17} />학생 성취도</h2>
        {active.length > 1 && (
          <label className="prof-select">
            <span className="prof-sr">동물 종</span>
            <select value={selected} onChange={event => setSpeciesId(Number(event.target.value))}>
              {active.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        )}
      </header>

      <div className="prof-card__body">
        {state.error ? <p role="alert" className="prof-empty prof-empty--compact">성취도 정보를 불러오지 못했습니다.</p>
          : !selected || state.loading ? <p role="status" className="prof-empty prof-empty--compact">성취도를 불러오는 중…</p>
          : !result.total ? <p className="prof-empty prof-empty--compact">채점된 응답이 아직 없습니다. 학생이 최종 제출하고 정답이 확정되면 표시됩니다.</p> : (
            <>
              <div className="prof-score">
                <div>
                  <span className="prof-score__label">평균 분류 정확도</span>
                  <strong className="prof-score__value">{result.accuracy}%</strong>
                </div>
                <p className="prof-muted">채점된 응답 <span className="prof-mono">{result.total}</span>개 · 학생 <span className="prof-mono">{result.gradedStudents}</span>명<br />최종 제출한 응답과 확정된 정답만 집계합니다.</p>
              </div>

              <h3 className="prof-subhead">세포 종류별 정확도</h3>
              <ul className="prof-classes">
                {result.classes.map(row => (
                  <li key={row.label}>
                    <div className="prof-classes__top">
                      <span>{row.label}</span>
                      <span className="prof-mono">{row.accuracy === null ? '표본 없음' : `${row.accuracy}%`}</span>
                    </div>
                    <div className="prof-bar" aria-hidden="true"><span className={row.accuracy !== null && row.accuracy < 80 ? 'is-low' : ''} style={{ width: `${row.accuracy || 0}%` }} /></div>
                  </li>
                ))}
              </ul>

              {lowest.length > 0 && (
                <>
                  <h3 className="prof-subhead">정확도가 낮은 학생</h3>
                  <ul className="prof-students">
                    {lowest.map(student => (
                      <li key={student.studentId}>
                        <span>{studentLabel(student)}</span>
                        <span className="prof-mono">{student.accuracy}% <small>· 응답 {student.totalSolved}개</small></span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
      </div>

      <footer className="prof-card__foot">
        <span />
        <Link to="/expert/students/achievement" className="prof-link">학생별 성취도 보기 <Icon name="arrowRight" size={14} /></Link>
      </footer>
    </section>
  );
}

function QuickActions() {
  const { activity } = useProfessorData();
  const actions = [
    { to: '/expert/students/register', icon: 'userPlus', tone: 'slate', title: '학생 CSV 일괄 등록', text: '학번·성명·분반 파일 가져오기' },
    {
      to: '/expert/reports', icon: 'help', tone: 'amber', title: '질문·신고 답변',
      text: activity.unansweredReports ? `답변을 기다리는 질문 ${activity.unansweredReports}건` : '답변을 기다리는 질문이 없습니다',
    },
    { to: '/expert/data', icon: 'database', tone: 'violet', title: '도말 데이터', text: '라벨링한 도말을 새 과제로 사용' },
  ];
  return (
    <section className="prof-card" aria-labelledby="dash-quick">
      <header className="prof-card__head"><h2 id="dash-quick">빠른 작업</h2></header>
      <ul className="prof-quick">
        {actions.map(action => (
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
  );
}

export default function DashboardPage() {
  const { activity, activityLoaded } = useProfessorData();
  return (
    <>
      <div className="prof-page-head">
        <div>
          <span className="prof-eyebrow prof-mono">교수 콘솔</span>
          <h1>대시보드</h1>
          <p>과제 현황, 학생 성취도, 최근 활동을 한눈에 확인합니다.</p>
        </div>
        <Link to="/expert/assignments/new" className="prof-btn prof-btn--primary"><Icon name="plusCircle" size={16} />새 과제 만들기</Link>
      </div>

      <div className="prof-dash">
        <div className="prof-dash__main">
          <CourseworkTable />
          <AchievementCard />
        </div>
        <div className="prof-dash__side">
          <QuickActions />
          <section className="prof-card" aria-labelledby="dash-activity">
            <header className="prof-card__head"><h2 id="dash-activity"><Icon name="history" size={17} />최근 활동</h2></header>
            {activityLoaded
              ? <ActivityList events={activity.events} limit={6} />
              : <p role="status" className="prof-empty prof-empty--compact">최근 활동을 불러오는 중…</p>}
          </section>
        </div>
      </div>
    </>
  );
}
