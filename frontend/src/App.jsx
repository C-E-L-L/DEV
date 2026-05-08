import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavBar } from './components/common';
import LoginPage from './pages/LoginPage';
import StudentPage from './pages/StudentPage';
import ExpertPage from './pages/ExpertPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <NavBar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/student" element={<StudentPage />} />
              <Route path="/expert" element={<ExpertPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
