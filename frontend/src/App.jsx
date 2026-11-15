import { createBrowserRouter, Navigate, Routes, Route, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NavBar } from './components/common';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import BombGamePage from './pages/BombGamePage';

const ProfessorApp = lazy(() => import('./pages/professor/ProfessorApp'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));
const StudentApp = lazy(() => import('./pages/student/StudentApp'));

// A data router (instead of <BrowserRouter>) so screens can ask before leaving unsaved work (useBlocker).
const router = createBrowserRouter([{ path: '*', element: <Root /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}

function Root() {
  return (
    <AuthProvider>
      <Suspense fallback={<p role="status" style={{padding:32}}>화면을 불러오는 중…</p>}>
      <Routes>
        <Route
          path="/game"
          element={<ProtectedRoute allowedRole="ADMIN"><BombGamePage /></ProtectedRoute>}
        />
        {/* The professor console has its own frame (sidebar + top bar) instead of the shared NavBar. */}
        <Route
          path="/expert/*"
          element={<ProtectedRoute allowedRole="EXPERT"><ProfessorApp /></ProtectedRoute>}
        />
        <Route path="/admin/*" element={<ProtectedRoute allowedRole="ADMIN"><AdminApp /></ProtectedRoute>} />
        {/* So does the student console. */}
        <Route
          path="/student/*"
          element={<ProtectedRoute allowedRole="STUDENT"><StudentApp /></ProtectedRoute>}
        />
        <Route path="*" element={<MainLayout />} />
      </Routes>
      </Suspense>
    </AuthProvider>
  );
}

function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<LoginRedirect><LandingPage /></LoginRedirect>} />
          <Route path="/login" element={<LoginRedirect><LoginPage /></LoginRedirect>} />
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedRoute({ allowedRole, children }) {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(user?.role);
  if (role !== allowedRole) {
    return <Navigate to={getHomePath(role)} replace />;
  }

  return children;
}

function LoginRedirect({ children }) {
  const { user, isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to={getHomePath(normalizeRole(user?.role))} replace />;
  }

  return children;
}

function RoleRedirect() {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return <Navigate to={getHomePath(normalizeRole(user?.role))} replace />;
}

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function getHomePath(role) {
  if (role === 'ADMIN') return '/admin';
  return role === 'EXPERT' ? '/expert' : '/student';
}
