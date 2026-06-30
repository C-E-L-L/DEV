import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();

  const isStudentSignup = !isLoginMode && role === 'student';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLoginMode) {
        await login(username, password);
      } else {
        const { data } = await authApi.register(username, password, role, isStudentSignup ? name : undefined);
        setSuccess(data?.message || '회원가입이 완료되었습니다. 이제 로그인해 주세요.');
        setIsLoginMode(true);
        setName('');
        setPassword('');
      }
    } catch (err) {
      setError(
        isLoginMode
          ? (err.response?.data?.message || '아이디 또는 비밀번호가 올바르지 않습니다.')
          : err.response?.status === 400
            ? (err.response?.data?.message || '입력 정보를 확인해 주세요. 이미 사용 중인 아이디일 수 있습니다.')
            : '회원가입에 실패했습니다.'
      );
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccess('');
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <h1 style={{ margin: '0 0 10px 0', color: '#343a40' }}>C.E.L.L. Platform</h1>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>
          {isLoginMode ? '계정으로 로그인하세요' : '새 계정을 생성하세요'}
        </p>

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLoginMode && (
            <div>
              <label style={labelStyle}>가입 유형 (Role)</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                <option value="student">학생 (Student)</option>
                <option value="expert">교수/전문가 (Expert)</option>
              </select>
            </div>
          )}

          {isStudentSignup && (
            <div>
              <label style={labelStyle}>이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
            </div>
          )}

          <div>
            <label style={labelStyle}>{isStudentSignup ? '학번' : '아이디 (Username)'}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>비밀번호 (Password)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          </div>

          <button type="submit" style={btnStyle}>
            {isLoginMode ? '로그인 (Login)' : '회원가입 (Sign Up)'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '14px', color: '#6c757d' }}>
          {isLoginMode ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <span onClick={toggleMode} style={toggleStyle}>
            {isLoginMode ? '회원가입 하기' : '로그인 하기'}
          </span>
        </div>
      </div>
    </div>
  );
}

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f3f5' };
const boxStyle = { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px', textAlign: 'center' };
const labelStyle = { display: 'block', textAlign: 'left', fontWeight: '600', marginBottom: '5px', fontSize: '14px', color: '#495057' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '12px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const errorStyle = { color: '#dc3545', background: '#f8d7da', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' };
const successStyle = { color: '#155724', background: '#d4edda', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' };
const toggleStyle = { color: '#0056b3', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' };
