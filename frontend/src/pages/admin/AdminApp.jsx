import { Navigate, Route, Routes } from 'react-router-dom';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import { ConsoleProvider } from '../../components/console/ConsoleContext';
import AnalyticsFeedback from '../../components/AnalyticsFeedback';
import Announcements from '../../components/Announcements';
import { AssignmentCreatePage, AssignmentEditPage, AssignmentResultsPage } from '../professor/AssignmentPages';
import AssignmentsPage from '../professor/AssignmentsPage';
import DataPage from '../professor/DataPage';
import StudentRegisterPage from '../professor/StudentRegisterPage';
import StudentProgressPage from '../professor/StudentProgressPage';
import { ReportsPage, SettingsPage, StudentAchievementPage } from '../professor/EmbeddedPages';
import { ProfessorDataProvider } from '../professor/ProfessorData';
import { AdminDataProvider } from './AdminData';
import AdminShell from './AdminShell';
import DashboardPage from './DashboardPage';
import AccountsPage from './AccountsPage';
import MatrixPanel from './MatrixPanel';
import CropsPage from './CropsPage';
import ReviewPage from './ReviewPage';
import '../professor/workspace.css';
import '../professor/professor.css';
import './admin.css';

export default function AdminApp() {
  return <ConsoleProvider basePath="/admin"><ProfessorDataProvider><AdminDataProvider><AdminShell><Routes>
    <Route index element={<DashboardPage/>}/>
    <Route path="data" element={<Navigate to="/admin/data/smears" replace/>}/>
    <Route path="data/smears" element={<DataPage key="inventory"/>}/>
    <Route path="data/crops" element={<CropsPage/>}/>
    <Route path="data/review" element={<ReviewPage/>}/>
    <Route path="assignments/drafts" element={<AssignmentsPage key="DRAFT" phase="DRAFT"/>}/>
    <Route path="assignments/active" element={<AssignmentsPage key="ACTIVE" phase="ACTIVE"/>}/>
    <Route path="assignments/completed" element={<AssignmentsPage key="CLOSED" phase="CLOSED"/>}/>
    <Route path="assignments/new" element={<AssignmentCreatePage/>}/>
    <Route path="assignments/:id/edit" element={<AssignmentEditPage/>}/>
    <Route path="assignments/:id/results" element={<AssignmentResultsPage/>}/>
    <Route path="accounts" element={<AccountsPage/>}/>
    <Route path="accounts/students" element={<AccountsPage role="STUDENT"/>}/>
    <Route path="accounts/professors" element={<AccountsPage role="EXPERT"/>}/>
    <Route path="students/register" element={<StudentRegisterPage/>}/>
    <Route path="students/progress" element={<StudentProgressPage/>}/>
    <Route path="statistics/students" element={<StudentAchievementPage/>}/>
    <Route path="statistics/cells" element={<div className="adm-legacy"><div className="prof-page-head"><div><h1>전체 응답 통계</h1><p>세포별 응답과 오답률을 확인합니다.</p></div></div><AnalyticsFeedback initialTab="cells" hideTabs/></div>}/>
    <Route path="statistics/matrix" element={<><div className="prof-page-head"><div><h1>혼동행렬</h1><p>동물 종과 클래스 구성별로 학생의 분류 결과를 확인합니다.</p></div></div><MatrixPanel/></>}/>
    <Route path="reports" element={<ReportsPage/>}/>
    <Route path="announcements" element={<><div className="prof-page-head"><div><h1>공지사항 관리</h1><p>전체·학생·교수 대상의 안내를 게시하고 관리합니다.</p></div></div><Announcements manage compact={false}/></>}/>
    <Route path="settings" element={<SettingsPage/>}/>
    <Route path="*" element={<Navigate to="/admin" replace/>}/>
  </Routes></AdminShell></AdminDataProvider></ProfessorDataProvider></ConsoleProvider>;
}
