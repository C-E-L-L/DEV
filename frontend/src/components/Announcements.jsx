import { useEffect, useState } from 'react';
import { announcementApi } from '../api/announcements';
import { Dialog, RemoteState, dateText, errorMessage, useRemote } from './console/ConsoleUI';
import Icon from './login/icons';
import './Announcements.css';

const AUDIENCES = { ALL: '전체', STUDENT: '학생', EXPERT: '교수' };
const emptyNotice = { title: '', body: '', audience: 'ALL', urgent: false };

export default function Announcements({ manage = false, compact = true }) {
  const request = useRemote(manage ? announcementApi.manage : announcementApi.list, [manage]);
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
  const notices = request.data || [];
  const closeEdit = () => {
    if (busy) return;
    if (editing && (editing.title || editing.body) && !window.confirm('작성 중인 공지를 닫을까요? 저장하지 않은 내용은 사라집니다.')) return;
    setEditing(null); setError('');
  };
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { title: editing.title.trim(), body: editing.body.trim(), audience: editing.audience, urgent: editing.urgent };
      if (editing.id) await announcementApi.update(editing.id, payload); else await announcementApi.create(payload);
      setEditing(null); setMessage('공지를 게시했습니다.'); request.reload();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  const remove = async notice => {
    if (!window.confirm(`공지 “${notice.title}”을 삭제할까요?`)) return;
    setBusy(true); setError('');
    try { await announcementApi.delete(notice.id); setReading(null); setMessage('공지를 삭제했습니다.'); request.reload(); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  const list = items => <div className="notice-list">{items.map(notice => <button type="button" className="notice-item" key={notice.id} onClick={() => { setAll(false); setReading(notice); }}>
    <span className="notice-meta"><span className={`notice-badge${notice.urgent ? ' is-urgent' : ''}`}>{notice.urgent ? '긴급' : '안내'} · {AUDIENCES[notice.audience]}</span><time>{dateText(notice.createdAt)}</time></span>
    <strong>{notice.title}</strong><span className="notice-preview">{notice.body}</span>
  </button>)}</div>;
  return <section className="notice-board">
    <header className="notice-head"><h2><Icon name="bell" size={18} />공지사항</h2>{manage && <button className="notice-action" onClick={() => { setEditing({ ...emptyNotice }); setError(''); }}>공지 등록</button>}</header>
    {message && <p role="status" className="notice-message">{message}</p>}
    {!editing && error && <p role="alert" className="adm-error">{error}</p>}
    <RemoteState state={request} empty={!notices.length}>{list(compact ? notices.slice(0, 3) : notices)}</RemoteState>
    {compact && notices.length > 3 && <button type="button" className="notice-all" onClick={() => setAll(true)}>전체 공지 {notices.length}개 보기 →</button>}
    {all && <Dialog title="전체 공지사항" onClose={() => setAll(false)}>{list(notices)}</Dialog>}
    {reading && <Dialog title="공지사항" onClose={() => setReading(null)}>
      <span className={`notice-badge${reading.urgent ? ' is-urgent' : ''}`}>{reading.urgent ? '긴급' : '안내'} · {AUDIENCES[reading.audience]}</span>
      <h3>{reading.title}</h3><p className="notice-date">{dateText(reading.createdAt)} · {reading.author}</p>
      <div className="notice-body">{reading.body}</div>
      {reading.updatedAt !== reading.createdAt && <p className="notice-date">수정 {dateText(reading.updatedAt)}</p>}
      {manage && <div className="adm-actions"><button onClick={() => { setEditing({ ...reading }); setReading(null); setError(''); }}>수정</button><button className="is-danger" disabled={busy} onClick={() => remove(reading)}>삭제</button></div>}
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
