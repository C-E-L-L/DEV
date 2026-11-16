import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useSearchParams } from 'react-router-dom';
import { announcementApi, professorAnnouncementApi } from '../api/announcements';
import { useAuth } from '../context/AuthContext';
import { Dialog, RemoteState, dateText, errorMessage, useRemote } from './console/ConsoleUI';
import Icon from './login/icons';
import './Announcements.css';

const AUDIENCES = { ALL: '전체', STUDENT: '학생', EXPERT: '교수' };
const emptyNotice = { title: '', body: '', audience: 'ALL', urgent: false };

export default function Announcements({ manage = false, compact = true }) {
  const { user } = useAuth();
  const canWrite = manage && ['ADMIN', 'EXPERT'].includes(user?.role);
  const api = user?.role === 'EXPERT' ? professorAnnouncementApi : announcementApi;
  const canEdit = notice => canWrite && (user.role === 'ADMIN' || notice.author === user.username);
  const request = useRemote(canWrite ? api.manage : announcementApi.list, [canWrite, user?.role, user?.username]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') request.reload(); };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [request.reload]);
  const [reading, setReading] = useState(null);
  const [all, setAll] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const initialEdit = useRef(null);
  const dirty = editing && ['title', 'body', 'audience', 'urgent'].some(key => editing[key] !== initialEdit.current?.[key]);
  const blocker = useBlocker(useCallback(({ currentLocation, nextLocation }) =>
    Boolean(dirty || busy) && currentLocation.pathname !== nextLocation.pathname, [dirty, busy]));
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (busy) { blocker.reset(); return; }
    if (window.confirm('저장하지 않은 공지가 있습니다. 작성 내용을 버리고 이동할까요?')) blocker.proceed();
    else blocker.reset();
  }, [blocker, busy]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy]);
  useEffect(() => {
    if (request.data) setReading(current => current ? request.data.find(notice => notice.id === current.id) || null : null);
  }, [request.data]);
  const notices = request.data || [];
  // ?notice=<id> (from the notification bell) opens that notice once the list is loaded.
  const [params, setParams] = useSearchParams();
  const noticeId = params.get('notice');
  useEffect(() => {
    if (!noticeId || !request.data) return;
    const found = request.data.find(notice => String(notice.id) === noticeId);
    if (found) { setAll(false); setReading(found); }
    setParams(current => { const next = new URLSearchParams(current); next.delete('notice'); return next; }, { replace: true });
  }, [noticeId, request.data, setParams]);
  const closeEdit = () => {
    if (pending.current) return;
    if (dirty && !window.confirm('작성 중인 공지를 닫을까요? 저장하지 않은 내용은 사라집니다.')) return;
    setEditing(null); setError('');
  };
  const beginEdit = notice => {
    if (pending.current || !canWrite || (notice.id && !canEdit(notice))) return;
    initialEdit.current = { ...notice };
    setEditing({ ...notice }); setReading(null); setError(''); setMessage('');
  };
  const save = async event => {
    event.preventDefault();
    if (pending.current || !canWrite || !editing || (editing.id && !canEdit(editing))) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const payload = { title: editing.title.trim(), body: editing.body.trim(), audience: editing.audience, urgent: editing.urgent };
      if (editing.id) await api.update(editing.id, payload); else await api.create(payload);
      setEditing(null); setMessage(editing.id ? '공지를 수정했습니다.' : '공지를 게시했습니다.'); request.reload();
    } catch (e) { setError(errorMessage(e)); } finally { pending.current = false; setBusy(false); }
  };
  const remove = async notice => {
    if (pending.current || !canEdit(notice)) return;
    if (!window.confirm(`공지 “${notice.title}”을 삭제할까요?`)) return;
    pending.current = true; setBusy(true); setError('');
    try { await api.delete(notice.id); setReading(null); setMessage('공지를 삭제했습니다.'); request.reload(); }
    catch (e) { setError(errorMessage(e)); } finally { pending.current = false; setBusy(false); }
  };
  const list = items => <div className="notice-list">{items.map(notice => <button type="button" className="notice-item" key={notice.id} disabled={busy} onClick={() => { setAll(false); setReading(notice); setError(''); }}>
    <span className="notice-meta"><span className="notice-tags"><span className={`notice-badge${notice.urgent ? ' is-urgent' : ''}`}>{notice.urgent ? '긴급' : '안내'} · {AUDIENCES[notice.audience]}</span>{canWrite && notice.author === user.username && <span className="notice-owner">내 공지</span>}</span><time dateTime={notice.createdAt}>{dateText(notice.createdAt)}</time></span>
    <strong>{notice.title}</strong><span className="notice-preview">{notice.body}</span>
  </button>)}</div>;
  return <section className="notice-board">
    <header className="notice-head"><h2><Icon name="bell" size={18} />공지사항</h2>{canWrite && <button type="button" className="notice-action" disabled={busy} onClick={() => beginEdit(emptyNotice)}>공지 등록</button>}</header>
    {message && <p role="status" className="notice-message">{message}</p>}
    {!editing && !reading && error && <p role="alert" className="adm-error">{error}</p>}
    <RemoteState state={request} empty={false}>{notices.length ? list(compact ? notices.slice(0, 3) : notices) : <p className="notice-empty">등록된 공지가 없습니다.</p>}</RemoteState>
    {compact && notices.length > 3 && <button type="button" className="notice-all" onClick={() => setAll(true)}>전체 공지 {notices.length}개 보기 →</button>}
    {all && <Dialog title="전체 공지사항" onClose={() => setAll(false)}>{list(notices)}</Dialog>}
    {reading && <Dialog title="공지사항" onClose={() => { if (!pending.current) { setReading(null); setError(''); } }}>
      <span className={`notice-badge${reading.urgent ? ' is-urgent' : ''}`}>{reading.urgent ? '긴급' : '안내'} · {AUDIENCES[reading.audience]}</span>
      <h3>{reading.title}</h3><p className="notice-date">{dateText(reading.createdAt)} · {reading.author}</p>
      <div className="notice-body">{reading.body}</div>
      {reading.updatedAt !== reading.createdAt && <p className="notice-date">수정 {dateText(reading.updatedAt)}</p>}
      {error && <p role="alert" className="adm-error">{error}</p>}
      {canEdit(reading) && <div className="adm-actions"><button type="button" disabled={busy} onClick={() => beginEdit(reading)}>수정</button><button type="button" className="is-danger" disabled={busy} onClick={() => remove(reading)}>삭제</button></div>}
    </Dialog>}
    {editing && <Dialog title={editing.id ? '공지 수정' : '공지 등록'} onClose={closeEdit}>
      <form onSubmit={save} className="console-form">
        <label>제목<input required maxLength={200} value={editing.title} disabled={busy} onChange={e => setEditing(v => ({ ...v, title: e.target.value }))} /></label>
        <label>대상<select aria-label="대상" value={editing.audience} disabled={busy} onChange={e => setEditing(v => ({ ...v, audience: e.target.value }))}>{Object.entries(AUDIENCES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="console-check"><input type="checkbox" checked={editing.urgent} disabled={busy} onChange={e => setEditing(v => ({ ...v, urgent: e.target.checked }))} />긴급 공지로 표시</label>
        <label>본문<textarea aria-label="본문" required rows={8} maxLength={10000} value={editing.body} disabled={busy} onChange={e => setEditing(v => ({ ...v, body: e.target.value }))} /></label>
        {error && <p role="alert" className="adm-error">{error}</p>}
        <p className="notice-date">저장하면 선택한 대상에게 즉시 공개됩니다.</p>
        <div className="adm-actions"><button type="submit" className="adm-primary" disabled={busy || !editing.title.trim() || !editing.body.trim()}>{busy ? '저장 중…' : '게시하기'}</button><button type="button" disabled={busy} onClick={closeEdit}>취소</button></div>
      </form>
    </Dialog>}
  </section>;
}
