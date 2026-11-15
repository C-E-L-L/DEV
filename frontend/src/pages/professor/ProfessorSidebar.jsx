import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/login/icons';
import logoUrl from '../../assets/login/cell-logo.svg';
import { useProfessorData } from './ProfessorData';

const GROUPS_KEY = 'cell-prof-sidebar-groups';

// `count` names a badge value: coursework counts, or unanswered questions.
const NAV = [
  { key: 'dashboard', label: '대시보드', icon: 'grid', to: '/expert', end: true },
  {
    key: 'assignments', label: '과제', icon: 'clipboard', base: '/expert/assignments', to: '/expert/assignments/active',
    children: [
      { label: '임시 저장된 과제', icon: 'edit', to: '/expert/assignments/drafts', count: 'drafts' },
      { label: '진행중인 과제', icon: 'clock', to: '/expert/assignments/active', count: 'active', strong: true },
      { label: '완료된 과제', icon: 'checkCircle', to: '/expert/assignments/completed', count: 'completed' },
      { label: '과제 만들기', icon: 'plusCircle', to: '/expert/assignments/new', accent: true },
    ],
  },
  {
    key: 'students', label: '학생', icon: 'users', base: '/expert/students', to: '/expert/students/achievement',
    children: [
      { label: '학생 등록', icon: 'userPlus', to: '/expert/students/register' },
      { label: '학생별 성취도', icon: 'chart', to: '/expert/students/achievement' },
      { label: '진행 상황', icon: 'barChart', to: '/expert/students/progress' },
    ],
  },
  { key: 'reports', label: '질문·신고', icon: 'help', to: '/expert/reports', count: 'reports', alert: true },
  { key: 'data', label: '데이터', icon: 'database', to: '/expert/data' },
  { key: 'settings', label: '설정', icon: 'settings', to: '/expert/settings' },
];

function readGroups() {
  try { return JSON.parse(window.localStorage.getItem(GROUPS_KEY)) || {}; } catch { return {}; }
}

function Badge({ value, alert, strong }) {
  if (!value) return null;
  return <span className={`prof-nav__badge prof-mono${alert ? ' is-alert' : strong ? ' is-strong' : ''}`}>{value > 99 ? '99+' : value}</span>;
}

export default function ProfessorSidebar({ rail, id }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { counts, activity } = useProfessorData();
  const badges = { ...counts, reports: activity.unansweredReports };
  const [open, setOpen] = useState(() => ({ assignments: true, students: true, ...readGroups() }));

  // Opening a page inside a closed group reveals it.
  useEffect(() => {
    const group = NAV.find(item => item.children && pathname.startsWith(item.base));
    if (group) setOpen(current => (current[group.key] ? current : { ...current, [group.key]: true }));
  }, [pathname]);
  useEffect(() => {
    try { window.localStorage.setItem(GROUPS_KEY, JSON.stringify(open)); } catch { /* not persisted */ }
  }, [open]);

  const displayName = user.name || user.username;

  return (
    <aside className="prof-sidebar" id={id} aria-label="교수 메뉴">
      <Link to="/expert" className="prof-brand" title="대시보드">
        <img src={logoUrl} alt="" className="prof-brand__logo" />
        {!rail && (
          <span className="prof-brand__text">
            <span className="prof-brand__name">CELL<span className="prof-brand__pill prof-mono">교수</span></span>
            <span className="prof-brand__sub">Hematology AI</span>
          </span>
        )}
      </Link>

      <nav className="prof-nav">
        {NAV.map(item => {
          const inside = item.base && pathname.startsWith(item.base);
          if (rail || !item.children) {
            return (
              <NavLink key={item.key} to={item.to} end={item.end} title={rail ? item.label : undefined}
                className={({ isActive }) => `prof-nav__link${isActive || (rail && inside) ? ' is-active' : ''}`}>
                <Icon name={item.icon} size={17} />
                {!rail && <span className="prof-nav__label">{item.label}</span>}
                {!rail && <Badge value={badges[item.count]} alert={item.alert} />}
                {rail && item.alert && badges[item.count] > 0 && <span className="prof-nav__dot" aria-hidden="true" />}
                {rail && <span className="prof-sr">{item.label}</span>}
              </NavLink>
            );
          }
          const expanded = open[item.key];
          return (
            <div key={item.key} className="prof-nav__group">
              <button type="button" className={`prof-nav__link prof-nav__toggle${inside ? ' is-inside' : ''}`}
                aria-expanded={expanded} aria-controls={`prof-nav-${item.key}`}
                onClick={() => setOpen(current => ({ ...current, [item.key]: !current[item.key] }))}>
                <Icon name={item.icon} size={17} />
                <span className="prof-nav__label">{item.label}</span>
                <Icon name="chevronDown" size={14} className={`prof-nav__chevron${expanded ? ' is-open' : ''}`} />
              </button>
              {expanded && (
                <ul className="prof-nav__sub" id={`prof-nav-${item.key}`}>
                  {item.children.map(child => (
                    <li key={child.to}>
                      <NavLink to={child.to} className={({ isActive }) => `prof-nav__link prof-nav__link--sub${child.accent ? ' is-accent' : ''}${isActive ? ' is-active' : ''}`}>
                        <Icon name={child.icon} size={15} />
                        <span className="prof-nav__label">{child.label}</span>
                        <Badge value={badges[child.count]} strong={child.strong} />
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="prof-side-footer">
        {/* Placeholder until the chatbot ships: visible, but not interactive. */}
        <div className="prof-ai" title="AI 어시스턴트(챗봇)는 개발 중입니다." aria-disabled="true">
          <Icon name="bot" size={16} />
          {!rail && <><span className="prof-ai__label">AI 어시스턴트</span><span className="prof-wip">개발중</span></>}
          {rail && <span className="prof-sr">AI 어시스턴트 (개발중)</span>}
        </div>
        <div className="prof-profile">
          {!rail && <span className="prof-avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>}
          {!rail && (
            <span className="prof-profile__text">
              <strong>{displayName}</strong>
              <small>교수 · {user.username}</small>
            </span>
          )}
          <button type="button" className="prof-icon-btn" onClick={logout} title="로그아웃" aria-label="로그아웃">
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
