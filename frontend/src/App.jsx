import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavBar } from './components/common';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import StudentPage from './pages/StudentPage';
import ExpertPage from './pages/ExpertPage';
import AdminPage from './pages/AdminPage';
import BombGamePage from './pages/BombGamePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/game"
            element={<ProtectedRoute allowedRole="ADMIN"><BombGamePage /></ProtectedRoute>}
          />
          <Route path="*" element={<MainLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<LoginRedirect><LoginPage /></LoginRedirect>} />
          <Route
            path="/student"
            element={<ProtectedRoute allowedRole="STUDENT"><StudentPage /></ProtectedRoute>}
          />
          <Route
            path="/expert"
            element={<ProtectedRoute allowedRole="EXPERT"><ExpertPage /></ProtectedRoute>}
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
    return <Navigate to="/" replace />;
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
