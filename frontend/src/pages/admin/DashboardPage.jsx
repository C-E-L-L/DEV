import { useState } from 'react';
import { Link } from 'react-router-dom';
import Announcements from '../../components/Announcements';
import Icon from '../../components/login/icons';
import { RemoteState, dateText } from '../../components/console/ConsoleUI';
import { courseworkPhase, submissionSummary } from '../../utils/professorDashboard';
import { weeklySubmissions } from '../../utils/adminDashboard';
import ActivityList from '../professor/ActivityList';
import { useProfessorData } from '../professor/ProfessorData';
import { AccountTable } from './AccountsPage';
import { useAdminData } from './AdminData';
import MatrixPanel from './MatrixPanel';

const COLORS = ['#4935d9','#7e39e9','#157ba1','#c85068','#8c91a8','#e1a92d'];
function DistributionCard() {
  const { dashboard } = useAdminData(); const { species } = useProfessorData();
  const [key, setKey] = useState('');
  const groups = dashboard.data?.distributions || [];
  const keys = groups.map(g => `${g.speciesId}:${g.schema}`);
  const selected = groups[Math.max(0, keys.indexOf(key))];
  const entries = selected ? Object.entries(selected.labels).map(([code,name]) => ({code,name,count:selected.counts[code] || 0})) : [];
  const total = entries.reduce((sum,item) => sum+item.count,0);
  return <section className="adm-card">
    <header className="adm-card-head"><h2><Icon name="layers" size={18} />확정 라벨 누적 분포 <small>{dashboard.data && !dashboard.error ? `${total.toLocaleString()}개 문항` : '—'}</small></h2></header>
    <RemoteState state={dashboard}>
      <div className="adm-card-body">
        {groups.length > 0 && <select className="adm-distribution-select" aria-label="라벨 분포 종·클래스 구성" value={keys.includes(key)?key:keys[0]} onChange={e => setKey(e.target.value)}>{groups.map((g,i) => <option key={keys[i]} value={keys[i]}>{species.find(s => s.id===g.speciesId)?.name || '종 미지정'} · {Object.values(g.labels).join(' / ')}</option>)}</select>}
        {!total ? <p className="adm-empty">확정된 라벨이 없습니다.</p> : <>
          <div className="adm-distribution-bar" aria-label="클래스별 라벨 분포">{entries.map((item,i) => <span key={item.code} title={`${item.name} ${item.count}개`} style={{width:`${item.count/total*100}%`,background:COLORS[i%COLORS.length]}} />)}</div>
          <div className="adm-distribution-legend">{entries.map((item,i) => <div key={item.code}><span>{item.name}</span><strong style={{color:COLORS[i%COLORS.length]}}>{(item.count/total*100).toFixed(1)}%</strong><small>{item.count.toLocaleString()}개</small></div>)}</div>
        </>}
        <p className="adm-muted">출제 제외를 뺀 정답 확정 문항 기준입니다. 복사된 과제는 각각의 문항으로 집계합니다.</p>
      </div>
    </RemoteState>
  </section>;
}

function TrendCard() {
  const { progress, progressByTask, groups, loading, error } = useProfessorData();
  const weeks = weeklySubmissions(progress);
  const peak = Math.max(1,...weeks.map(row=>row.count));
  const active = groups.filter(group => courseworkPhase(group)==='ACTIVE');
  const summaries = active.map(group => submissionSummary(progressByTask.get(group.id), progress.students));
  const submitted = summaries.reduce((sum,s)=>sum+s.submitted,0), total = summaries.reduce((sum,s)=>sum+s.total,0);
  const points = weeks.map((row,i) => `${20+i*74},${130-row.count/peak*95}`).join(' ');
  return <section className="adm-card"><header className="adm-card-head"><h2><Icon name="chart" size={18} />과제 수행률 및 제출 추이</h2><span className="adm-badge">최근 8주</span></header>
    {loading ? <p className="adm-empty" role="status">제출 현황을 불러오는 중…</p> : error ? <p role="alert" className="adm-error">{error}</p> : <div className="adm-card-body">
      <div className="adm-trend-summary"><div><span>진행 중 과제 제출률</span><strong>{total ? `${Math.round(submitted/total*100)}%` : '—'}</strong></div><div><span>최종 제출 / 대상</span><strong className="adm-small-number">{submitted}<small> / {total}건</small></strong></div></div>
      <svg className="adm-trend" viewBox="0 0 560 175" role="img" aria-label={`최근 8주 최종 제출 ${weeks.reduce((s,w)=>s+w.count,0)}건`}><title>{weeks.map(w=>`${w.label} 주 ${w.count}건`).join(', ')}</title><defs><linearGradient id="adm-trend-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7465e8" stopOpacity=".2"/><stop offset="1" stopColor="#7465e8" stopOpacity="0"/></linearGradient></defs>
        {[35,82,130].map(y=><line key={y} x1="18" x2="545" y1={y} y2={y} stroke="#e7e9f7" strokeDasharray="3 4"/>)}
        <polygon points={`20,130 ${points} 538,130`} fill="url(#adm-trend-fill)"/><polyline points={points} fill="none" stroke="#6250e9" strokeWidth="3" strokeLinejoin="round"/>
        {weeks.map((w,i)=><g key={w.label}><circle cx={20+i*74} cy={130-w.count/peak*95} r="4" fill="#fff" stroke="#6250e9" strokeWidth="2"/><text x={20+i*74} y={120-w.count/peak*95} textAnchor="middle" fontSize="10" fill="#6054a2">{w.count}</text><text x={20+i*74} y="158" textAnchor="middle" fontSize="10" fill="#83899d">{w.label}</text></g>)}
      </svg><p className="adm-muted">주별 최종 제출 건수 · 한 학생이 한 과제를 제출하면 1건입니다. 이번 주는 현재까지의 수치입니다.</p>
    </div>}
    <footer className="adm-card-foot"><span>현재 활성 학생 + 가입 허용 명단 기준</span><Link to="/admin/students/progress">미제출자 확인 →</Link></footer></section>;
}

