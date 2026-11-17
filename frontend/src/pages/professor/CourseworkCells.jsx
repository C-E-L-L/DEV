// Table cells shared by the dashboard and the coursework overview.
import { Link } from 'react-router-dom';
import AuthImage from '../../components/AuthImage';
import { useConsoleBase } from '../../components/console/ConsoleContext';
import Icon from '../../components/login/icons';
import { imageUrl } from '../../constants';
import { isDiagnostic } from '../../utils/coursework';
import { submissionSummary } from '../../utils/professorDashboard';
import { useProfessorData } from './ProfessorData';

/** First smear of the coursework (+n when it has more); a diagnostic has no smear, so it gets an icon tile. */
export function CourseworkThumb({ group }) {
  const smears = group.tasks.filter(task => task.originalFilename);
  if (isDiagnostic(group) || !smears.length) {
    return <span className="prof-thumb is-icon" aria-hidden="true"><Icon name={isDiagnostic(group) ? 'layers' : 'droplet'} size={18} /></span>;
  }
  const file = smears[0].originalFilename;
  return (
    <span className="prof-thumb">
      <AuthImage src={imageUrl.thumbnail(file)} fallbackSrc={imageUrl.original(file)} alt="" />
      {smears.length > 1 && <span className="prof-thumb__more prof-mono" title={`도말 ${smears.length}장`}>+{smears.length - 1}</span>}
    </span>
  );
}

export function SubmissionCell({ group }) {
  const basePath = useConsoleBase();
  const { progress, progressByTask } = useProfessorData();
  const summary = submissionSummary(progressByTask.get(group.id), progress.students);
  if (!summary.total) return <span className="prof-muted">등록된 학생 없음</span>;
  const percent = Math.round((summary.submitted / summary.total) * 100);
  return (
    <div className="prof-submit">
      <div className="prof-submit__top">
        <span className="prof-mono"><strong>{summary.submitted}</strong>/{summary.total}명</span>
        {summary.missing.length > 0
          ? <Link to={`${basePath}/students/progress?item=${group.id}`} className="prof-submit__missing">미제출 {summary.missing.length}명</Link>
          : <span className="prof-submit__all">전원 제출</span>}
      </div>
      <div className="prof-bar" role="progressbar" aria-label="제출률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <span className={percent === 100 ? 'is-done' : ''} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** Title with the thumbnail on its left and a line of facts under it. */
export function CourseworkTitleCell({ group, to, title }) {
  const species = [...new Set(group.tasks.map(task => task.speciesName).filter(Boolean))].join(', ');
  return (
    <div className="prof-table__course">
      <CourseworkThumb group={group} />
      <div>
        <Link to={to}>{title}</Link>
        <span className="prof-table__meta">
          {isDiagnostic(group) ? '진단평가' : `분류 실습 · 도말 ${group.tasks.length}장`}{species && ` · ${species}`} · {group.cropCount}문항
        </span>
      </div>
    </div>
  );
}
