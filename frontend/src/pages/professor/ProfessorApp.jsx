import { Navigate, Route, Routes } from 'react-router-dom';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import AnnouncementsPage from '../../components/AnnouncementsPage';
import { AssignmentCreatePage, AssignmentEditPage, AssignmentResultsPage } from './AssignmentPages';
import AssignmentsOverviewPage from './AssignmentsOverviewPage';
import AssignmentsPage from './AssignmentsPage';
import DashboardPage from './DashboardPage';
import DataPage from './DataPage';
import { ReportsPage, SettingsPage } from './EmbeddedPages';
import { ProfessorDataProvider } from './ProfessorData';
import ProfessorShell from './ProfessorShell';
import StudentDetailPage from './StudentDetailPage';
import StudentProgressPage from './StudentProgressPage';
import StudentsPage from './StudentsPage';
import StudentRegisterPage from './StudentRegisterPage';
import './workspace.css';
import './professor.css';

/**
 * Professor console, mounted at /expert/*. Every menu is its own URL, so the browser's
 * back/forward buttons move between screens instead of leaving the console.
 */
export default function ProfessorApp() {
  return (
    <ProfessorDataProvider>
      <ProfessorShell>
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="assignments" element={<AssignmentsOverviewPage />} />
          <Route path="assignments/drafts" element={<AssignmentsPage key="DRAFT" phase="DRAFT" />} />
          <Route path="assignments/active" element={<AssignmentsPage key="ACTIVE" phase="ACTIVE" />} />
          <Route path="assignments/completed" element={<AssignmentsPage key="CLOSED" phase="CLOSED" />} />
          <Route path="assignments/new" element={<AssignmentCreatePage />} />
          <Route path="assignments/:id/edit" element={<AssignmentEditPage />} />
          <Route path="assignments/:id/results" element={<AssignmentResultsPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/achievement" element={<Navigate to="/expert/students" replace />} />
          <Route path="students/:studentId" element={<StudentDetailPage />} />
          <Route path="students/register" element={<StudentRegisterPage />} />
          <Route path="students/progress" element={<StudentProgressPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="announcements" element={<AnnouncementsPage manage />} />
          <Route path="data" element={<DataPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/expert" replace />} />
        </Routes>
      </ProfessorShell>
    </ProfessorDataProvider>
  );
}
