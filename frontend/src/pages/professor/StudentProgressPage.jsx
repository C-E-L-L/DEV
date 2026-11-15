import { useConsoleBase } from '../../components/console/ConsoleContext';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/login/icons';
import {
  courseworkDeadline, courseworkPhase, courseworkTitle, deadlineInfo, studentLabel, submissionSummary,
} from '../../utils/professorDashboard';
import { useProfessorData } from './ProfessorData';

function StudentChips({ students, tone, empty }) {
  if (!students.length) return <p className="prof-muted">{empty}</p>;
  return (
    <ul className="prof-chips">
      {students.map(student => (
        <li key={student.studentId} className={`prof-chip is-${tone}`}>
          {studentLabel(student)}
          {student.section && <small>{student.section}</small>}
          {!student.registered && <small className="prof-chip__flag">미가입</small>}
        </li>
      ))}
    </ul>
  );
}

/** Per coursework: how many students have finally submitted, and who has not. */
export default function StudentProgressPage() {
  const basePath = useConsoleBase();
  const { groups, loading, progress, progressByTask } = useProfessorData();
  const [params, setParams] = useSearchParams();
  const [section, setSection] = useState('');
  const opened = Number(params.get('item')) || null;
  const now = new Date();
  const sections = useMemo(() => [...new Set(progress.students.map(student => student.section).filter(Boolean))].sort(), [progress.students]);
  const published = groups.filter(group => ['ACTIVE', 'CLOSED'].includes(courseworkPhase(group, now)));
  const unregistered = progress.students.filter(student => !student.registered).length;

  useEffect(() => {
    if (opened) document.getElementById(`progress-${opened}`)?.scrollIntoView({ block: 'nearest' });
  }, [opened, loading]);

  const toggle = id => setParams(opened === id ? {} : { item: String(id) }, { replace: true });

  return (
    <>
      <div className="prof-page-head">
        <div>
          <h1>진행 상황</h1>
          <p>과제별로 최종 제출한 학생 수와 아직 제출하지 않은 학생을 확인합니다.</p>
        </div>
        {sections.length > 0 && (
          <label className="prof-select">
            <span>분반</span>
            <select value={section} onChange={event => setSection(event.target.value)}>
              <option value="">전체</option>
              {sections.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        )}
      </div>

      <section className="prof-card">
        {loading ? <p role="status" className="prof-empty">진행 상황을 불러오는 중…</p> : !published.length ? (
          <div className="prof-empty">
            <p>게시된 과제가 없습니다.</p>
            <Link to={`${basePath}/assignments/new`} className="prof-btn prof-btn--primary"><Icon name="plusCircle" size={15} />과제 만들기</Link>
          </div>
        ) : !progress.students.length ? (
          <div className="prof-empty">
            <p>등록된 학생이 없습니다.</p>
            <Link to={`${basePath}/students/register`} className="prof-btn prof-btn--primary"><Icon name="userPlus" size={15} />학생 등록</Link>
          </div>
        ) : (
          <ul className="prof-progress">
            {published.map(group => {
              const summary = submissionSummary(progressByTask.get(group.id), progress.students, section);
              const due = deadlineInfo(courseworkDeadline(group), now);
              const percent = summary.total ? Math.round((summary.submitted / summary.total) * 100) : 0;
              const expanded = opened === group.id;
              return (
                <li key={group.id} id={`progress-${group.id}`} className={expanded ? 'is-open' : ''}>
                  <button type="button" className="prof-progress__row" aria-expanded={expanded} aria-controls={`progress-detail-${group.id}`} onClick={() => toggle(group.id)}>
                    <span className="prof-progress__title">
                      <strong>{courseworkTitle(group)}</strong>
                      <small><span className={`is-${due.tone}`}>{due.label}</span>{due.dateText && <span className="prof-mono"> · {due.dateText}</span>}</small>
                    </span>
                    <span className="prof-progress__count">
                      <span className="prof-mono"><strong>{summary.submitted}</strong>/{summary.total}명 제출</span>
                      <span className="prof-bar" aria-hidden="true"><span className={percent === 100 ? 'is-done' : ''} style={{ width: `${percent}%` }} /></span>
                    </span>
                    <span className={`prof-badge ${summary.missing.length ? 'is-amber' : 'is-emerald'}`}>
                      {summary.missing.length ? `미제출 ${summary.missing.length}명` : summary.total ? '전원 제출' : '대상 없음'}
                    </span>
                    <Icon name="chevronDown" size={16} className={`prof-progress__chevron${expanded ? ' is-open' : ''}`} />
                  </button>
                  {expanded && (
                    <div className="prof-progress__detail" id={`progress-detail-${group.id}`}>
                      <h3 className="prof-subhead">미제출 <span className="prof-mono">{summary.missing.length}</span>명</h3>
                      <StudentChips students={summary.missing} tone="amber" empty="모든 학생이 제출했습니다." />
                      <h3 className="prof-subhead">제출 <span className="prof-mono">{summary.done.length}</span>명</h3>
                      <StudentChips students={summary.done} tone="slate" empty="아직 제출한 학생이 없습니다." />
                      <Link to={`${basePath}/assignments/${group.id}/results`} className="prof-link">응답·채점 결과 보기 <Icon name="arrowRight" size={14} /></Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <footer className="prof-card__foot">
          <span className="prof-muted">
            대상은 활성 학생 계정과 가입 허용 명단의 학생입니다.
            {unregistered > 0 && ` 명단에 있지만 아직 가입하지 않은 학생 ${unregistered}명은 미제출로 셉니다.`}
          </span>
        </footer>
      </section>
    </>
  );
}
