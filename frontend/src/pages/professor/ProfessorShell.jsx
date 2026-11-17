import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AccountBar from '../../components/console/AccountBar';
import { WorkspaceChromeProvider, isWorkspacePath } from '../../components/console/WorkspaceChrome';
import Icon from '../../components/login/icons';
import NotificationBell from './NotificationBell';
import ProfessorSidebar from './ProfessorSidebar';
import { useProfessorData } from './ProfessorData';

const COLLAPSED_KEY = 'cell-prof-sidebar-collapsed';
const MOBILE_QUERY = '(max-width: 900px)';

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

function readCollapsed() {
  try { return window.localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
}

/**
 * Console frame: sidebar + top bar + scrolling content.
 * Desktop: the sidebar collapses to an icon rail. Narrow screens: it becomes a drawer.
 */
export default function ProfessorShell({ children }) {
  const { pathname } = useLocation();
  const { error, reload } = useProfessorData();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const main = useRef(null);

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
  // Labeling and results screens are full height and bring their own header, like the student workspace.
  const bare = isWorkspacePath(pathname);

  return (
    <div className={`prof-shell${rail ? ' is-rail' : ''}${mobile ? ' is-mobile' : ''}${drawerOpen ? ' is-drawer-open' : ''}`}>
      <ProfessorSidebar rail={rail} id="prof-sidebar" />
      {mobile && drawerOpen && <button type="button" className="prof-backdrop" aria-label="메뉴 닫기" onClick={() => setDrawerOpen(false)} />}

      {bare ? (
        <WorkspaceChromeProvider value={{ toggleSidebar, sidebarShown, sidebarId: 'prof-sidebar', account: <><AccountBar /><NotificationBell /></> }}>
          {children}
        </WorkspaceChromeProvider>
      ) : (
      <div className="prof-main" ref={main}>
        <header className="prof-topbar">
          <button type="button" className="prof-icon-btn" onClick={toggleSidebar} aria-controls="prof-sidebar" aria-expanded={sidebarShown}
            aria-label={sidebarShown ? '사이드바 접기' : '사이드바 펼치기'} title={sidebarShown ? '사이드바 접기' : '사이드바 펼치기'}>
            <Icon name="panelLeft" size={18} />
          </button>

          {/* Global search is designed but not implemented yet: shown disabled with a visible label. */}
          <div className="prof-search" title="전역 검색은 개발 중입니다.">
            <Icon name="search" size={15} />
            <input type="search" disabled placeholder="학생, 과제, 도말 검색" aria-label="전역 검색 (개발중)" />
            <span className="prof-wip">개발중</span>
          </div>

          <div className="prof-topbar__right">
            <AccountBar />
            <NotificationBell />
          </div>
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
  );
}