export default function DashboardPage() {
  const { dashboard, refresh } = useAdminData();
  const { activity, activityLoaded, activityError, reloadActivity, reload, loading, error, groups, progress, progressByTask } = useProfessorData();
  const data = !dashboard.error ? dashboard.data : null;
  const kpis = [
    {title:'전체 학생 수',value:data?.students,icon:'school',tone:'blue',text:data ? `승인 대기 ${data.pendingUsers}명 · 비활성 ${data.inactiveUsers}명` : '계정 현황'},
    {title:'전체 교수 수',value:data?.professors,icon:'users',tone:'violet',text:'등록된 교수 계정'},
    {title:'전체 도말 자료 수',value:data?.smears,icon:'microscope',tone:'purple',text:data ? `정답 확정 세포 ${data.confirmedCells.toLocaleString()}개` : '도말과 확정 라벨'},
    {title:'진행 중 실습 과제',value:data?.activeCoursework,icon:'clipboard',tone:'cyan',text:data ? `세포 문항 ${data.cells.toLocaleString()}개` : '진단평가 · 분류 실습'},
  ];
  const missing = groups.filter(g=>courseworkPhase(g)==='ACTIVE' && submissionSummary(progressByTask.get(g.id),progress.students).missing.length>0).length;
  const actions = [
    {to:'/admin/accounts?status=PENDING',label:'승인 대기',number:data?.pendingUsers,icon:'userCheck'},
    {to:'/admin/reports',label:'미답변 질문',number:activityLoaded && !activityError ? activity.unansweredReports : null,icon:'help'},
    {to:'/admin/data/review?scope=PUBLISHED',label:'게시 과제 정답 미확정',number:data?.pendingLabels,icon:'edit'},
    {to:'/admin/students/progress',label:'미제출 학생이 있는 과제',number:!loading&&!error?missing:null,icon:'clock'},
  ];
  return <>
    <div className="adm-dashboard-head"><div><span className="adm-eyebrow">ADMIN CONSOLE <span>플랫폼 운영</span></span><h1>플랫폼 총괄 대시보드</h1><p>계정, 도말 데이터와 학생 학습 현황을 한눈에 확인합니다.</p></div><div className="adm-actions"><button onClick={()=>{refresh();reload({silent:true});reloadActivity();}} disabled={dashboard.loading}><Icon name="refresh" size={14}/>새로고침</button><Link className="adm-button" to="/admin/announcements"><Icon name="bell" size={14}/>공지 등록</Link><Link className="adm-button adm-primary" to="/admin/accounts/students"><Icon name="userPlus" size={14}/>계정 관리</Link></div></div>
    {dashboard.error && <div className="adm-error" role="alert">요약을 불러오지 못했습니다. {dashboard.error} <button onClick={dashboard.reload}>다시 시도</button></div>}
    <div className="adm-kpis">{kpis.map(k=><section key={k.title} className="adm-kpi"><div className="adm-kpi-top"><div><span>{k.title}</span><strong>{k.value == null ? '—' : k.value.toLocaleString()}</strong></div><span className={`adm-kpi-icon is-${k.tone}`}><Icon name={k.icon} size={23}/></span></div><footer>{k.text}</footer></section>)}</div>
    <nav className="adm-quick" aria-label="처리할 일">{actions.map(a=><Link key={a.to} to={a.to}><Icon name={a.icon} size={16}/><span>{a.label}</span><strong>{a.number == null ? '—' : a.number}</strong><Icon name="chevronRight" size={13}/></Link>)}</nav>
    <div className="adm-dashboard-grid"><div className="adm-dashboard-main"><AccountTable compact/><div className="adm-chart-grid"><TrendCard/><MatrixPanel compact/></div><DistributionCard/></div><aside className="adm-dashboard-side"><Announcements manage/>
      <section className="adm-card"><header className="adm-card-head"><h2><Icon name="history" size={18}/>최근 활동</h2><span className="adm-badge">제출 · 질문 · 마감</span></header>
        {activityError ? <p className="adm-error" role="alert">{activityError} <button onClick={reloadActivity}>다시 시도</button></p> : !activityLoaded ? <p className="adm-empty" role="status">활동을 불러오는 중…</p> : <ActivityList events={activity.events} limit={7}/>}
        <footer className="adm-card-foot"><span>1분 간격으로 갱신</span><button onClick={reloadActivity}>새로고침</button></footer>
      </section><div className="adm-dashboard-note"><Icon name="shieldCheck" size={17}/><p>최종 제출한 응답과 확정된 정답을 기준으로 집계합니다.<br/>{data && <>요약 갱신 {dateText(data.updatedAt)}</>}</p></div>
    </aside></div>
  </>;
}
