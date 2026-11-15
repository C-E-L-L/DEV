import { Navigate, Route, Routes } from 'react-router-dom';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import { AssignmentsPage, DashboardPage } from './CourseworkPages';
import { HistoryPage, QuestionsPage, ResultsPage } from './EmbeddedPages';
import { StudentDataProvider } from './StudentData';
import StudentShell from './StudentShell';
// The console frame, tokens and shared pieces (cards, buttons, badges) come from the professor console.
import '../professor/workspace.css';
import '../professor/professor.css';
import './student.css';

/**
 * Student console, mounted at /student/*. Every menu and every coursework is its own URL, so the
 * browser's back/forward buttons move between screens.
 */
export default function StudentApp() {
  return (
    <StudentDataProvider>
      <StudentShell>
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assignments/history" element={<HistoryPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          {/* The old My Page address. */}
          <Route path="my-page" element={<Navigate to="/student/results" replace />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </StudentShell>
    </StudentDataProvider>
  );
}
