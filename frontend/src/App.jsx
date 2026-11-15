import { createBrowserRouter, Navigate, Routes, Route, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavBar } from './components/common';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import StudentPage from './pages/StudentPage';
import StudentMyPage from './pages/StudentMyPage';
import ProfessorApp from './pages/professor/ProfessorApp';
import AdminPage from './pages/AdminPage';
import BombGamePage from './pages/BombGamePage';

// A data router (instead of <BrowserRouter>) so screens can ask before leaving unsaved work (useBlocker).
const router = createBrowserRouter([{ path: '*', element: <Root /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}

function Root() {
  return (
    <AuthProvider>
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
        <Route path="*" element={<MainLayout />} />
      </Routes>
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
          <Route
            path="/student"
            element={<ProtectedRoute allowedRole="STUDENT"><StudentPage /></ProtectedRoute>}
          />
          <Route
            path="/student/my-page"
            element={<ProtectedRoute allowedRole="STUDENT"><StudentMyPage /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute allowedRole="ADMIN"><AdminPage /></ProtectedRoute>}
          />
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
