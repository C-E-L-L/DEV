// Shared console pages, with a dedicated question-management layout for professors.
import ReportsPanel from '../../components/ReportsPanel';
import SpeciesDataSettings from '../../components/SpeciesDataSettings';
import StudentManagement from '../../components/StudentManagement';
import { useProfessorData } from './ProfessorData';
import { useAuth } from '../../context/AuthContext';
import ProfessorReportsPage from './ProfessorReportsPage';

export function StudentAchievementPage() {
  return <div className="professor-workspace prof-embedded"><StudentManagement showRegistration={false} /></div>;
}

export function ReportsPage() {
  const { user } = useAuth();
  if (user.role === 'EXPERT') return <ProfessorReportsPage />;
  return <div className="professor-workspace prof-embedded"><ReportsPanel /></div>;
}

export function SettingsPage() {
  const { species, reload } = useProfessorData();
  return <div className="professor-workspace prof-embedded">
    <section className="pw-card"><h2>데이터 설정</h2><SpeciesDataSettings species={species} onSaved={() => reload({ silent: true })} /></section>
  </div>;
}
