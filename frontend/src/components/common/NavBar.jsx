import { useAuth } from '../../context/AuthContext';

export default function NavBar() {
  const { user, logout, isLoggedIn } = useAuth();
  if (!isLoggedIn) return null;

  const dashboardPath = String(user.role).toUpperCase() === 'EXPERT' ? '/expert' : '/student';

  return (
    <nav style={navStyle}>
      <div style={leftStyle}>
        <a href={dashboardPath} style={logoStyle}>C.E.L.L. Platform</a>
      </div>
      <div style={rightStyle}>
        <span>반갑습니다, <strong>{user.name || user.username}</strong>님 ({user.role})</span>
        <button onClick={logout} style={logoutBtnStyle}>로그아웃</button>
      </div>
    </nav>
  );
}

const navStyle = { background: '#fff', borderBottom: '1px solid #dee2e6', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' };
const leftStyle = { display: 'flex', alignItems: 'center', gap: '40px' };
const logoStyle = { fontWeight: 'bold', fontSize: '20px', color: '#343a40', textDecoration: 'none' };
const rightStyle = { display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px', fontWeight: '500' };
const logoutBtnStyle = { padding: '6px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };
