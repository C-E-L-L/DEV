import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/login/icons';
import logoUrl from '../../assets/login/cell-logo.svg';
import { newReplyCount } from '../../utils/studentDashboard';
import { courseworkState, useStudentData } from './StudentData';

const COLLAPSED_KEY = 'cell-student-sidebar-collapsed';
const GROUPS_KEY = 'cell-student-sidebar-groups';
const MOBILE_QUERY = '(max-width: 900px)';

const NAV = [
  { key: 'dashboard', label: '대시보드', icon: 'grid', to: '/student', end: true },
  {
    key: 'assignments', label: '과제', icon: 'clipboard', base: ['/student/assignments', '/student/work'], to: '/student/assignments',
    children: [
      { label: '전체 과제 관리', icon: 'clock', to: '/student/assignments', end: true, count: 'todo', also: '/student/work' },
      { label: '수행한 과제 목록', icon: 'history', to: '/student/assignments/history' },
    ],
  },
  {
    key: 'mypage', label: '마이페이지', icon: 'user', base: ['/student/results', '/student/questions'], to: '/student/results',
    children: [
      { label: '내 결과 분석/확인', icon: 'chart', to: '/student/results' },
      { label: '내 질문 관리', icon: 'help', to: '/student/questions', count: 'replies' },
    ],
  },
];

const TITLES = [
  ['/student/assignments/history', '수행한 과제 목록'],
  ['/student/assignments', '전체 과제 관리'],
  ['/student/results', '내 결과 분석/확인'],
  ['/student/questions', '내 질문 관리'],
  ['/student', '대시보드'],
];

