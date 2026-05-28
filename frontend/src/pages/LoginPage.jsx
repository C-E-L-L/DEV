import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const studentIdPattern = /^\d{10}$/;

  const handleUsernameChange = (value) => {
    if (isLoginMode) {
      setUsername(value);
      return;
    }
    setUsername(value.replace(/\D/g, '').slice(0, 10));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLoginMode) {
        await login(username, password);
      } else {
        if (!studentIdPattern.test(username)) {
          setError('학번은 10자리 숫자여야 합니다.');
          return;
        }
        const { data } = await authApi.register(username, password, 'student', name);
        setSuccess(data?.message || '회원가입이 완료되었습니다.');
        setIsLoginMode(true);
        setName('');
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || (isLoginMode
        ? '아이디 또는 비밀번호를 확인해 주세요.'
        : '회원가입에 실패했습니다.'));
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
          {isLoginMode ? '계정으로 로그인하세요' : '학생 계정을 생성하세요'}
        </p>

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLoginMode && (
            <div>
              <label style={labelStyle}>이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
            </div>
          )}

          <div>
            <label style={labelStyle}>{isLoginMode ? '아이디' : '학번'}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              required
              inputMode={isLoginMode ? undefined : 'numeric'}
              maxLength={isLoginMode ? undefined : 10}
              pattern={isLoginMode ? undefined : '[0-9]{10}'}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>비밀번호</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          </div>

          <button type="submit" style={btnStyle}>
            {isLoginMode ? '로그인' : '학생 회원가입'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '14px', color: '#6c757d' }}>
          {isLoginMode ? '학생 계정이 없나요? ' : '이미 계정이 있나요? '}
          <span onClick={toggleMode} style={toggleStyle}>
            {isLoginMode ? '회원가입' : '로그인'}
          </span>
        </div>
        {!isLoginMode && (
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#868e96', lineHeight: 1.5 }}>
            교수 계정은 관리자가 발급한 아이디와 비밀번호로 로그인합니다.
          </p>
        )}
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
