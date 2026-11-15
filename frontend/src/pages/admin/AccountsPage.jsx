import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api';
import { Dialog, RemoteState, dateText, errorMessage } from '../../components/console/ConsoleUI';
import Icon from '../../components/login/icons';
import { useAdminData } from './AdminData';

export const STATUS_LABELS = { ACTIVE: '활성', PENDING: '승인 대기', REJECTED: '가입 거절', INACTIVE: '비활성' };
const ROLE_LABELS = { STUDENT: '학생', EXPERT: '교수' };
export function StatusBadge({ status }) { return <span className={`adm-badge is-${status?.toLowerCase()}`}>{STATUS_LABELS[status] || status}</span>; }

export function AccountTable({ compact = false, role = '' }) {
  const { users, refresh } = useAdminData();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(() => compact ? '' : params.get('status') || '');
  const [roleFilter, setRoleFilter] = useState(role);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { setRoleFilter(role); setPage(1); }, [role]);
  useEffect(() => { if (!compact) setStatus(params.get('status') || ''); }, [params, compact]);
  useEffect(() => { setPage(1); }, [query, status, roleFilter]);
  useEffect(() => {
    if (selected) {
      const updated = users.data?.find(user => user.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [users.data]);
  const filtered = useMemo(() => (users.data || []).filter(user => (!roleFilter || user.role === roleFilter)
    && (!status || user.status === status) && `${user.username} ${user.name || ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a,b) => (b.id || 0) - (a.id || 0)), [users.data, roleFilter, status, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const shown = compact ? filtered.slice(0, 5) : filtered.slice((currentPage - 1) * 20, currentPage * 20);
  const perform = async (action, text, close = false) => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); setMessage(text); refresh(); if (close) setSelected(null); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  const changeStatus = next => {
    if (!window.confirm(`${selected.name || selected.username} 계정을 ‘${STATUS_LABELS[next]}’ 상태로 변경할까요?`)) return;
    perform(() => adminApi.updateUserStatus(selected.id, next), '계정 상태를 변경했습니다.');
  };
  const create = event => {
    event.preventDefault();
    if (new TextEncoder().encode(creating.password).length > 72) { setError('비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.'); return; }
    perform(async () => { await adminApi.createUser(creating); setCreating(null); }, '계정을 생성했습니다.');
  };
  const savePassword = event => {
    event.preventDefault();
    if (password !== confirmation) { setError('새 비밀번호와 확인값이 일치하지 않습니다.'); return; }
    if (new TextEncoder().encode(password).length > 72) { setError('비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.'); return; }
    perform(async () => { await adminApi.changePassword(selected.id, password); setPassword(''); setConfirmation(''); }, '비밀번호를 변경했습니다. 해당 계정은 다시 로그인해야 합니다.');
  };
  const open = user => { setSelected(user); setError(''); setMessage(''); setPassword(''); setConfirmation(''); };
  return <section className="adm-card">
    <header className="adm-card-head"><h2><Icon name="users" size={18} />계정 관리 현황 <small>{users.data ? `${users.data.length}명` : ''}</small></h2>
      {!compact && <button className="adm-primary" onClick={() => { setCreating({ username: '', name: '', role: role || 'STUDENT', password: '' }); setError(''); }}><Icon name="userPlus" size={14} />계정 생성</button>}
    </header>
    <div className="adm-filters">
      {!compact && <label className="adm-search"><Icon name="search" size={15} /><input placeholder="이름·아이디 검색" aria-label="계정 검색" value={query} onChange={e => setQuery(e.target.value)} /></label>}
      <select aria-label="계정 역할" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}><option value="">전체 역할</option><option value="STUDENT">학생</option><option value="EXPERT">교수</option></select>
      <select aria-label="계정 상태" value={status} onChange={e => { setStatus(e.target.value); if (!compact) setParams(e.target.value ? { status: e.target.value } : {}, { replace:true }); }}><option value="">전체 상태</option>{Object.entries(STATUS_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
    </div>
    {message && <p role="status" className="adm-success">{message}</p>}
    {!selected && !creating && error && <p role="alert" className="adm-error">{error}</p>}
    <RemoteState state={users} empty={!filtered.length}>
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>사용자 / 계정</th><th>역할</th><th>가입일</th><th>상태</th><th>관리</th></tr></thead><tbody>
        {shown.map(user => <tr key={user.id}><td><div className="adm-person"><span className={`adm-avatar is-${user.role.toLowerCase()}`}>{(user.name || user.username).slice(0,2)}</span><span><strong>{user.name || user.username}</strong><small>{user.username}</small></span></div></td><td>{ROLE_LABELS[user.role]}</td><td className="adm-muted">{dateText(user.createdAt)}</td><td><StatusBadge status={user.status} /></td><td><button className={user.status === 'PENDING' ? 'adm-primary' : 'adm-ghost'} onClick={() => open(user)}>{user.status === 'PENDING' ? '승인 검토' : '상세'}</button></td></tr>)}
      </tbody></table></div>
    </RemoteState>
    <footer className="adm-card-foot"><span>{users.data && !users.error ? `${filtered.length}명${compact ? ' 중 최근 등록 계정' : ''}` : ''}</span>{compact ? <Link to="/admin/accounts">전체 계정 관리 →</Link> : <div className="adm-pagination"><button disabled={currentPage <= 1} onClick={() => setPage(currentPage-1)}>이전</button><span>{currentPage} / {pages}</span><button disabled={currentPage >= pages} onClick={() => setPage(currentPage+1)}>다음</button></div>}</footer>
    {selected && <Dialog title="계정 상세" onClose={() => { if (!busy) setSelected(null); }}>
      <div className="adm-account-detail"><span className="adm-avatar">{(selected.name || selected.username).slice(0,2)}</span><div><h3>{selected.name || selected.username}</h3><p>{selected.username} · {ROLE_LABELS[selected.role]}</p></div><StatusBadge status={selected.status} /></div>
      <p className="adm-muted">가입 {dateText(selected.createdAt)}</p>
      <div className="adm-actions">{selected.status !== 'ACTIVE' && <button disabled={busy} onClick={() => changeStatus('ACTIVE')}>승인 / 활성화</button>}{selected.status === 'PENDING' && <button disabled={busy} onClick={() => changeStatus('REJECTED')}>가입 거절</button>}{selected.status === 'ACTIVE' && <button disabled={busy} onClick={() => changeStatus('INACTIVE')}>비활성화</button>}<button className="is-danger" disabled={busy} onClick={() => { if (window.confirm(`${selected.username} 계정을 삭제할까요?`)) perform(() => adminApi.deleteUser(selected.username), '계정을 삭제했습니다.', true); }}>계정 삭제</button></div>
      <hr className="adm-divider" /><h3>비밀번호 변경</h3>
      {selected.passwordManagedBySettings ? <p className="adm-info">기본 로컬 계정입니다. settings.json의 adminPassword를 수정하고 로컬 서버를 재시작하면 반영됩니다.</p> : <form className="console-form" onSubmit={savePassword}>
        <label>새 비밀번호<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label>
        <label>새 비밀번호 확인<input type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></label>
        <span className="adm-muted">8자 이상, UTF-8 기준 72바이트 이하. 변경하면 기존 로그인이 만료됩니다.</span><div className="adm-actions"><button className="adm-primary" disabled={busy} type="submit">비밀번호 변경</button></div>
      </form>}
      {message && <p role="status" className="adm-success">{message}</p>}{error && <p role="alert" className="adm-error">{error}</p>}
    </Dialog>}
    {creating && <Dialog title="계정 생성" onClose={() => { if (!busy) setCreating(null); }}><form className="console-form" onSubmit={create}>
      <label>역할<select value={creating.role} onChange={e => setCreating(v => ({...v,role:e.target.value}))}><option value="STUDENT">학생</option><option value="EXPERT">교수</option></select></label>
      <label>{creating.role === 'STUDENT' ? '학번 / 아이디' : '아이디'}<input required maxLength={100} value={creating.username} onChange={e => setCreating(v => ({...v,username:e.target.value.trim()}))} /></label>
      <label>이름{creating.role === 'EXPERT' && ' (선택)'}<input required={creating.role === 'STUDENT'} maxLength={100} value={creating.name} onChange={e => setCreating(v => ({...v,name:e.target.value}))} /></label>
      <label>초기 비밀번호<input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={creating.password} onChange={e => setCreating(v => ({...v,password:e.target.value}))} /></label>
      {error && <p className="adm-error" role="alert">{error}</p>}<div className="adm-actions"><button type="submit" className="adm-primary" disabled={busy}>{busy ? '생성 중…' : '계정 생성'}</button></div>
    </form></Dialog>}
  </section>;
}

export default function AccountsPage({ role }) {
  return <><div className="prof-page-head"><div><span className="adm-eyebrow">ACCOUNT MANAGEMENT</span><h1>{role === 'EXPERT' ? '교수' : role === 'STUDENT' ? '학생' : '전체'} 계정 관리</h1><p>계정을 생성하고 가입 승인·상태·비밀번호를 관리합니다.</p></div>{role !== 'EXPERT' && <Link to="/admin/students/register" className="prof-btn">학생 명단 / CSV 등록 →</Link>}</div><AccountTable key={role} role={role} /></>;
}
