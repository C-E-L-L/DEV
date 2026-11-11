import { useState } from 'react';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import LoginHero from '../components/login/LoginHero';
import LoginField from '../components/login/LoginField';
import Icon from '../components/login/icons';
import logoUrl from '../assets/login/cell-logo.svg';
import './LoginPage.css';

const UNAVAILABLE_TITLE = '아직 제공되지 않는 기능입니다.';

/** Visible placeholder for a feature that is designed but not implemented yet. */
function Unavailable({ children }) {
  return (
    <button type="button" className="login-unavailable" disabled aria-disabled="true" title={UNAVAILABLE_TITLE}>
      {children}
      <span className="login-unavailable__badge">준비 중</span>
    </button>
  );
}

export default function LoginPage() {
  const isMockMode = import.meta.env.MODE === 'mock';
  const colorizerUrl = import.meta.env.VITE_COLORIZER_URL
    || (isMockMode ? 'http://127.0.0.1:8501/' : '/colorizer/');
  const mockAccounts = {
    EXPERT: { username: 'professor', label: '교수' },
    STUDENT: { username: 'student', label: '학생' },
    ADMIN: { username: 'admin', label: '관리자' },
  };
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [mockRole, setMockRole] = useState('EXPERT');
  const [username, setUsername] = useState(isMockMode ? 'professor' : '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState(isMockMode ? 'local' : '');
  const role = 'student';
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const { login } = useAuth();

  const isStudentSignup = !isLoginMode;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isLoginMode) {
        await login(username, password, { remember });
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
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="login-page">
      <LoginHero />

      <section className="login-panel" aria-label={isLoginMode ? '로그인' : '학생 회원가입'}>
        <div className="login-panel__topbar">
          <span className="login-chip">
            <Icon name="shield" size={11} />
            통합 계정 로그인
          </span>
          <a
            href={colorizerUrl}
            target="_blank"
            rel="noreferrer"
            title="DICOM 컬러화 작업공간 열기 (새 탭)"
            className="login-panel__toplink"
          >
            <Icon name="contrast" size={12} />
            DICOM Color Lab
            <Icon name="external" size={11} />
          </a>
        </div>

        <div className="login-panel__body">
          <div className="login-panel__header">
            <span className="login-panel__logo-box">
              <img src={logoUrl} alt="" className="login-panel__logo" />
            </span>
            <h2 className="login-panel__title">
              {isLoginMode ? 'CELL에 오신 것을 환영합니다' : '학생 회원가입'}
            </h2>
            <p className="login-panel__desc">
              {isLoginMode
                ? '아이디(학번)와 비밀번호를 입력해 주세요.'
                : '이름, 학번, 비밀번호를 입력해 학생 계정을 만드세요.'}
            </p>
          </div>

          {isMockMode && isLoginMode && (
            <div className="login-alert login-alert--info">
              로컬 테스트 모드입니다. 역할을 선택하고 로그인하세요.
            </div>
          )}
          {error && <div className="login-alert login-alert--error" role="alert">{error}</div>}
          {success && <div className="login-alert login-alert--success" role="status">{success}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {isMockMode && isLoginMode && (
              <div className="login-field">
                <div className="login-field__label-row">
                  <label htmlFor="login-mock-role">테스트할 계정</label>
                </div>
                <select
                  id="login-mock-role"
                  className="login-input login-select"
                  value={mockRole}
                  onChange={(e) => {
                    const nextRole = e.target.value;
                    setMockRole(nextRole);
                    setUsername(mockAccounts[nextRole].username);
                    setPassword('local');
                  }}
                >
                  {Object.entries(mockAccounts).map(([value, account]) => (
                    <option key={value} value={value}>{account.label} 계정</option>
                  ))}
                </select>
              </div>
            )}

            {isStudentSignup && (
              <LoginField
                id="login-name"
                label="이름"
                icon="user"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="홍길동"
                required
              />
            )}

            <LoginField
              id="login-username"
              label={isStudentSignup ? '학번' : '아이디 / 학번'}
              icon={isStudentSignup ? 'school' : 'user'}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder={isStudentSignup ? '학번 입력' : '아이디 또는 학번'}
              required
            />

            <LoginField
              id="login-password"
              label="비밀번호"
              icon="lock"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              placeholder="비밀번호 입력"
              required
              labelAside={isLoginMode && <Unavailable>비밀번호 찾기</Unavailable>}
              trailing={(
                <button
                  type="button"
                  className="login-field__trailing"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              )}
            />

            {isLoginMode && (
              <div className="login-remember">
                <label className="login-remember__label">
                  <input
                    type="checkbox"
                    className="login-remember__box"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    aria-describedby="login-remember-hint"
                  />
                  로그인 상태 유지
                </label>
                <span id="login-remember-hint" className="login-remember__hint">
                  {remember ? '새 탭과 다음 접속에도 이 계정으로 로그인' : '이 탭에서만 로그인 · 탭을 닫으면 로그아웃'}
                </span>
              </div>
            )}

            <button type="submit" className="login-submit" disabled={submitting}>
              <span>
                {submitting
                  ? (isLoginMode ? '로그인 중…' : '가입 처리 중…')
                  : (isLoginMode ? '로그인' : '회원가입')}
              </span>
              {!submitting && <Icon name={isLoginMode ? 'arrowRight' : 'userPlus'} size={14} />}
            </button>
          </form>

          <p className="login-toggle">
            {isLoginMode ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <button type="button" onClick={toggleMode} className="login-toggle__btn">
              {isLoginMode ? '학생 회원가입' : '로그인하기'}
            </button>
          </p>

          <div className="login-notice">
            <Icon name="info" size={16} className="login-notice__icon" />
            <p>
              {isLoginMode
                ? '별도의 역할 선택 없이 로그인하면 계정 권한(교수·학생·관리자)에 맞는 화면으로 자동 이동합니다.'
                : <>학생 계정 전용 회원가입입니다. 교수·전문가 계정은 <strong>관리자에게 문의</strong>하세요.</>}
            </p>
          </div>

          <div className="login-partners">
            <span className="login-partners__caption">공동 연구 기관</span>
            <div className="login-partners__list">
              <span><Icon name="school" size={13} className="login-partners__icon" />경상국립대학교</span>
              <span className="login-partners__sep" aria-hidden="true">·</span>
              <span><Icon name="school" size={13} className="login-partners__icon login-partners__icon--violet" />충북대학교</span>
            </div>
          </div>
        </div>

        <footer className="login-panel__footer">
          <Unavailable>개인정보처리방침</Unavailable>
          <span>C.E.L.L. Platform</span>
        </footer>
      </section>
    </div>
  );
}
