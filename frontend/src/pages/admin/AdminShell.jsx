import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/login/icons';
import { WorkspaceChromeProvider, isWorkspacePath } from '../../components/console/WorkspaceChrome';
import logoUrl from '../../assets/login/cell-logo.svg';
import NotificationBell from '../professor/NotificationBell';
import { useProfessorData } from '../professor/ProfessorData';
import { useAdminData } from './AdminData';

const NAV = [
  { title:'메인 콘솔', items:[['대시보드','grid','/admin',true]] },
  { title:'데이터 관리', items:[['도말 데이터','database','/admin/data/smears'],['세포 데이터','microscope','/admin/data/crops'],['데이터 업로드','upload','/admin/assignments/new?kind=practice'],['라벨 검수','checkCircle','/admin/data/review']] },
  { title:'과제 운영', items:[['전체 과제','layers','/admin/assignments',true],['임시저장 과제','edit','/admin/assignments/drafts'],['진행 중 과제','clipboard','/admin/assignments/active'],['완료된 과제','checkCircle','/admin/assignments/completed'],['과제 만들기','plusCircle','/admin/assignments/new']] },
  { title:'계정 관리', items:[['학생 계정','school','/admin/accounts/students'],['교수 계정','users','/admin/accounts/professors'],['학생 명단 등록','userPlus','/admin/students/register']] },
  { title:'통계 및 분석', items:[['학생별 성적','chart','/admin/students',true],['전체 응답 통계','barChart','/admin/statistics/cells'],['과제 수행률','clipboard','/admin/students/progress'],['혼동행렬','grid','/admin/statistics/matrix']] },
  { title:'운영 관리', items:[['질문·신고','help','/admin/reports'],['공지사항','bell','/admin/announcements'],['데이터 설정','settings','/admin/settings']] },
];

export default function AdminShell({ children }) {
  const { user, logout } = useAuth();
  const { pathname, search } = useLocation();
  const { users } = useAdminData();
  const pendingStudents = users.error ? 0 : (users.data || []).filter(u => u.role === 'STUDENT' && u.status === 'PENDING').length;
  const { error, reload, activity } = useProfessorData();
  const [collapsed,setCollapsed]=useState(()=>{try{return localStorage.getItem('cell-admin-sidebar-collapsed')==='1';}catch{return false;}});
  const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width: 900px)').matches);
  const [drawer,setDrawer]=useState(false);
  useEffect(()=>{const media=window.matchMedia('(max-width: 900px)');const change=()=>setMobile(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
  useEffect(()=>{setDrawer(false);document.querySelector('.adm-main')?.scrollTo(0,0);},[pathname,search]);
  useEffect(()=>{if(!drawer)return;const listener=e=>{if(e.key==='Escape')setDrawer(false);};document.addEventListener('keydown',listener);return()=>document.removeEventListener('keydown',listener);},[drawer]);
  const toggle=()=>{if(mobile)setDrawer(v=>!v);else setCollapsed(v=>{try{localStorage.setItem('cell-admin-sidebar-collapsed',v?'0':'1');}catch{}return !v;});};
  const label=NAV.flatMap(group=>group.items).find(item=>item[2].split('?')[0]===pathname && (item[0]!=='데이터 업로드'||search.includes('kind=practice')))?.[0] || (pathname === '/admin/accounts' ? '전체 계정 관리' : '과제 상세');
  const name=user.name||user.username;
  return <div className={`prof-shell adm-shell${collapsed&&!mobile?' is-collapsed':''}${mobile?' is-mobile':''}${drawer?' is-drawer-open':''}`}>
    <aside id="admin-sidebar" className="adm-sidebar" aria-label="관리자 메뉴">
      <Link className="adm-brand" to="/admin"><img src={logoUrl} alt="CELL"/><span>CELL <b>VET-AI</b><small>ADMIN WORKSPACE</small></span></Link>
      <nav className="adm-nav">{NAV.map(group=><div key={group.title}><p className="adm-nav-group">{group.title}</p>{group.items.map(([title,icon,to,end])=><NavLink key={title} to={to} end={end || to.includes('/new')} title={collapsed?title:undefined} className={({isActive})=>`adm-nav-link${isActive&&(title!=='데이터 업로드'||search.includes('kind=practice'))&&(title!=='과제 만들기'||!search.includes('kind=practice'))?' is-active':''}`}><Icon name={icon} size={17}/><span>{title}</span>{title==='학생 계정'&&pendingStudents>0&&<small>{pendingStudents}</small>}{title==='질문·신고'&&activity.unansweredReports>0&&<small>{activity.unansweredReports}</small>}</NavLink>)}</div>)}</nav>
      <div className="adm-sidebar-foot"><Link className="adm-game" to="/game" title="관리자 전용 게임"><Icon name="play" size={14}/><span>관리자 게임</span></Link><div className="adm-profile"><span className="adm-avatar">{name.slice(0,1)}</span><span><strong>{name}</strong><small>관리자 · {user.username}</small></span><button type="button" onClick={logout} title="로그아웃" aria-label="로그아웃"><Icon name="logout" size={17}/></button></div></div>
    </aside>
    {mobile&&drawer&&<button className="adm-sidebar-backdrop" aria-label="메뉴 닫기" onClick={()=>setDrawer(false)}/>}
    {/* Labeling and results screens are full height with their own header. */}
    {isWorkspacePath(pathname)?<WorkspaceChromeProvider value={{toggleSidebar:toggle,sidebarShown:mobile?drawer:!collapsed,sidebarId:'admin-sidebar',account:<><NotificationBell/><span className="adm-topbar-profile"><span className="adm-avatar">{name.slice(0,1)}</span><span>{name}<small>시스템 관리자</small></span></span></>}}>{children}</WorkspaceChromeProvider>:
    <div className="adm-main"><header className="adm-topbar"><div><button type="button" className="adm-icon-button" aria-label={mobile?(drawer?'메뉴 닫기':'메뉴 열기'):(collapsed?'사이드바 펼치기':'사이드바 접기')} aria-controls="admin-sidebar" aria-expanded={mobile?drawer:!collapsed} onClick={toggle}><Icon name="panelLeft" size={18}/></button><span className="adm-console-badge">ADMIN CONSOLE</span><span className="adm-topbar-page">{label}</span></div><div><NotificationBell/><span className="adm-topbar-profile"><span className="adm-avatar">{name.slice(0,1)}</span><span>{name}<small>시스템 관리자</small></span></span></div></header>
      <main className="adm-content">{error&&<div role="alert" className="adm-error">{error} <button onClick={()=>reload()}>다시 불러오기</button></div>}{children}</main>
    </div>}
  </div>;
}