const ShellContext = createContext({ toggleSidebar: () => {}, sidebarShown: true });
/** Lets a full-height screen (the classification workspace) put the sidebar toggle in its own header. */
export const useStudentShell = () => useContext(ShellContext);

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener('change', onChange);
    onChange();
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function readStored(key, fallback) {
  try { return JSON.parse(window.localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

const inside = (item, pathname) => item.base?.some(base => pathname.startsWith(base));

function StudentSidebar({ rail, id }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { items, progress, reports } = useStudentData();
  const badges = {
    todo: items.filter(item => progress[item.key] && courseworkState(item, progress[item.key]).todo).length,
    replies: newReplyCount(reports),
  };
  const badgeTitle = { todo: '아직 제출하지 않은 과제', replies: '최근 7일 동안 받은 교수 답변' };
  const [open, setOpen] = useState(() => ({ assignments: true, mypage: true, ...readStored(GROUPS_KEY, {}) }));

  useEffect(() => {
    const group = NAV.find(item => item.children && inside(item, pathname));
    if (group) setOpen(current => (current[group.key] ? current : { ...current, [group.key]: true }));
  }, [pathname]);
  useEffect(() => {
    try { window.localStorage.setItem(GROUPS_KEY, JSON.stringify(open)); } catch { /* not persisted */ }
  }, [open]);

  const displayName = user.name || user.username;

  return (
    <aside className="prof-sidebar" id={id} aria-label="학생 메뉴">
      <Link to="/student" className="prof-brand" title="대시보드">
        <img src={logoUrl} alt="" className="prof-brand__logo" />
        {!rail && (
          <span className="prof-brand__text">
            <span className="prof-brand__name">CELL<span className="prof-brand__pill prof-mono">학생</span></span>
            <span className="prof-brand__sub">Hematology AI</span>
          </span>
        )}
      </Link>

      <nav className="prof-nav">
        {NAV.map(item => {
          if (rail || !item.children) {
            return (
              <NavLink key={item.key} to={item.to} end={item.end} title={rail ? item.label : undefined}
                className={({ isActive }) => `prof-nav__link${isActive || (rail && inside(item, pathname)) ? ' is-active' : ''}`}>
                <Icon name={item.icon} size={17} />
                {!rail && <span className="prof-nav__label">{item.label}</span>}
                {rail && <span className="prof-sr">{item.label}</span>}
              </NavLink>
            );
          }
          const expanded = open[item.key];
          return (
            <div key={item.key} className="prof-nav__group">
              <button type="button" className={`prof-nav__link prof-nav__toggle${inside(item, pathname) ? ' is-inside' : ''}`}
                aria-expanded={expanded} aria-controls={`stu-nav-${item.key}`}
                onClick={() => setOpen(current => ({ ...current, [item.key]: !current[item.key] }))}>
                <Icon name={item.icon} size={17} />
                <span className="prof-nav__label">{item.label}</span>
                <Icon name="chevronDown" size={14} className={`prof-nav__chevron${expanded ? ' is-open' : ''}`} />
              </button>
              {expanded && (
                <ul className="prof-nav__sub" id={`stu-nav-${item.key}`}>
                  {item.children.map(child => (
                    <li key={child.to}>
                      <NavLink to={child.to} end={child.end}
                        className={({ isActive }) => `prof-nav__link prof-nav__link--sub${isActive || (child.also && pathname.startsWith(child.also)) ? ' is-active' : ''}`}>
                        <Icon name={child.icon} size={15} />
                        <span className="prof-nav__label">{child.label}</span>
                        {badges[child.count] > 0 && <span className="prof-nav__badge prof-mono is-strong" title={badgeTitle[child.count]}>{badges[child.count]}</span>}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {/* In the design, not implemented yet: visible but not interactive, like the professor console's placeholders. */}
        <div className="prof-nav__link stu-nav__disabled" aria-disabled="true" title="설정은 개발 중입니다.">
          <Icon name="settings" size={17} />
          {!rail && <><span className="prof-nav__label">설정</span><span className="prof-wip">개발중</span></>}
          {rail && <span className="prof-sr">설정 (개발중)</span>}
        </div>
      </nav>

      <div className="prof-side-footer">
        <div className="prof-profile">
          {!rail && <span className="prof-avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>}
          {!rail && (
            <span className="prof-profile__text">
              <strong>{displayName}</strong>
              <small>학생 · {user.username}</small>
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

export function SidebarToggle() {
  const { toggleSidebar, sidebarShown } = useStudentShell();
  const label = sidebarShown ? '사이드바 접기' : '사이드바 펼치기';
  return (
    <button type="button" className="prof-icon-btn" onClick={toggleSidebar} aria-controls="stu-sidebar" aria-expanded={sidebarShown} aria-label={label} title={label}>
      <Icon name="panelLeft" size={18} />
    </button>
  );
}

/**
 * Student console frame. It reuses the professor console's frame classes (`prof-*`), so the sidebar,
 * top bar, cards and buttons are the same components on both sides.
 * The classification workspace is full height and brings its own header, so it is rendered bare.
 */
export default function StudentShell({ children }) {
  const { pathname } = useLocation();
  const { error, reload } = useStudentData();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [collapsed, setCollapsed] = useState(() => readStored(COLLAPSED_KEY, 0) === 1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const main = useRef(null);
  const bare = pathname.startsWith('/student/work');

  useEffect(() => {
    setDrawerOpen(false);
    main.current?.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = event => { if (event.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const toggleSidebar = () => {
    if (mobile) { setDrawerOpen(value => !value); return; }
    setCollapsed(value => {
      try { window.localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1'); } catch { /* not persisted */ }
      return !value;
    });
  };

  const rail = collapsed && !mobile;
  const sidebarShown = mobile ? drawerOpen : !collapsed;
  const title = TITLES.find(([path]) => pathname.startsWith(path))?.[1] || '';

  return (
    <ShellContext.Provider value={{ toggleSidebar, sidebarShown, mobile }}>
      <div className={`prof-shell stu-shell${rail ? ' is-rail' : ''}${mobile ? ' is-mobile' : ''}${drawerOpen ? ' is-drawer-open' : ''}`}>
        <StudentSidebar rail={rail} id="stu-sidebar" />
        {mobile && drawerOpen && <button type="button" className="prof-backdrop" aria-label="메뉴 닫기" onClick={() => setDrawerOpen(false)} />}

        {bare ? children : (
          <div className="prof-main" ref={main}>
            <header className="prof-topbar">
              <SidebarToggle />
              <span className="stu-topbar__title">{title}</span>
            </header>
            <main className="prof-content">
              {error && (
                <div role="alert" className="prof-alert">
                  <span>{error}</span>
                  <button type="button" className="prof-btn" onClick={() => reload()}>다시 불러오기</button>
                </div>
              )}
              {children}
            </main>
          </div>
        )}
      </div>
    </ShellContext.Provider>
  );
}
