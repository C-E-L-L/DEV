import { useEffect, useState } from 'react';
import { reportApi } from '../api/reports';
import { REPORT_REASONS, imageUrl } from '../constants';
import AuthImage from './AuthImage';
import SpeciesBadge from './SpeciesBadge';
import './ReportsPanel.css';

const date = value => value ? new Date(value).toLocaleString('ko-KR') : '-';

function ReportCard({ item, student, onReply }) {
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const replies = item.replies || [];
  const save = async event => {
    event.preventDefault();
    if (saving || !message.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await reportApi.reply(item.id, message.trim());
      onReply(item.id, data);
      setMessage('');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || '답변을 등록하지 못했습니다. 다시 시도해주세요.');
    } finally { setSaving(false); }
  };
  return <article className="report-card">
    <div className="report-heading">
      {item.cropFilename && <AuthImage src={imageUrl.crop(item.cropFilename)} alt={`Cell #${item.cropId}`} style={{ width: 84, height: 84, objectFit: 'contain', borderRadius: 6 }} />}
      <div className="report-context">
        <strong>Task #{item.taskId} · Cell #{item.cropId}</strong>
        <SpeciesBadge name={item.speciesName} code={item.speciesCode} compact />
        <span>{!student && `Student: ${item.studentId} · `}{date(item.createdAt)}</span>
      </div>
      <span className={`report-status ${replies.length ? 'answered' : ''}`}>{replies.length ? 'Answered' : 'Awaiting reply'}</span>
    </div>
    <p className="report-text">{item.reason}</p>
    {replies.map(reply => <div className="report-reply" key={reply.id}>
      <div className="report-reply-author"><strong>{reply.authorName || reply.authorUsername}</strong> · {reply.authorRole === 'ADMIN' ? 'Admin' : 'Professor'} <span>{date(reply.createdAt)}</span></div>
      <p className="report-text">{reply.message}</p>
    </div>)}
    {!replies.length && student && <p className="report-muted">교수 또는 관리자의 답변을 기다리고 있습니다.</p>}
    {!student && (editing ? <form onSubmit={save} className="report-form">
      <label htmlFor={`reply-${item.id}`}>Reply</label>
      <textarea id={`reply-${item.id}`} rows={4} maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} disabled={saving} placeholder="학생에게 전달할 답변을 입력하세요." required />
      <div className="report-actions"><span className="report-muted">{message.length} / 4000 · 학생의 My Page에 표시됩니다.</span>
        <button type="submit" disabled={saving || !message.trim()}>{saving ? 'Saving…' : 'Send reply'}</button>
        <button type="button" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
      </div>
      {error && <p role="alert" className="report-error">{error}</p>}
    </form> : <button type="button" onClick={() => setEditing(true)}>{replies.length ? 'Add reply' : 'Reply'}</button>)}
  </article>;
}

export default function ReportsPanel({ student = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setError('');
    (student ? reportApi.getMine() : reportApi.getAll())
      .then(({ data }) => { if (!canceled) setItems(data || []); })
      .catch(() => { if (!canceled) setError('신고 및 질문을 불러오지 못했습니다. 다시 시도해주세요.'); })
      .finally(() => { if (!canceled) setLoading(false); });
    return () => { canceled = true; };
  }, [student, refresh]);
  const filtered = items.filter(item => {
    const answered = Boolean(item.replies?.length);
    const reasonCategory = REPORT_REASONS.find(reason => item.reason === reason || item.reason?.startsWith(`${reason}:`)) || '기타';
    return (status === 'all' || (status === 'answered' ? answered : !answered))
      && (category === 'all' || category === reasonCategory)
      && `${item.studentId} ${item.taskId} ${item.cropId} ${item.reason}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  const onReply = (id, reply) => setItems(current => current.map(item => item.id === id ? { ...item, replies: [...(item.replies || []), reply] } : item));
  return <section className="reports-panel">
    <div className="report-actions"><h3>{student ? 'My Reports & Questions' : 'Reports & Questions'}</h3><button disabled={loading} onClick={() => setRefresh(v => v + 1)}>Refresh</button></div>
    <p className="report-muted">{student ? '내가 보낸 신고·질문과 교수 또는 관리자의 답변을 확인하세요.' : '학생의 신고·질문에 답변하면 해당 학생의 My Page에서 확인할 수 있습니다.'}</p>
    <div className="report-filters">
      <label>Status <select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All</option><option value="pending">Awaiting reply</option><option value="answered">Answered</option></select></label>
      <label>Category <select value={category} onChange={e => setCategory(e.target.value)}><option value="all">All</option>{REPORT_REASONS.map(reason => <option key={reason}>{reason}</option>)}</select></label>
      <input aria-label="Search reports" placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)} />
      {!loading && !error && <span className="report-muted">{filtered.length} reports · {items.filter(item => !item.replies?.length).length} awaiting reply</span>}
    </div>
    {loading ? <p role="status">Loading…</p> : error ? <p role="alert" className="report-error">{error} <button onClick={() => setRefresh(v => v + 1)}>Retry</button></p> : filtered.length === 0 ? <p className="report-empty">{items.length ? '조건에 맞는 신고·질문이 없습니다.' : '아직 접수된 신고·질문이 없습니다.'}</p> : filtered.map(item => <ReportCard key={item.id} item={item} student={student} onReply={onReply} />)}
  </section>;
}
